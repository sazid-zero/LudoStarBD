import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত এক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "ALL";
    const search = (searchParams.get("search") || "").trim().toLowerCase();

    let allMatches = db.getMatches();

    if (status === "NO_ROOM_CODE") {
      allMatches = allMatches.filter(
        (m) =>
          (m.status === "RUNNING" || (m.status === "WAITING" && Boolean(m.creatorId))) &&
          !m.roomCode
      );
    } else if (status === "PROOFS" || status === "DISPUTED") {
      allMatches = allMatches.filter(
        (m) =>
          m.status !== "COMPLETED" &&
          m.status !== "CANCELLED" &&
          Boolean(
            m.creatorProofUrl ||
            m.opponentProofUrl ||
            m.creatorResult ||
            m.opponentResult ||
            m.status === "DISPUTED"
          )
      );
    } else if (status !== "ALL") {
      allMatches = allMatches.filter((m) => m.status === status);
    }

    if (search) {
      allMatches = allMatches.filter((m) => {
        const noMatch = m.matchNo?.toString().includes(search);
        const titleMatch = m.title?.toLowerCase().includes(search);
        const creatorMatch =
          m.creatorName?.toLowerCase().includes(search) ||
          m.creatorPhone?.toLowerCase().includes(search);
        const opponentMatch =
          m.opponentName?.toLowerCase().includes(search) ||
          m.opponentPhone?.toLowerCase().includes(search);
        const codeMatch = m.roomCode?.toLowerCase().includes(search);
        return noMatch || titleMatch || creatorMatch || opponentMatch || codeMatch;
      });
    }

    const matchesListRaw = db.getMatches();
    const proofsCount = matchesListRaw.filter(
      (m) =>
        m.status !== "COMPLETED" &&
        m.status !== "CANCELLED" &&
        Boolean(
          m.creatorProofUrl ||
          m.opponentProofUrl ||
          m.creatorResult ||
          m.opponentResult ||
          m.status === "DISPUTED"
        )
    ).length;
    const disputedCount = matchesListRaw.filter((m) => m.status === "DISPUTED").length;
    const runningCount = matchesListRaw.filter((m) => m.status === "RUNNING").length;
    const waitingCount = matchesListRaw.filter((m) => m.status === "WAITING").length;
    const noRoomCodeCount = matchesListRaw.filter(
      (m) =>
        (m.status === "RUNNING" || (m.status === "WAITING" && Boolean(m.creatorId))) &&
        !m.roomCode
    ).length;

    return NextResponse.json({
      matches: allMatches,
      totalCount: allMatches.length,
      proofsCount,
      disputedCount,
      runningCount,
      waitingCount,
      noRoomCodeCount,
    });
  } catch (error) {
    console.error("Admin matches fetch error:", error);
    return NextResponse.json({ error: "ম্যাচ তালিকা আনতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত এক্সেস।" }, { status: 403 });
    }

    const body = await request.json();
    const { action, matchId, winnerId, roomCode, entryFee, prize, matchType, title } = body;

    // Action 1: Create Match as Admin
    if (action === "CREATE") {
      const fee = Number(entryFee);
      if (!fee || fee < 10) {
        return NextResponse.json({ error: "সঠিক এন্ট্রি ফি দিন (কমপক্ষে ১০ টাকা)।" }, { status: 400 });
      }

      const pr = Number(prize) || Math.round(fee * 2 * 0.9);
      const count = db.getMatches().length;
      const matchNo = 2000 + count + 1;

      const newMatch = db.createMatch({
        id: `match-${Date.now()}`,
        matchNo,
        title: title?.trim() || `১ বনাম ১ ক্লাসিক ম্যাচ #${matchNo}`,
        entryFee: fee,
        prize: pr,
        matchType: matchType || "1v1 Classic",
        status: "WAITING",
        creatorId: null,
        creatorPhone: null,
        creatorName: null,
        opponentId: null,
        opponentPhone: null,
        opponentName: null,
        roomCode: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: `অফিসিয়াল ম্যাচ #${matchNo} সফলভাবে তৈরি করা হয়েছে!`,
        match: newMatch,
      });
    }

    // Action 2: Update Room Code
    if (action === "SET_ROOM_CODE") {
      if (!matchId || !roomCode) {
        return NextResponse.json({ error: "ম্যাচ আইডি এবং রুম কোড দিন।" }, { status: 400 });
      }

      const cleanRoomCode = String(roomCode).trim().replace(/\s+/g, "");
      if (cleanRoomCode.length < 4) {
        return NextResponse.json({ error: "সঠিক Ludo King রুম কোড লিখুন (কমপক্ষে ৪-৮ ডিজিট)।" }, { status: 400 });
      }

      const match = db.findMatchById(matchId);
      if (!match) {
        return NextResponse.json({ error: "ম্যাচ পাওয়া যায়নি।" }, { status: 404 });
      }

      const updated = db.updateMatch(matchId, {
        roomCode: cleanRoomCode,
        status: match.status === "WAITING" && match.opponentId ? "RUNNING" : match.status,
      });

      // Auto-approve any pending MATCH_FEE transactions associated with this match
      const allTransactions = db.getTransactions();
      const relatedTrxs = allTransactions.filter(
        (t) =>
          t.type === "MATCH_FEE" &&
          t.status === "PENDING" &&
          (t.userId === match.creatorId || t.userId === match.opponentId) &&
          t.note?.includes(`#${match.matchNo}`)
      );
      for (const trx of relatedTrxs) {
        db.updateTransaction(trx.id, {
          status: "APPROVED",
          note: `${trx.note} (রুম কোড প্রদানের মাধ্যমে ভেরিফাইড)`,
        });
      }

      // Send notifications to players
      if (match.creatorId) {
        db.createNotification({
          userId: match.creatorId,
          title: `🎮 ম্যাচ #${match.matchNo} রুম কোড তৈরি!`,
          message: `Ludo King রুম কোড: ${cleanRoomCode}। এখনই গেমে জয়েন করুন।`,
          type: "SUCCESS",
          link: `/matches/${match.id}`,
        });
      }
      if (match.opponentId) {
        db.createNotification({
          userId: match.opponentId,
          title: `🎮 ম্যাচ #${match.matchNo} রুম কোড তৈরি!`,
          message: `Ludo King রুম কোড: ${cleanRoomCode}। এখনই গেমে জয়েন করুন।`,
          type: "SUCCESS",
          link: `/matches/${match.id}`,
        });
      }

      return NextResponse.json({
        success: true,
        message: "রুম কোড সফলভাবে সংরক্ষণ ও প্লেয়ারদের কাছে পাঠানো হয়েছে!",
        match: updated,
      });
    }

    // Action 3: Resolve Dispute & Declare Winner
    if (action === "RESOLVE_WINNER") {
      const match = db.findMatchById(matchId);
      if (!match) {
        return NextResponse.json({ error: "ম্যাচ পাওয়া যায়নি" }, { status: 404 });
      }

      const winnerUser = db.findUserById(winnerId);
      if (!winnerUser) {
        return NextResponse.json({ error: "বিজয়ী খেলোয়াড় পাওয়া যায়নি" }, { status: 404 });
      }

      // Credit winner's winBalance
      db.updateUser(winnerId, {
        winBalance: winnerUser.winBalance + match.prize,
      });

      // Record transaction
      db.createTransaction({
        id: `trx-${Date.now()}-admin-res`,
        userId: winnerId,
        userName: `${winnerUser.firstName} ${winnerUser.lastName}`,
        userPhone: winnerUser.phone,
        type: "MATCH_WIN",
        amount: match.prize,
        status: "APPROVED",
        note: `এডমিন যাচাই শেষে ম্যাচ #${match.matchNo} জয়ের পুরস্কার প্রদান`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const updated = db.updateMatch(matchId, {
        status: "COMPLETED",
        winnerId,
        winnerName: `${winnerUser.firstName} ${winnerUser.lastName}`,
        adminNotes: `এডমিন কর্তৃক স্ক্রিনশট যাচাই শেষে ${winnerUser.firstName}-কে বিজয়ী ঘোষিত ও ৳${match.prize} প্রদান করা হয়েছে`,
      });

      // Notify winner
      db.createNotification({
        userId: winnerId,
        title: `🏆 অভিনন্দন! ম্যাচ #${match.matchNo} জয়ী হয়েছেন!`,
        message: `এডমিন আপনার উইনিং স্ক্রিনশট যাচাই করে পুরস্কার মানি ৳${match.prize} আপনার উইনিং ব্যালেন্সে যুক্ত করেছেন।`,
        type: "SUCCESS",
        link: `/wallet`,
      });

      // Notify loser if opponent exists
      const loserId = match.creatorId === winnerId ? match.opponentId : match.creatorId;
      if (loserId) {
        db.createNotification({
          userId: loserId,
          title: `ম্যাচ #${match.matchNo} সমাপ্ত`,
          message: `এডমিন স্ক্রিনশট যাচাই শেষে ম্যাচ নিষ্পত্তি করেছেন। পরবর্তী ম্যাচের জন্য শুভকামনা!`,
          type: "INFO",
          link: `/matches/${match.id}`,
        });
      }

      return NextResponse.json({
        success: true,
        message: `ম্যাচ #${match.matchNo} সমাধান করা হয়েছে! বিজয়ী: ${winnerUser.firstName}, ৳${match.prize} পুরস্কার ব্যালেন্সে জমা হয়েছে।`,
        match: updated,
      });
    }

    // Action 4: Cancel & Refund
    if (action === "CANCEL_REFUND") {
      const match = db.findMatchById(matchId);
      if (!match) {
        return NextResponse.json({ error: "ম্যাচ পাওয়া যায়নি" }, { status: 404 });
      }

      // Refund creator
      if (match.creatorId) {
        const creator = db.findUserById(match.creatorId);
        if (creator) {
          db.updateUser(creator.id, { mainBalance: creator.mainBalance + match.entryFee });
          db.createNotification({
            userId: creator.id,
            title: `ম্যাচ #${match.matchNo} বাতিল ও রিফান্ড`,
            message: `ম্যাচটি বাতিল করা হয়েছে এবং এন্ট্রি ফি ৳${match.entryFee} আপনার মেইন ব্যালেন্সে ফেরত দেওয়া হয়েছে।`,
            type: "ALERT",
            link: `/wallet`,
          });
        }
      }

      // Refund opponent if joined
      if (match.opponentId) {
        const opponent = db.findUserById(match.opponentId);
        if (opponent) {
          db.updateUser(opponent.id, { mainBalance: opponent.mainBalance + match.entryFee });
          db.createNotification({
            userId: opponent.id,
            title: `ম্যাচ #${match.matchNo} বাতিল ও রিফান্ড`,
            message: `ম্যাচটি বাতিল করা হয়েছে এবং এন্ট্রি ফি ৳${match.entryFee} আপনার মেইন ব্যালেন্সে ফেরত দেওয়া হয়েছে।`,
            type: "ALERT",
            link: `/wallet`,
          });
        }
      }

      const updated = db.updateMatch(matchId, {
        status: "CANCELLED",
        adminNotes: "এডমিন কর্তৃক ম্যাচ বাতিল ও অংশগ্রহণকারী খেলোয়াড়দের এন্ট্রি ফি রিফান্ড করা হয়েছে",
      });

      return NextResponse.json({
        success: true,
        message: `ম্যাচ #${match.matchNo} বাতিল ও এন্ট্রি ফি রিফান্ড করা হয়েছে।`,
        match: updated,
      });
    }

    // Action 5: Delete Match
    if (action === "DELETE") {
      const deleted = db.deleteMatch(matchId);
      if (!deleted) {
        return NextResponse.json({ error: "ম্যাচ পাওয়া যায়নি বা ইতিমধ্যে মুছে ফেলা হয়েছে।" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: "ম্যাচটি সফলভাবে ডিলিট করা হয়েছে।",
      });
    }

    return NextResponse.json({ error: "অবৈধ অ্যাকশন।" }, { status: 400 });
  } catch (error) {
    console.error("Admin match action error:", error);
    return NextResponse.json({ error: "অ্যাকশন সম্পন্ন করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
