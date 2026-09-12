import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত এক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "ALL";
    const mfs = searchParams.get("mfs") || "ALL";
    const search = (searchParams.get("search") || "").trim();

    const where: any = { type: "DEPOSIT" };

    if (status !== "ALL") {
      where.status = status;
    }

    if (mfs !== "ALL") {
      where.mfsProvider = mfs;
    }

    if (search) {
      where.OR = [
        { trxId: { contains: search, mode: "insensitive" } },
        { userPhone: { contains: search, mode: "insensitive" } },
        { userName: { contains: search, mode: "insensitive" } },
        { accountNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    const [deposits, pendingCount, approvedAggregate] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
      }),
      prisma.transaction.count({
        where: { type: "DEPOSIT", status: "PENDING" },
      }),
      prisma.transaction.aggregate({
        where: { type: "DEPOSIT", status: "APPROVED" },
        _sum: { amount: true },
      }),
    ]);

    return NextResponse.json({
      deposits,
      totalCount: deposits.length,
      pendingCount,
      approvedTotal: approvedAggregate._sum.amount || 0,
    });
  } catch (error) {
    console.error("Admin deposits fetch error:", error);
    return NextResponse.json({ error: "ডিপোজিট তালিকা আনতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত এক্সেস।" }, { status: 403 });
    }

    const body = await request.json();
    const { transactionId, action, reason } = body; // action: "APPROVE" | "REJECT"

    if (!transactionId || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json({ error: "সঠিক ট্রানজেকশন ও অ্যাকশন প্রদান করুন।" }, { status: 400 });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction || (transaction.type !== "DEPOSIT" && transaction.type !== "MATCH_FEE")) {
      return NextResponse.json({ error: "ডিপোজিট/পেমেন্ট ট্রানজেকশন পাওয়া যায়নি।" }, { status: 404 });
    }

    if (transaction.status !== "PENDING") {
      return NextResponse.json({ error: "এই ট্রানজেকশনটি ইতিপূর্বেই নিষ্পত্তি করা হয়েছে।" }, { status: 400 });
    }

    if (action === "APPROVE") {
      // Run balance increment & transaction status update in a transaction
      const ops: any[] = [
        prisma.transaction.update({
          where: { id: transactionId },
          data: {
            status: "APPROVED",
            note: reason?.trim() || "এডমিন কর্তৃক পেমেন্ট সফলভাবে অনুমোদিত হয়েছে",
          },
        }),
      ];

      if (transaction.type === "DEPOSIT") {
        ops.push(
          prisma.user.update({
            where: { id: transaction.userId },
            data: {
              mainBalance: {
                increment: transaction.amount,
              },
            },
          })
        );
      }

      const [updated] = await prisma.$transaction(ops);

      // Send in-app notification
      await prisma.notification.create({
        data: {
          userId: transaction.userId,
          title: "✅ ডিপোজিট সফলভাবে অনুমোদিত!",
          message: `আপনার ৳${transaction.amount} পেমেন্ট (${transaction.mfsProvider || "MFS"}) এডমিন কর্তৃক অনুমোদিত হয়েছে এবং ব্যালেন্সে যুক্ত করা হয়েছে।`,
          type: "SUCCESS",
          link: "/wallet",
        },
      });

      return NextResponse.json({
        success: true,
        message: `৳${transaction.amount} পেমেন্ট সফলভাবে অনুমোদিত হয়েছে!`,
        transaction: updated,
      });
    } else {
      const rejectNote = reason?.trim() || "এডমিন কর্তৃক ডিপোজিট বাতিল করা হয়েছে (ভুল TrxID বা টাকা আসেনি)";
      const updated = await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: "REJECTED",
          note: rejectNote,
        },
      });

      // Send in-app notification
      await prisma.notification.create({
        data: {
          userId: transaction.userId,
          title: "❌ ডিপোজিট রিকোয়েস্ট বাতিল",
          message: `আপনার ৳${transaction.amount} ডিপোজিট বাতিল করা হয়েছে। কারণ: ${rejectNote}`,
          type: "ALERT",
          link: "/wallet",
        },
      });

      return NextResponse.json({
        success: true,
        message: "ডিপোজিট রিকোয়েস্ট বাতিল করা হয়েছে।",
        transaction: updated,
      });
    }
  } catch (error) {
    console.error("Admin deposit error:", error);
    return NextResponse.json({ error: "অ্যাকশন সম্পন্ন করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
