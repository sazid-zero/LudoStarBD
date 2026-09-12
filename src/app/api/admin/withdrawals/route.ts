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

    const where: any = { type: "WITHDRAW" };

    if (status !== "ALL") {
      where.status = status;
    }

    if (mfs !== "ALL") {
      where.mfsProvider = mfs;
    }

    if (search) {
      where.OR = [
        { userPhone: { contains: search, mode: "insensitive" } },
        { userName: { contains: search, mode: "insensitive" } },
        { accountNumber: { contains: search, mode: "insensitive" } },
        { adminTrxId: { contains: search, mode: "insensitive" } },
      ];
    }

    const [allWithdrawals, pendingCount, paidAggregate] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
      }),
      prisma.transaction.count({
        where: { type: "WITHDRAW", status: "PENDING" },
      }),
      prisma.transaction.aggregate({
        where: { type: "WITHDRAW", status: "APPROVED" },
        _sum: { amount: true },
      }),
    ]);

    return NextResponse.json({
      withdrawals: allWithdrawals,
      totalCount: allWithdrawals.length,
      pendingCount,
      paidTotal: paidAggregate._sum.amount || 0,
    });
  } catch (error) {
    console.error("Admin withdrawals fetch error:", error);
    return NextResponse.json({ error: "উইথড্র তালিকা আনতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত এক্সেস।" }, { status: 403 });
    }

    const body = await request.json();
    const { transactionId, action, adminTrxId, reason } = body; // action: "APPROVE" | "REJECT"

    if (!transactionId || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json({ error: "সঠিক ট্রানজেকশন ও অ্যাকশন প্রদান করুন।" }, { status: 400 });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction || transaction.type !== "WITHDRAW") {
      return NextResponse.json({ error: "উইথড্র ট্রানজেকশন পাওয়া যায়নি।" }, { status: 404 });
    }

    if (transaction.status !== "PENDING") {
      return NextResponse.json({ error: "এই ট্রানজেকশনটি ইতিপূর্বেই নিষ্পত্তি করা হয়েছে।" }, { status: 400 });
    }

    if (action === "APPROVE") {
      const finalTrxId = adminTrxId?.trim() || `PAY-${Date.now().toString().slice(-6)}`;
      const updated = await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: "APPROVED",
          adminTrxId: finalTrxId,
          note: `এডমিন কর্তৃক পেইড। Payout TrxID: ${finalTrxId}`,
        },
      });

      // Send in-app notification
      await prisma.notification.create({
        data: {
          userId: transaction.userId,
          title: "💸 উইথড্র সফলভাবে প্রদান করা হয়েছে!",
          message: `আপনার ৳${transaction.amount} উইথড্র (${transaction.mfsProvider || "MFS"}) সম্পন্ন হয়েছে। Payout TrxID: ${finalTrxId}।`,
          type: "SUCCESS",
          link: "/wallet",
        },
      });

      return NextResponse.json({
        success: true,
        message: `৳${transaction.amount} উইথড্র সফলভাবে অনুমোদিত ও পেইড মার্ক করা হয়েছে!`,
        transaction: updated,
      });
    } else {
      // Refund money back to user's winBalance atomically with status update
      const rejectNote = reason?.trim() || "উইথড্র বাতিল করা হয়েছে এবং টাকা একাউন্টে ফেরত দেওয়া হয়েছে।";

      const [, updated] = await prisma.$transaction([
        prisma.user.update({
          where: { id: transaction.userId },
          data: {
            winBalance: {
              increment: transaction.amount,
            },
          },
        }),
        prisma.transaction.update({
          where: { id: transactionId },
          data: {
            status: "REJECTED",
            note: rejectNote,
          },
        }),
      ]);

      // Send in-app notification
      await prisma.notification.create({
        data: {
          userId: transaction.userId,
          title: "❌ উইথড্র বাতিল ও ব্যালেন্স রিফান্ড",
          message: `আপনার ৳${transaction.amount} উইথড্র বাতিল হয়েছে এবং টাকা উইনিং ব্যালেন্সে ফেরত দেওয়া হয়েছে। কারণ: ${rejectNote}`,
          type: "ALERT",
          link: "/wallet",
        },
      });

      return NextResponse.json({
        success: true,
        message: "উইথড্র বাতিল করা হয়েছে এবং ইউজারের ব্যালেন্স রিফান্ড করা হয়েছে।",
        transaction: updated,
      });
    }
  } catch (error) {
    console.error("Admin withdrawal error:", error);
    return NextResponse.json({ error: "অ্যাকশন সম্পন্ন করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
