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
    const { amount, mfsProvider, accountNumber, accountType = "Personal" } = body;

    const withdrawAmount = Number(amount);
    if (!withdrawAmount || withdrawAmount < 200) {
      return NextResponse.json(
        { error: "সর্বনিম্ন উত্তোলনের পরিমাণ ২০০ টাকা।" },
        { status: 400 }
      );
    }

    // Check withdrawable balance (winBalance)
    if (user.winBalance < withdrawAmount) {
      return NextResponse.json(
        { error: `আপনার উত্তোলনযোগ্য উইনিং ব্যালেন্স অপর্যাপ্ত। বর্তমান উইনিং ব্যালেন্স: ৳${user.winBalance}` },
        { status: 400 }
      );
    }

    if (!mfsProvider || !["BKASH", "NAGAD", "ROCKET", "UPAY"].includes(mfsProvider)) {
      return NextResponse.json(
        { error: "সঠিক পেমেন্ট মেথড নির্বাচন করুন (বিকাশ, নগদ, অথবা রকেট)।" },
        { status: 400 }
      );
    }

    if (!accountNumber || !/^01[3-9]\d{8}$/.test(accountNumber.trim())) {
      return NextResponse.json(
        { error: "সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন।" },
        { status: 400 }
      );
    }

    // Agent Cashout Fee: 20 Taka cut off when withdraw via agent
    const isAgent = accountType === "Agent";
    const agentFee = isAgent ? 20 : 0;
    const netPayable = Math.max(0, withdrawAmount - agentFee);

    // Deduct immediately from winBalance
    db.updateUser(user.id, {
      winBalance: user.winBalance - withdrawAmount,
    });

    const transaction = db.createTransaction({
      id: `trx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      userPhone: user.phone,
      type: "WITHDRAW",
      amount: withdrawAmount,
      status: "PENDING",
      mfsProvider,
      accountType,
      accountNumber: accountNumber.trim(),
      note: isAgent
        ? `${mfsProvider} (Agent - ২০ টাকা কর্তন, গ্রাহক পাবেন: ৳${netPayable})`
        : `${mfsProvider} (${accountType}) উইথড্র প্রক্রিয়াধীন`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const successMsg = isAgent
      ? `৳${withdrawAmount} উইথড্র রিকোয়েস্ট সফল! এজেন্ট ক্যাশআউট ফি ২০ টাকা কর্তনের পর আপনি পাবেন ৳${netPayable}। শীঘ্রই টাকা পাঠানো হবে।`
      : `৳${withdrawAmount} উইথড্র রিকোয়েস্ট সফল! শীঘ্রই আপনার ${mfsProvider} নম্বরে টাকা পাঠানো হবে।`;

    return NextResponse.json({
      success: true,
      message: successMsg,
      transaction,
      netPayable,
      agentFee,
      remainingWinBalance: user.winBalance - withdrawAmount,
    });
  } catch (error) {
    console.error("Withdraw error:", error);
    return NextResponse.json({ error: "উইথড্র রিকোয়েস্ট করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
