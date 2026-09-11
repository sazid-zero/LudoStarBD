import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const myOnly = searchParams.get("myOnly") === "true";

    let matches = db.getMatches();
    const currentUser = await getSessionUser();

    if (myOnly && currentUser) {
      matches = matches.filter(
        (m) => m.creatorId === currentUser.id || m.opponentId === currentUser.id
      );
    } else if (status) {
      matches = matches.filter((m) => m.status.toLowerCase() === status.toLowerCase());
    }

    // Room ID is strictly hidden from non-participants
    const sanitizedMatches = matches.map((m) => {
      const isParticipant =
        currentUser && (m.creatorId === currentUser.id || m.opponentId === currentUser.id);
      const isAdmin = currentUser && currentUser.role === "ADMIN";
      return {
        ...m,
        roomCode: isParticipant || isAdmin ? m.roomCode : null,
      };
    });

    // Attach active notice
    const notice = db.getActiveNotice();

    return NextResponse.json({
      matches: sanitizedMatches,
      notice: notice ? notice.text : null,
    });
  } catch (error) {
    console.error("Error fetching matches:", error);
    return NextResponse.json({ error: "ম্যাচ লোড করা সম্ভব হয়নি" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "অননুমোদিত এক্সেস। লগইন করুন।" }, { status: 401 });
    }

    const body = await request.json();
    const { entryFee, matchType = "1v1 Classic" } = body;

    const fee = Number(entryFee);
    if (!fee || fee < 10) {
      return NextResponse.json({ error: "সঠিক এন্ট্রি ফি নির্ধারণ করুন (কমপক্ষে ১০ টাকা)।" }, { status: 400 });
    }

    // Calculate total available balance
    const totalBalance = user.mainBalance + user.winBalance;
    if (totalBalance < fee) {
      return NextResponse.json(
        { error: "আপনার একাউন্টে পর্যাপ্ত ব্যালেন্স নেই। অনুগ্রহ করে ডিপোজিট করুন।" },
        { status: 400 }
      );
    }

    // Deduct fee: first from mainBalance, then remainder from winBalance
    let deductMain = Math.min(user.mainBalance, fee);
    let deductWin = fee - deductMain;

    db.updateUser(user.id, {
      mainBalance: user.mainBalance - deductMain,
      winBalance: user.winBalance - deductWin,
    });

    // 10% platform commission: 2 players fee * 0.9 = 1.8x
    const prize = Math.round(fee * 2 * 0.9);

    const matchesCount = db.getMatches().length;
    const matchNo = 2000 + matchesCount + 1;

    const newMatch = db.createMatch({
      id: `match-${Date.now()}`,
      matchNo,
      title: `১ বনাম ১ ক্লাসিক ম্যাচ #${matchNo}`,
      entryFee: fee,
      prize,
      matchType,
      status: "WAITING",
      creatorId: user.id,
      creatorPhone: user.phone,
      creatorName: `${user.firstName} ${user.lastName}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create transaction record for entry fee
    db.createTransaction({
      id: `trx-${Date.now()}-fee`,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      userPhone: user.phone,
      type: "MATCH_FEE",
      amount: fee,
      status: "APPROVED",
      note: `ম্যাচ #${matchNo} এন্ট্রি ফি কাটা হয়েছে`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "ম্যাচ সফলভাবে তৈরি হয়েছে!",
      match: newMatch,
    });
  } catch (error) {
    console.error("Error creating match:", error);
    return NextResponse.json({ error: "ম্যাচ তৈরি করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
