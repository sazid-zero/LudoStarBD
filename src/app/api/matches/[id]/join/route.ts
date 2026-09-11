import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "অননুমোদিত এক্সেস। লগইন করুন।" }, { status: 401 });
    }

    const { id } = await params;
    const match = db.findMatchById(id);

    if (!match) {
      return NextResponse.json({ error: "ম্যাচ পাওয়া যায়নি" }, { status: 404 });
    }

    const hasPlayer1 = Boolean(match.creatorId);
    const hasPlayer2 = Boolean(match.opponentId);

    // Prevent joining if match is not open or both seats are taken
    if (match.status !== "WAITING" || (hasPlayer1 && hasPlayer2)) {
      return NextResponse.json({ error: "এই ম্যাচটিতে সিট পূর্ণ হয়ে গিয়েছে।" }, { status: 400 });
    }

    // Prevent joining same match twice
    if (match.creatorId === user.id || match.opponentId === user.id) {
      return NextResponse.json({ error: "আপনি ইতিমধ্যেই এই ম্যাচে জয়েন করে আছেন।" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const playerName = body.ludoKingName?.trim() || `${user.firstName} ${user.lastName}`.trim() || user.phone;
    const paymentMethod = body.paymentMethod || "WALLET";
    const senderPhone = body.senderPhone?.trim() || null;
    const trxId = body.trxId?.trim() || null;

    const isDirectTrx = Boolean(trxId && senderPhone);

    const fee = match.entryFee;
    const totalBalance = user.mainBalance + user.winBalance;

    if (!isDirectTrx && totalBalance < fee) {
      return NextResponse.json(
        { error: "আপনার একাউন্টে পর্যাপ্ত ব্যালেন্স নেই। রিচার্জ করুন অথবা বিকাশ/নগদে সরাসরি পেমেন্ট করুন।" },
        { status: 400 }
      );
    }

    // If using wallet balance, deduct fee
    if (!isDirectTrx) {
      let deductMain = Math.min(user.mainBalance, fee);
      let deductWin = fee - deductMain;

      db.updateUser(user.id, {
        mainBalance: user.mainBalance - deductMain,
        winBalance: user.winBalance - deductWin,
      });
    }

    let updatedMatch;
    let messageText = "";

    if (!hasPlayer1) {
      // 1st Player joins (0 -> 1)
      updatedMatch = db.updateMatch(id, {
        creatorId: user.id,
        creatorPhone: user.phone,
        creatorName: playerName,
        creatorMfs: isDirectTrx ? paymentMethod : "WALLET",
        creatorSenderPhone: senderPhone,
        creatorTrxId: trxId,
        status: "WAITING",
        roomCode: match.roomCode || null,
      });
      messageText = isDirectTrx
        ? "পেমেন্ট তথ্যসহ ১ম খেলোয়াড় হিসেবে জয়েন সফল! ২য় খেলোয়াড় যোগ দিলে এডমিন ভেরিফাই করে রুম কোড দিবেন।"
        : "সফলভাবে ১ম খেলোয়াড় হিসেবে জয়েন করেছেন! ২য় খেলোয়াড় জয়েন করলে অ্যাডমিন রুম কোড প্রদান করবেন।";
    } else {
      // 2nd Player joins (1 -> 2: Seat Fillup!)
      updatedMatch = db.updateMatch(id, {
        opponentId: user.id,
        opponentPhone: user.phone,
        opponentName: playerName,
        opponentMfs: isDirectTrx ? paymentMethod : "WALLET",
        opponentSenderPhone: senderPhone,
        opponentTrxId: trxId,
        status: "RUNNING",
        roomCode: match.roomCode || null,
      });
      messageText = isDirectTrx
        ? "পেমেন্ট তথ্যসহ ২য় খেলোয়াড় হিসেবে জয়েন সফল! সিট পূর্ণ হয়েছে, এডমিন পেমেন্ট চেক করে রুম কোড প্রদান করবেন।"
        : "সফলভাবে ২য় খেলোয়াড় হিসেবে জয়েন করেছেন! সিট পূর্ণ হয়েছে, অ্যাডমিন শীঘ্রই রুম আইডি প্রদান করবেন।";
    }

    // Record transaction
    db.createTransaction({
      id: `trx-${Date.now()}-join`,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      userPhone: user.phone,
      type: "MATCH_FEE",
      amount: fee,
      status: isDirectTrx ? "PENDING" : "APPROVED",
      mfsProvider: isDirectTrx ? (paymentMethod as any) : null,
      accountNumber: senderPhone,
      trxId: trxId,
      note: isDirectTrx
        ? `ম্যাচ #${match.matchNo} ডিরেক্ট ${paymentMethod} পেমেন্ট জয়েন (TrxID: ${trxId})`
        : `ম্যাচ #${match.matchNo} জয়েন ফি কাটা হয়েছে`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: messageText,
      match: updatedMatch,
    });
  } catch (error) {
    console.error("Error joining match:", error);
    return NextResponse.json({ error: "ম্যাচে জয়েন করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
