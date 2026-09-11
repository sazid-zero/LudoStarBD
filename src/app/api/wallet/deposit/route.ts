import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "অননুমোদিত এক্সেস। লগইন করুন।" }, { status: 401 });
    }

    const body = await request.json();
    const { amount, mfsProvider, accountNumber, trxId } = body;

    const depAmount = Number(amount);
    if (!depAmount || depAmount < 20) {
      return NextResponse.json(
        { error: "সর্বনিম্ন ডিপোজিট পরিমাণ ২০ টাকা।" },
        { status: 400 }
      );
    }

    if (!mfsProvider || !["BKASH", "NAGAD", "ROCKET", "UPAY"].includes(mfsProvider)) {
      return NextResponse.json(
        { error: "পেমেন্ট মেথড নির্বাচন করুন (বিকাশ, নগদ, অথবা রকেট)।" },
        { status: 400 }
      );
    }

    if (!accountNumber || !/^01[3-9]\d{8}$/.test(accountNumber.trim())) {
      return NextResponse.json(
        { error: "সঠিক প্রেরক মোবাইল নম্বর দিন।" },
        { status: 400 }
      );
    }

    if (!trxId || trxId.trim().length < 6) {
      return NextResponse.json(
        { error: "সঠিক ট্রানজেকশন আইডি (TrxID) দিন।" },
        { status: 400 }
      );
    }

    // Check if TrxID already submitted
    const allTrx = db.getTransactions();
    const duplicate = allTrx.find(
      (t) => t.trxId && t.trxId.toLowerCase() === trxId.trim().toLowerCase()
    );

    if (duplicate) {
      return NextResponse.json(
        { error: "এই ট্রানজেকশন আইডিটি ইতিমধ্যে ব্যবহৃত হয়েছে। সঠিক TrxID দিন।" },
        { status: 400 }
      );
    }

    const transaction = db.createTransaction({
      id: `trx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      userPhone: user.phone,
      type: "DEPOSIT",
      amount: depAmount,
      status: "PENDING",
      mfsProvider,
      accountNumber: accountNumber.trim(),
      trxId: trxId.trim().toUpperCase(),
      note: `${mfsProvider} ডিপোজিট রিকোয়েস্ট (যাচাইকরণ প্রক্রিয়াধীন)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "ডিপোজিট রিকোয়েস্ট সফলভাবে জমা হয়েছে! অ্যাডমিন যাচাই করে ৫-১০ মিনিটের মধ্যে ব্যালেন্সে যোগ করে দেবে।",
      transaction,
    });
  } catch (error) {
    console.error("Deposit error:", error);
    return NextResponse.json({ error: "ডিপোজিট রিকোয়েস্ট করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
