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

    if (match.status === "COMPLETED") {
      return NextResponse.json({ error: "এই ম্যাচটি ইতিমধ্যেই সমাপ্ত হয়েছে।" }, { status: 400 });
    }

    const isCreator = match.creatorId === user.id;
    const isOpponent = match.opponentId === user.id;

    if (!isCreator && !isOpponent && user.role !== "ADMIN") {
      return NextResponse.json({ error: "আপনি এই ম্যাচের খেলোয়াড় নন।" }, { status: 403 });
    }

    const body = await request.json();
    const { result, proofUrl, disputeReason } = body;

    if (!result || !["WON", "LOST", "DISPUTE"].includes(result)) {
      return NextResponse.json({ error: "সঠিক ফলাফল নির্বাচন করুন (WON, LOST, বা DISPUTE)।" }, { status: 400 });
    }

    const updates: Partial<typeof match> = {};

    if (isCreator) {
      updates.creatorResult = result;
      if (proofUrl) updates.creatorProofUrl = proofUrl;
      if (disputeReason) updates.disputeReason = disputeReason;
    } else if (isOpponent) {
      updates.opponentResult = result;
      if (proofUrl) updates.opponentProofUrl = proofUrl;
      if (disputeReason) updates.disputeReason = disputeReason;
    }

    // Determine final status
    const creatorRes = isCreator ? result : match.creatorResult;
    const opponentRes = isOpponent ? result : match.opponentResult;

    // Case 1: Creator lost or Opponent won with confirmation
    let winnerId: string | null = null;
    let winnerName: string | null = null;

    if (creatorRes === "LOST" && opponentRes === "WON") {
      winnerId = match.opponentId!;
      winnerName = match.opponentName!;
    } else if (creatorRes === "WON" && opponentRes === "LOST") {
      winnerId = match.creatorId || null;
      winnerName = match.creatorName || null;
    } else if (result === "LOST") {
      // If one declared lost, mark other as winner
      if (isCreator && match.opponentId) {
        winnerId = match.opponentId;
        winnerName = match.opponentName || null;
      } else if (isOpponent) {
        winnerId = match.creatorId || null;
        winnerName = match.creatorName || null;
      }
    } else if (creatorRes === "WON" && opponentRes === "WON") {
      // Both claim win -> Dispute
      updates.status = "DISPUTED";
      updates.disputeReason = "উভয় খেলোয়াড়ই বিজয়ের দাবি করেছেন। এডমিন স্ক্রিনশট যাচাই করে সিদ্ধান্ত নেবেন।";
    } else if (creatorRes === "DISPUTE" || opponentRes === "DISPUTE") {
      updates.status = "DISPUTED";
    }

    // If a clean winner is resolved
    if (winnerId && winnerName) {
      updates.status = "COMPLETED";
      updates.winnerId = winnerId;
      updates.winnerName = winnerName;

      // Credit winner wallet
      const winnerUser = db.findUserById(winnerId);
      if (winnerUser) {
        db.updateUser(winnerId, {
          winBalance: winnerUser.winBalance + match.prize,
        });

        // Add transaction
        db.createTransaction({
          id: `trx-${Date.now()}-win`,
          userId: winnerId,
          userName: winnerName,
          userPhone: winnerUser.phone,
          type: "MATCH_WIN",
          amount: match.prize,
          status: "APPROVED",
          note: `ম্যাচ #${match.matchNo} জয়ের পুরস্কার জমা হয়েছে`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Notify winner
        db.createNotification({
          userId: winnerId,
          title: `🏆 অভিনন্দন! ম্যাচ #${match.matchNo} জয়ী হয়েছেন!`,
          message: `ম্যাচ জয়ী হওয়ার কারণে ৳${match.prize} আপনার উইনিং ব্যালেন্সে যোগ করা হয়েছে।`,
          type: "SUCCESS",
          link: "/wallet",
        });

        const loserId = match.creatorId === winnerId ? match.opponentId : match.creatorId;
        if (loserId) {
          db.createNotification({
            userId: loserId,
            title: `ম্যাচ #${match.matchNo} সমাপ্ত`,
            message: `ম্যাচের ফলাফল নিষ্পত্তি হয়েছে। পরবর্তী ম্যাচের জন্য শুভকামনা!`,
            type: "INFO",
            link: `/matches/${match.id}`,
          });
        }
      }
    } else {
      // Result submitted by one player, notify the other player to submit
      const opponentToNotify = isCreator ? match.opponentId : match.creatorId;
      if (opponentToNotify) {
        db.createNotification({
          userId: opponentToNotify,
          title: `⚡ ম্যাচ #${match.matchNo} রেজাল্ট জমা পড়েছে`,
          message: `আপনার প্রতিপক্ষ ফলাফল জমা দিয়েছেন। দ্রুত আপনার রেজাল্ট ও স্ক্রিনশট জমা দিন।`,
          type: "ALERT",
          link: `/matches/${match.id}`,
        });
      }
    }

    const updatedMatch = db.updateMatch(id, updates);

    return NextResponse.json({
      success: true,
      message: winnerId
        ? `ম্যাচ সমাপ্ত! বিজয়ী: ${winnerName}, পুরস্কার ৳${match.prize} ব্যালেন্সে যোগ হয়েছে।`
        : "ফলাফল সফলভাবে জমা দেওয়া হয়েছে। এডমিন ভেরিফাই করছেন।",
      match: updatedMatch,
    });
  } catch (error) {
    console.error("Error submitting result:", error);
    return NextResponse.json({ error: "ফলাফল জমা দিতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
