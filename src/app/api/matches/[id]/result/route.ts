import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { MatchPlayer } from "@/lib/types";

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
    const match = await prisma.match.findUnique({
      where: { id },
    });

    if (!match) {
      return NextResponse.json({ error: "ম্যাচ পাওয়া যায়নি" }, { status: 404 });
    }

    if (match.status === "COMPLETED") {
      return NextResponse.json({ error: "এই ম্যাচটি ইতিমধ্যেই সমাপ্ত হয়েছে।" }, { status: 400 });
    }

    if (match.status === "CANCELLED") {
      return NextResponse.json({ error: "এই ম্যাচটি বাতিল করা হয়েছে।" }, { status: 400 });
    }

    // Build unified players list
    const maxPlayers = match.maxPlayers || 2;
    let currentPlayers: MatchPlayer[] = (match.players as unknown as MatchPlayer[]) || [];

    // Fallback for legacy 2-player matches (no players[] array)
    if (currentPlayers.length === 0) {
      if (match.creatorId) {
        currentPlayers.push({
          userId: match.creatorId,
          name: match.creatorName || "খেলোয়াড় ১",
          phone: match.creatorPhone || "",
          slot: 1,
          isHost: true,
          joinedAt: match.createdAt.toISOString(),
        });
      }
      if (match.opponentId) {
        currentPlayers.push({
          userId: match.opponentId,
          name: match.opponentName || "খেলোয়াড় ২",
          phone: match.opponentPhone || "",
          slot: 2,
          isHost: false,
          joinedAt: match.updatedAt.toISOString(),
        });
      }
    }

    // Check caller is a participant
    const myPlayerEntry = currentPlayers.find((p) => p.userId === user.id);
    const isCreator = match.creatorId === user.id;
    const isOpponent = match.opponentId === user.id;

    if (!myPlayerEntry && !isCreator && !isOpponent && user.role !== "ADMIN") {
      return NextResponse.json({ error: "আপনি এই ম্যাচের খেলোয়াড় নন।" }, { status: 403 });
    }

    const body = await request.json();
    const { result, proofUrl, disputeReason } = body;

    if (!result || !["WON", "LOST", "DISPUTE"].includes(result)) {
      return NextResponse.json(
        { error: "সঠিক ফলাফল নির্বাচন করুন (WON, LOST, বা DISPUTE)।" },
        { status: 400 }
      );
    }

    // --- CORE LOGIC ---
    // Philosophy: "Winner submits WON + screenshot → auto-credited instantly"
    // Losers don't need to do anything. The Ludo King app shows results clearly.
    // If two people claim WON → dispute for admin to resolve.

    if (result === "WON") {
      // Check if any other player already claimed WON
      const existingWinnerEntry = currentPlayers.find(
        (p) => p.result === "WON" && p.userId !== user.id
      );
      const alsoLegacyWin =
        (match.creatorResult === "WON" && match.creatorId !== user.id) ||
        (match.opponentResult === "WON" && match.opponentId !== user.id);

      if (existingWinnerEntry || alsoLegacyWin) {
        // Conflict: multiple WON claims → DISPUTE
        const updatedPlayers = currentPlayers.map((p) =>
          p.userId === user.id ? { ...p, result: "WON" as const, proofUrl: proofUrl || null } : p
        );

        await prisma.match.update({
          where: { id },
          data: {
            status: "DISPUTED",
            players: updatedPlayers as any,
            creatorResult: isCreator ? "WON" : match.creatorResult,
            opponentResult: isOpponent ? "WON" : match.opponentResult,
            creatorProofUrl: isCreator && proofUrl ? proofUrl : match.creatorProofUrl,
            opponentProofUrl: isOpponent && proofUrl ? proofUrl : match.opponentProofUrl,
            disputeReason:
              disputeReason?.trim() ||
              "একাধিক খেলোয়াড় জয়ের দাবি করেছেন। এডমিন স্ক্রিনশট যাচাই করে সিদ্ধান্ত নেবেন।",
          },
        });

        // Notify admin-level notification (ALL admins)
        await prisma.notification.create({
          data: {
            userId: "ALL",
            title: `⚠️ ম্যাচ #${match.matchNo} বিরোধ!`,
            message: `একাধিক খেলোয়াড় জয়ের দাবি করেছেন। স্ক্রিনশট যাচাই করে সিদ্ধান্ত নিন।`,
            type: "ALERT",
            link: `/admin/matches?status=DISPUTED`,
          },
        });

        return NextResponse.json({
          success: false,
          disputed: true,
          message:
            "⚠️ একাধিক খেলোয়াড় জয় দাবি করেছেন! ম্যাচটি বিরোধাধীন (DISPUTED) হয়েছে। এডমিন স্ক্রিনশট দেখে সিদ্ধান্ত নেবেন।",
        });
      }

      // === AUTO-WIN: First and only WON claim → instant prize credit ===
      const winnerUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      if (!winnerUser) {
        return NextResponse.json({ error: "ইউজার পাওয়া যায়নি" }, { status: 404 });
      }

      const winnerName =
        myPlayerEntry?.name ||
        `${winnerUser.firstName} ${winnerUser.lastName}`.trim() ||
        winnerUser.phone;

      // Update players[] with winner's result
      const updatedPlayers = currentPlayers.map((p) =>
        p.userId === user.id ? { ...p, result: "WON" as const, proofUrl: proofUrl || null } : p
      );

      await prisma.$transaction([
        // Credit winner's winBalance
        prisma.user.update({
          where: { id: user.id },
          data: {
            winBalance: { increment: match.prize },
          },
        }),
        // Record win transaction
        prisma.transaction.create({
          data: {
            userId: user.id,
            userName: winnerName,
            userPhone: winnerUser.phone,
            type: "MATCH_WIN",
            amount: match.prize,
            status: "APPROVED",
            note: `ম্যাচ #${match.matchNo} জয়ের পুরস্কার (${maxPlayers} জন খেলোয়াড়) — স্বয়ংক্রিয়ভাবে জমা হয়েছে`,
          },
        }),
        // Update match
        prisma.match.update({
          where: { id },
          data: {
            status: "COMPLETED",
            winnerId: user.id,
            winnerName,
            players: updatedPlayers as any,
            // Legacy fields for 2-player backward compat
            creatorResult: isCreator ? "WON" : match.creatorResult,
            opponentResult: isOpponent ? "WON" : match.opponentResult,
            creatorProofUrl: isCreator && proofUrl ? proofUrl : match.creatorProofUrl,
            opponentProofUrl: isOpponent && proofUrl ? proofUrl : match.opponentProofUrl,
          },
        }),
      ]);

      // Notify winner
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: `🏆 অভিনন্দন! ম্যাচ #${match.matchNo} জিতেছেন!`,
          message: `স্ক্রিনশট যাচাই হয়েছে! ৳${match.prize} আপনার উইনিং ব্যালেন্সে যোগ হয়েছে।`,
          type: "SUCCESS",
          link: "/wallet",
        },
      });

      // Notify all other players (losers)
      for (const p of currentPlayers) {
        if (p.userId !== user.id) {
          await prisma.notification.create({
            data: {
              userId: p.userId,
              title: `ম্যাচ #${match.matchNo} সমাপ্ত`,
              message: `${winnerName} বিজয়ী হয়েছেন। পরবর্তী ম্যাচে চেষ্টা করুন!`,
              type: "INFO",
              link: `/matches/${match.id}`,
            },
          });
        }
      }

      return NextResponse.json({
        success: true,
        autoResolved: true,
        message: `🏆 অভিনন্দন! ম্যাচ #${match.matchNo} জয়ী! ৳${match.prize} আপনার উইনিং ব্যালেন্সে যোগ হয়েছে।`,
      });
    }

    // result === "LOST" or "DISPUTE"
    // Update the player's entry in players[] and legacy fields
    const updatedPlayers = currentPlayers.map((p) =>
      p.userId === user.id ? { ...p, result: result as "LOST" | "DISPUTE", proofUrl: proofUrl || null } : p
    );

    const matchUpdates: any = {
      players: updatedPlayers as any,
      creatorResult: isCreator ? result : match.creatorResult,
      opponentResult: isOpponent ? result : match.opponentResult,
      creatorProofUrl: isCreator && proofUrl ? proofUrl : match.creatorProofUrl,
      opponentProofUrl: isOpponent && proofUrl ? proofUrl : match.opponentProofUrl,
    };

    if (result === "DISPUTE") {
      matchUpdates.status = "DISPUTED";
      matchUpdates.disputeReason =
        disputeReason?.trim() || "একজন খেলোয়াড় বিরোধ জানিয়েছেন। এডমিন স্ক্রিনশট দেখে সিদ্ধান্ত নেবেন।";

      // Notify all other players in the match
      for (const p of currentPlayers) {
        if (p.userId !== user.id) {
          await prisma.notification.create({
            data: {
              userId: p.userId,
              title: `⚠️ ম্যাচ #${match.matchNo} বিরোধ!`,
              message: "একজন খেলোয়াড় বিরোধ জানিয়েছেন। এডমিন শীঘ্রই সমাধান করবেন।",
              type: "ALERT",
              link: `/matches/${match.id}`,
            },
          });
        }
      }
    }

    await prisma.match.update({
      where: { id },
      data: matchUpdates,
    });

    const messageText =
      result === "DISPUTE"
        ? "বিরোধ জানানো হয়েছে। এডমিন স্ক্রিনশট যাচাই করে সিদ্ধান্ত নেবেন।"
        : "পরাজয় নিশ্চিত করা হয়েছে। পরবর্তী ম্যাচে শুভকামনা!";

    return NextResponse.json({
      success: true,
      message: messageText,
    });
  } catch (error) {
    console.error("Error submitting result:", error);
    return NextResponse.json({ error: "ফলাফল জমা দিতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
