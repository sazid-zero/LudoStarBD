import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { MatchPlayer } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত এক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "ALL";
    const search = (searchParams.get("search") || "").trim().toLowerCase();

    const matchesListRaw = await prisma.match.findMany({
      orderBy: { createdAt: "desc" },
    });

    let allMatches = [...matchesListRaw];

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

    const sanitizedMatches = allMatches.map((m) => ({
      ...m,
      players: (m.players as unknown as MatchPlayer[]) || [],
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      matches: sanitizedMatches,
      totalCount: sanitizedMatches.length,
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
      const count = await prisma.match.count();
      const matchNo = 2000 + count + 1;

      const newMatch = await prisma.match.create({
        data: {
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
          players: [] as any,
        },
      });

      return NextResponse.json({
        success: true,
        message: `অফিসিয়াল ম্যাচ #${matchNo} সফলভাবে তৈরি করা হয়েছে!`,
        match: {
          ...newMatch,
          players: [],
          createdAt: newMatch.createdAt.toISOString(),
          updatedAt: newMatch.updatedAt.toISOString(),
        },
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

      const match = await prisma.match.findUnique({
        where: { id: matchId },
      });

      if (!match) {
        return NextResponse.json({ error: "ম্যাচ পাওয়া যায়নি।" }, { status: 404 });
      }

      const updated = await prisma.match.update({
        where: { id: matchId },
        data: {
          roomCode: cleanRoomCode,
          status: match.status === "WAITING" && match.opponentId ? "RUNNING" : match.status,
        },
      });

      // Auto-approve any pending MATCH_FEE transactions associated with this match
      const relatedTrxs = await prisma.transaction.findMany({
        where: {
          type: "MATCH_FEE",
          status: "PENDING",
          OR: [
            ...(match.creatorId ? [{ userId: match.creatorId }] : []),
            ...(match.opponentId ? [{ userId: match.opponentId }] : []),
          ],
          note: { contains: `#${match.matchNo}` },
        },
      });

      for (const trx of relatedTrxs) {
        await prisma.transaction.update({
          where: { id: trx.id },
          data: {
            status: "APPROVED",
            note: `${trx.note} (রুম কোড প্রদানের মাধ্যমে ভেরিফাইড)`,
          },
        });
      }

      // Send notifications to all players (supports 2/3/4 player)
      const players = (match.players as unknown as MatchPlayer[]) || [];
      const allPlayers =
        players.length > 0
          ? players
          : [
              ...(match.creatorId ? [{ userId: match.creatorId }] : []),
              ...(match.opponentId ? [{ userId: match.opponentId }] : []),
            ];

      for (const p of allPlayers) {
        await prisma.notification.create({
          data: {
            userId: p.userId,
            title: `🎮 ম্যাচ #${match.matchNo} রুম কোড তৈরি!`,
            message: `Ludo King রুম কোড: ${cleanRoomCode}। এখনই গেমে জয়েন করুন।`,
            type: "SUCCESS",
            link: `/matches/${match.id}`,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: "রুম কোড সফলভাবে সংরক্ষণ ও প্লেয়ারদের কাছে পাঠানো হয়েছে!",
        match: {
          ...updated,
          players: (updated.players as unknown as MatchPlayer[]) || [],
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        },
      });
    }

    // Action 3: Resolve Dispute & Declare Winner (supports 2/3/4-player)
    if (action === "RESOLVE_WINNER") {
      const match = await prisma.match.findUnique({
        where: { id: matchId },
      });

      if (!match) {
        return NextResponse.json({ error: "ম্যাচ পাওয়া যায়নি" }, { status: 404 });
      }

      const winnerUser = await prisma.user.findUnique({
        where: { id: winnerId },
      });

      if (!winnerUser) {
        return NextResponse.json({ error: "বিজয়ী খেলোয়াড় পাওয়া যায়নি" }, { status: 404 });
      }

      const winnerDisplayName = `${winnerUser.firstName} ${winnerUser.lastName}`.trim() || winnerUser.phone;

      const [, , updated] = await prisma.$transaction([
        // Credit winner's winBalance
        prisma.user.update({
          where: { id: winnerId },
          data: {
            winBalance: { increment: match.prize },
          },
        }),
        // Record transaction
        prisma.transaction.create({
          data: {
            userId: winnerId,
            userName: winnerDisplayName,
            userPhone: winnerUser.phone,
            type: "MATCH_WIN",
            amount: match.prize,
            status: "APPROVED",
            note: `এডমিন যাচাই শেষে ম্যাচ #${match.matchNo} জয়ের পুরস্কার প্রদান`,
          },
        }),
        prisma.match.update({
          where: { id: matchId },
          data: {
            status: "COMPLETED",
            winnerId,
            winnerName: winnerDisplayName,
            adminNotes: `এডমিন কর্তৃক স্ক্রিনশট যাচাই শেষে ${winnerDisplayName}-কে বিজয়ী ঘোষিত ও ৳${match.prize} প্রদান করা হয়েছে`,
          },
        }),
      ]);

      // Notify winner
      await prisma.notification.create({
        data: {
          userId: winnerId,
          title: `🏆 অভিনন্দন! ম্যাচ #${match.matchNo} জয়ী হয়েছেন!`,
          message: `এডমিন আপনার উইনিং স্ক্রিনশট যাচাই করে পুরস্কার ৳${match.prize} আপনার উইনিং ব্যালেন্সে যুক্ত করেছেন।`,
          type: "SUCCESS",
          link: `/wallet`,
        },
      });

      // Notify all other players (losers) — supports 2/3/4 player
      const players = (match.players as unknown as MatchPlayer[]) || [];
      const allMatchPlayers =
        players.length > 0
          ? players
          : [
              ...(match.creatorId ? [{ userId: match.creatorId }] : []),
              ...(match.opponentId ? [{ userId: match.opponentId }] : []),
            ];

      for (const p of allMatchPlayers) {
        if (p.userId !== winnerId) {
          await prisma.notification.create({
            data: {
              userId: p.userId,
              title: `ম্যাচ #${match.matchNo} সমাপ্ত`,
              message: `এডমিন স্ক্রিনশট যাচাই শেষে ${winnerDisplayName}-কে বিজয়ী ঘোষণা করেছেন। পরবর্তী ম্যাচে শুভকামনা!`,
              type: "INFO",
              link: `/matches/${match.id}`,
            },
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: `ম্যাচ #${match.matchNo} সমাধান করা হয়েছে! বিজয়ী: ${winnerDisplayName}, ৳${match.prize} পুরস্কার ব্যালেন্সে জমা হয়েছে।`,
        match: {
          ...updated,
          players: (updated.players as unknown as MatchPlayer[]) || [],
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        },
      });
    }

    // Action 4: Cancel & Refund (supports 2/3/4-player)
    if (action === "CANCEL_REFUND") {
      const match = await prisma.match.findUnique({
        where: { id: matchId },
      });

      if (!match) {
        return NextResponse.json({ error: "ম্যাচ পাওয়া যায়নি" }, { status: 404 });
      }

      const players = (match.players as unknown as MatchPlayer[]) || [];
      const playersToRefund =
        players.length > 0
          ? players
          : [
              ...(match.creatorId ? [{ userId: match.creatorId, name: match.creatorName || "হোস্ট", slot: 1, phone: match.creatorPhone || "", isHost: true, joinedAt: "" }] : []),
              ...(match.opponentId ? [{ userId: match.opponentId, name: match.opponentName || "খেলোয়াড় ২", slot: 2, phone: match.opponentPhone || "", isHost: false, joinedAt: "" }] : []),
            ];

      const dbOps: any[] = [];
      let refundCount = 0;

      for (const player of playersToRefund) {
        dbOps.push(
          prisma.user.update({
            where: { id: player.userId },
            data: {
              mainBalance: { increment: match.entryFee },
            },
          })
        );
        dbOps.push(
          prisma.transaction.create({
            data: {
              userId: player.userId,
              userName: player.name,
              userPhone: player.phone,
              type: "DEPOSIT",
              amount: match.entryFee,
              status: "APPROVED",
              note: `এডমিন কর্তৃক ম্যাচ #${match.matchNo} বাতিল — এন্ট্রি ফি রিফান্ড`,
            },
          })
        );
        refundCount++;
      }

      dbOps.push(
        prisma.match.update({
          where: { id: matchId },
          data: {
            status: "CANCELLED",
            adminNotes: `এডমিন কর্তৃক ম্যাচ বাতিল — ${refundCount} জন খেলোয়াড়ের এন্ট্রি ফি রিফান্ড করা হয়েছে`,
          },
        })
      );

      const results = await prisma.$transaction(dbOps);
      const updated = results[results.length - 1] as typeof match;

      for (const player of playersToRefund) {
        await prisma.notification.create({
          data: {
            userId: player.userId,
            title: `ম্যাচ #${match.matchNo} বাতিল ও রিফান্ড`,
            message: `এডমিন ম্যাচটি বাতিল করেছেন। এন্ট্রি ফি ৳${match.entryFee} আপনার মেইন ব্যালেন্সে ফেরত দেওয়া হয়েছে।`,
            type: "ALERT",
            link: `/wallet`,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: `ম্যাচ #${match.matchNo} বাতিল ও ${refundCount} জন খেলোয়াড়ের এন্ট্রি ফি রিফান্ড করা হয়েছে।`,
        match: {
          ...updated,
          players: (updated.players as unknown as MatchPlayer[]) || [],
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        },
      });
    }

    // Action 5: Delete Match
    if (action === "DELETE") {
      try {
        await prisma.match.delete({
          where: { id: matchId },
        });

        return NextResponse.json({
          success: true,
          message: "ম্যাচটি সফলভাবে ডিলিট করা হয়েছে।",
        });
      } catch {
        return NextResponse.json({ error: "ম্যাচ পাওয়া যায়নি বা ইতিমধ্যে মুছে ফেলা হয়েছে।" }, { status: 404 });
      }
    }

    return NextResponse.json({ error: "অবৈধ অ্যাকশন।" }, { status: 400 });
  } catch (error) {
    console.error("Admin match action error:", error);
    return NextResponse.json({ error: "অ্যাকশন সম্পন্ন করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
