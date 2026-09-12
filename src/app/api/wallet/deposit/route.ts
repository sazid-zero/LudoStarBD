import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "অননুমোদিত এক্সেস। লগইন করুন।" }, { status: 401 });

    const body = await request.json();
    const { amount, mfsProvider, senderPhone, trxId } = body;

    const depositAmount = Number(amount);
    if (!depositAmount || depositAmount < 50) {
      return NextResponse.json({ error: "সর্বনিম্ন ডিপোজিটের পরিমাণ ৫০ টাকা।" }, { status: 400 });
    }

    if (!mfsProvider || !["BKASH", "NAGAD", "ROCKET"].includes(mfsProvider)) {
      return NextResponse.json({ error: "সঠিক পেমেন্ট মেথড নির্বাচন করুন (বিকাশ, নগদ, অথবা রকেট)।" }, { status: 400 });
    }

    if (!senderPhone || !/^01[3-9]\d{8}$/.test(senderPhone.trim())) {
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

    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        userPhone: user.phone,
        type: "DEPOSIT",
        amount: depositAmount,
        status: "PENDING",
        mfsProvider: mfsProvider as any,
        accountNumber: senderPhone.trim(),
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
