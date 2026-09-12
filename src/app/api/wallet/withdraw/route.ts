import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "অননুমোদিত এক্সেস। লগইন করুন।" }, { status: 401 });
    }

    // Refresh user from database to ensure fresh balance
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
    });

    if (!user) {
      return NextResponse.json({ error: "ইউজার পাওয়া যায়নি।" }, { status: 404 });
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

    if (!mfsProvider || !["BKASH", "NAGAD", "ROCKET"].includes(mfsProvider)) {
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

    // Run balance deduction and transaction creation atomically
    const [updatedUser, transaction] = await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          winBalance: {
            decrement: withdrawAmount,
          },
        },
      }),
      prisma.transaction.create({
        data: {
          userId: user.id,
          userName: `${user.firstName} ${user.lastName}`.trim(),
          userPhone: user.phone,
          type: "WITHDRAW",
          amount: withdrawAmount,
          status: "PENDING",
          mfsProvider: mfsProvider as any,
          accountType,
          accountNumber: accountNumber.trim(),
          note: isAgent
            ? `${mfsProvider} (Agent - ২০ টাকা কর্তন, গ্রাহক পাবেন: ৳${netPayable})`
            : `${mfsProvider} (${accountType}) উইথড্র প্রক্রিয়াধীন`,
        },
      }),
    ]);

    const successMsg = isAgent
      ? `৳${withdrawAmount} উইথড্র রিকোয়েস্ট সফল! এজেন্ট ক্যাশআউট ফি ২০ টাকা কর্তনের পর আপনি পাবেন ৳${netPayable}। শীঘ্রই টাকা পাঠানো হবে।`
      : `৳${withdrawAmount} উইথড্র রিকোয়েস্ট সফল! শীঘ্রই আপনার ${mfsProvider} নম্বরে টাকা পাঠানো হবে।`;

    return NextResponse.json({
      success: true,
      message: successMsg,
      transaction,
      netPayable,
      agentFee,
      remainingWinBalance: updatedUser.winBalance,
    });
  } catch (error) {
    console.error("Withdraw error:", error);
    return NextResponse.json({ error: "উইথড্র রিকোয়েস্ট করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
