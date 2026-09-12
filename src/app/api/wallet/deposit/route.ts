import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "অননুমোদিত এক্সেস। লগইন করুন।" }, { status: 401 });

    const body = await request.json();
    const { amount, mfsProvider, trxId } = body;
    const sender = (body.senderPhone || body.accountNumber || "").toString().trim();

    const depositAmount = Number(amount);
    if (!depositAmount || depositAmount < 10) {
      return NextResponse.json({ error: "সর্বনিম্ন ডিপোজিটের পরিমাণ ১০ টাকা।" }, { status: 400 });
    }

    if (!mfsProvider || !["BKASH", "NAGAD", "ROCKET"].includes(mfsProvider)) {
      return NextResponse.json({ error: "সঠিক পেমেন্ট মেথড নির্বাচন করুন (বিকাশ, নগদ, অথবা রকেট)।" }, { status: 400 });
    }

    if (!sender || !/^01[3-9]\d{8}$/.test(sender)) {
      return NextResponse.json({ error: "সঠিক ১১ ডিজিটের সেন্ডার মোবাইল নম্বর দিন।" }, { status: 400 });
    }

    if (!trxId || trxId.trim().length < 6) {
      return NextResponse.json({ error: "সঠিক ট্রানজেকশন আইডি (TrxID) দিন।" }, { status: 400 });
    }

    // Prevent duplicate TrxID
    const dupTrx = await prisma.transaction.findFirst({ where: { trxId: trxId.trim() } });
    if (dupTrx) {
      return NextResponse.json({ error: "এই ট্রানজেকশন আইডি ইতিমধ্যে ব্যবহৃত হয়েছে।" }, { status: 409 });
    }

    // Check if SMS already arrived and is unclaimed
    const matchedSms = await prisma.receivedSms.findFirst({
      where: {
        trxId: { equals: trxId.trim(), mode: "insensitive" },
        isClaimed: false,
      },
    });

    if (matchedSms && matchedSms.amount >= depositAmount && matchedSms.mfsProvider === mfsProvider) {
      // ✅ Instant Auto-Approval via matched pre-received SMS!
      const [tx] = await prisma.$transaction([
        prisma.transaction.create({
          data: {
            userId: user.id,
            userName: `${user.firstName} ${user.lastName}`,
            userPhone: user.phone,
            type: "DEPOSIT",
            amount: depositAmount,
            status: "APPROVED",
            mfsProvider: mfsProvider as any,
            accountNumber: sender,
            trxId: trxId.trim(),
            note: `স্বয়ংক্রিয় যাচাই সম্পন্ন (SMS Matching)। TrxID: ${trxId.trim()}`,
          },
        }),
        prisma.user.update({
          where: { id: user.id },
          data: { mainBalance: { increment: depositAmount } },
        }),
        prisma.receivedSms.update({
          where: { id: matchedSms.id },
          data: {
            isClaimed: true,
            claimedBy: user.id,
            claimedAt: new Date(),
          },
        }),
        prisma.notification.create({
          data: {
            userId: user.id,
            title: `✅ ডিপোজিট অনুমোদিত — ৳${depositAmount}`,
            message: `আপনার ৳${depositAmount} ${mfsProvider} ডিপোজিট (TrxID: ${trxId.trim()}) স্বয়ংক্রিয়ভাবে অনুমোদিত হয়েছে এবং ব্যালেন্সে যোগ হয়েছে।`,
            type: "DEPOSIT",
            link: "/wallet",
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        autoApproved: true,
        message: `৳${depositAmount} ডিপোজিট তাত্ক্ষণিকভাবে স্বয়ংক্রিয়ভাবে অনুমোদিত হয়েছে এবং আপনার ব্যালেন্সে যোগ করা হয়েছে!`,
        transaction: { id: tx.id, amount: tx.amount, status: tx.status },
      });
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        userPhone: user.phone,
        type: "DEPOSIT",
        amount: depositAmount,
        status: "PENDING",
        mfsProvider: mfsProvider as any,
        accountNumber: sender,
        trxId: trxId.trim(),
        note: `${mfsProvider} থেকে ${depositAmount} টাকা ডিপোজিট রিকোয়েস্ট (এডমিন যাচাই পেন্ডিং)`,
      },
    });

    // Notify admins
    await prisma.notification.create({
      data: {
        userId: "ALL",
        title: `💰 নতুন ডিপোজিট রিকোয়েস্ট — ৳${depositAmount}`,
        message: `${user.firstName} (${user.phone}) ৳${depositAmount} ${mfsProvider} ডিপোজিট দিয়েছেন। TrxID: ${trxId.trim()}। অনুগ্রহ করে যাচাই করুন।`,
        type: "DEPOSIT",
        link: "/admin",
      },
    });

    return NextResponse.json({
      success: true,
      message: `৳${depositAmount} ডিপোজিট রিকোয়েস্ট সফলভাবে জমা হয়েছে। এডমিন যাচাই করার পরে আপনার ব্যালেন্সে যোগ হবে।`,
      transaction: { id: transaction.id, amount: transaction.amount, status: transaction.status },
    });
  } catch (error: any) {
    console.error("Deposit error:", error);
    return NextResponse.json({ error: "ডিপোজিট রিকোয়েস্ট করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
