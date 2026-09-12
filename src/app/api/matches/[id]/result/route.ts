export const dynamic = "force-dynamic";

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

    const nowIso = new Date().toISOString();

    // Update current caller's result in the players list
    const updatedPlayers = currentPlayers.map((p) =>
      p.userId === user.id
        ? {
            ...p,
            result: result as "WON" | "LOST" | "DISPUTE",
            proofUrl: proofUrl || p.proofUrl || null,
            submittedAt: nowIso,
          }
        : p
    );

    // Count results across all players
    const winners = updatedPlayers.filter((p) => p.result === "WON");
    const losers = updatedPlayers.filter((p) => p.result === "LOST");
    const disputes = updatedPlayers.filter((p) => p.result === "DISPUTE");

    // Also check legacy fields in case of legacy records
    const legacyOtherWon =
      (isCreator && match.opponentResult === "WON") ||
      (isOpponent && match.creatorResult === "WON");

    // =========================================================================
    // CASE 1: CONFLICT / DISPUTE (Multiple claim WON, or anyone claims DISPUTE)
    // =========================================================================
    if (winners.length > 1 || legacyOtherWon || disputes.length > 0 || result === "DISPUTE") {
      const reasonText =
        disputeReason?.trim() ||
        (winners.length > 1 || legacyOtherWon
          ? "উভয় খেলোয়াড়ই জয়ের দাবি করেছেন (বিরোধপূর্ণ)। এডমিন স্ক্রিনশট যাচাই করে সঠিক বিজয়ী নির্ধারণ করবেন।"
          : "একজন খেলোয়াড় বিরোধ জানিয়েছেন। এডমিন স্ক্রিনশট দেখে সিদ্ধান্ত নেবেন।");

      await prisma.match.update({
        where: { id },
        data: {
          status: "DISPUTED",
          players: updatedPlayers as any,
          creatorResult: isCreator ? result : match.creatorResult,
          opponentResult: isOpponent ? result : match.opponentResult,
          creatorProofUrl: isCreator && proofUrl ? proofUrl : match.creatorProofUrl,
          opponentProofUrl: isOpponent && proofUrl ? proofUrl : match.opponentProofUrl,
          disputeReason: reasonText,
        },
      });

      // Send Cheat/Conflict Warning Notice to ALL participants
      for (const p of updatedPlayers) {
        await prisma.notification.create({
          data: {
            userId: p.userId,
            title: `⚠️ ম্যাচ #${match.matchNo} বিরোধ সনাক্ত হয়েছে!`,
            message: `উভয় খেলোয়াড়ই জয়ের দাবি করেছেন। ম্যাচটি এডমিন রিভিউতে গেছে। মিথ্যা প্রমাণ বা ভুয়া স্ক্রিনশট দিলে অ্যাকাউন্ট স্থায়ীভাবে ব্যান ও ব্যালেন্স বাজেয়াপ্ত হবে।`,
            type: "ALERT",
            link: `/matches/${match.id}`,
          },
        });
      }

      // Alert ALL Admins
      await prisma.notification.create({
        data: {
          userId: "ALL",
          title: `🚨 ম্যাচ #${match.matchNo} বিরোধ! উভয় খেলোয়াড় জয়ের দাবি করেছেন`,
          message: `${match.creatorName || "খেলোয়াড় ১"} ও ${match.opponentName || "খেলোয়াড় ২"} উভয়ই জয়ের দাবি করেছেন। এডমিন প্যানেল থেকে স্ক্রিনশট যাচাই করুন।`,
          type: "ALERT",
          link: `/admin`,
        },
      });

      return NextResponse.json({
        success: true,
        disputed: true,
        message:
          "⚠️ বিরোধ সনাক্ত হয়েছে! উভয় খেলোয়াড়ই জয়ের দাবি করায় কোনো অর্থ প্রদান করা হয়নি। এডমিন স্ক্রিনশট যাচাই করে চূড়ান্ত সিদ্ধান্ত নেবেন। ভুয়া তথ্যের জন্য আইডি ব্যান হতে পারে।",
      });
    }

    // =========================================================================
    // CASE 2A: PLAYER CLICKS "LOST" IN 1v1 MATCH -> OPPONENT WINS INSTANTLY!
    // The winner doesn't even need to submit anything; match auto-completes.
    // =========================================================================
    if (result === "LOST" && maxPlayers <= 2) {
      const otherPlayerEntry = updatedPlayers.find((p) => p.userId !== user.id);
      if (otherPlayerEntry) {
        const winnerUser = await prisma.user.findUnique({
          where: { id: otherPlayerEntry.userId },
        });

        if (winnerUser) {
          const winnerName =
            otherPlayerEntry.name ||
            `${winnerUser.firstName} ${winnerUser.lastName}`.trim() ||
            winnerUser.phone;

          await prisma.$transaction([
            prisma.user.update({
              where: { id: otherPlayerEntry.userId },
              data: { winBalance: { increment: match.prize } },
            }),
            prisma.transaction.create({
              data: {
                userId: otherPlayerEntry.userId,
                userName: winnerName,
                userPhone: winnerUser.phone,
                type: "MATCH_WIN",
                amount: match.prize,
                status: "APPROVED",
                note: `ম্যাচ #${match.matchNo} জয়ের পুরস্কার — প্রতিপক্ষ পরাজয় স্বীকার করায় সরাসরি বিজয়ী ঘোষিত`,
              },
            }),
            prisma.match.update({
              where: { id },
              data: {
                status: "COMPLETED",
                winnerId: otherPlayerEntry.userId,
                winnerName,
                players: updatedPlayers as any,
                creatorResult: isCreator ? "LOST" : (match.creatorResult || "WON"),
                opponentResult: isOpponent ? "LOST" : (match.opponentResult || "WON"),
                creatorProofUrl: isCreator && proofUrl ? proofUrl : match.creatorProofUrl,
                opponentProofUrl: isOpponent && proofUrl ? proofUrl : match.opponentProofUrl,
                adminNotes: `প্রতিপক্ষ (${myPlayerEntry?.name || user.firstName}) পরাজয় স্বীকার করায় সরাসরি বিজয়ী ঘোষিত`,
              },
            }),
          ]);

          // Notify winner
          await prisma.notification.create({
            data: {
              userId: otherPlayerEntry.userId,
              title: `🏆 অভিনন্দন! ম্যাচ #${match.matchNo} জিতেছেন!`,
              message: `প্রতিপক্ষ পরাজয় স্বীকার করেছেন! ম্যাচ পুরস্কার ৳${match.prize} আপনার উইনিং ব্যালেন্সে যোগ হয়েছে।`,
              type: "SUCCESS",
              link: "/wallet",
            },
          });

          // Notify loser
          await prisma.notification.create({
            data: {
              userId: user.id,
              title: `ম্যাচ #${match.matchNo} সমাপ্ত`,
              message: `আপনার পরাজয় নিশ্চিত করা হয়েছে। পরবর্তী ম্যাচে শুভকামনা!`,
              type: "INFO",
              link: `/matches/${match.id}`,
            },
          });

          return NextResponse.json({
            success: true,
            completed: true,
            message: "পরাজয় নিশ্চিত করা হয়েছে। প্রতিপক্ষকে সরাসরি বিজয়ী ঘোষণা করে পুরস্কার প্রদান করা হয়েছে।",
          });
        }
      }
    }

    // =========================================================================
    // CASE 2B: MUTUAL AGREEMENT (Exactly 1 WON, and opponent confirmed LOST)
    // =========================================================================
    if (winners.length === 1 && losers.length >= 1) {
      const winnerEntry = winners[0];
      const winnerUser = await prisma.user.findUnique({
        where: { id: winnerEntry.userId },
      });

      if (!winnerUser) {
        return NextResponse.json({ error: "বিজয়ী ইউজার পাওয়া যায়নি" }, { status: 404 });
      }

      const winnerName =
        winnerEntry.name ||
        `${winnerUser.firstName} ${winnerUser.lastName}`.trim() ||
        winnerUser.phone;

      await prisma.$transaction([
        // Credit winner's winBalance
        prisma.user.update({
          where: { id: winnerEntry.userId },
          data: {
            winBalance: { increment: match.prize },
          },
        }),
        // Record win transaction
        prisma.transaction.create({
          data: {
            userId: winnerEntry.userId,
            userName: winnerName,
            userPhone: winnerUser.phone,
            type: "MATCH_WIN",
            amount: match.prize,
            status: "APPROVED",
            note: `ম্যাচ #${match.matchNo} জয়ের পুরস্কার (${maxPlayers} জন খেলোয়াড়) — উভয় খেলোয়াড়ের ফলাফল নিশ্চিত`,
          },
        }),
        // Update match to COMPLETED
        prisma.match.update({
          where: { id },
          data: {
            status: "COMPLETED",
            winnerId: winnerEntry.userId,
            winnerName,
            players: updatedPlayers as any,
            creatorResult: isCreator ? result : match.creatorResult,
            opponentResult: isOpponent ? result : match.opponentResult,
            creatorProofUrl: isCreator && proofUrl ? proofUrl : match.creatorProofUrl,
            opponentProofUrl: isOpponent && proofUrl ? proofUrl : match.opponentProofUrl,
          },
        }),
      ]);

      // Notify winner
      await prisma.notification.create({
        data: {
          userId: winnerEntry.userId,
          title: `🏆 অভিনন্দন! ম্যাচ #${match.matchNo} জিতেছেন!`,
          message: `উভয় খেলোয়াড়ের ফলাফল যাচাই হয়েছে! ৳${match.prize} আপনার উইনিং ব্যালেন্সে যোগ হয়েছে।`,
          type: "SUCCESS",
          link: "/wallet",
        },
      });

      // Notify loser(s)
      for (const p of updatedPlayers) {
        if (p.userId !== winnerEntry.userId) {
          await prisma.notification.create({
            data: {
              userId: p.userId,
              title: `ম্যাচ #${match.matchNo} সমাপ্ত`,
              message: `${winnerName} বিজয়ী হয়েছেন। পরবর্তী ম্যাচে শুভকামনা!`,
              type: "INFO",
              link: `/matches/${match.id}`,
            },
          });
        }
      }

      return NextResponse.json({
        success: true,
        completed: true,
        message: `🏆 ম্যাচ সমাপ্ত! ${winnerName} বিজয়ী হয়েছেন এবং ৳${match.prize} ব্যালেন্সে যোগ হয়েছে।`,
      });
    }

    // =========================================================================
    // CASE 3: PENDING OPPONENT (Single player submitted, waiting for other)
    // =========================================================================
    await prisma.match.update({
      where: { id },
      data: {
        players: updatedPlayers as any,
        creatorResult: isCreator ? result : match.creatorResult,
        opponentResult: isOpponent ? result : match.opponentResult,
        creatorProofUrl: isCreator && proofUrl ? proofUrl : match.creatorProofUrl,
        opponentProofUrl: isOpponent && proofUrl ? proofUrl : match.opponentProofUrl,
      },
    });

    // Notify the other player(s) that opponent submitted
    for (const p of updatedPlayers) {
      if (p.userId !== user.id && !p.result) {
        await prisma.notification.create({
          data: {
            userId: p.userId,
            title: `🎮 ম্যাচ #${match.matchNo}: প্রতিপক্ষ ফলাফল জমা দিয়েছেন`,
            message: `${myPlayerEntry?.name || user.firstName} ফলাফল জমা দিয়েছেন (${result === "WON" ? "জয়ের দাবি করেছেন" : "পরাজয় নিশ্চিত করেছেন"})। দয়া করে আপনার ফলাফল জমা দিন।`,
            type: "INFO",
            link: `/matches/${match.id}`,
          },
        });
      }
    }

    const statusMsg =
      result === "WON"
        ? "আপনার জয়ের দাবি ও প্রমাণ জমা হয়েছে! প্রতিপক্ষের ফলাফলের অপেক্ষা করা হচ্ছে। প্রতিপক্ষ নিশ্চিত করলে বা এডমিন অনুমোদন দিলে ব্যালেন্স যোগ হবে।"
        : "আপনার ফলাফল জমা হয়েছে। প্রতিপক্ষের ফলাফলের অপেক্ষা করা হচ্ছে।";

    return NextResponse.json({
      success: true,
      pendingOpponent: true,
      message: statusMsg,
    });
  } catch (error) {
    console.error("Error submitting result:", error);
    return NextResponse.json({ error: "ফলাফল জমা দিতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
