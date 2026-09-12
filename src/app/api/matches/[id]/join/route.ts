import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { MatchPlayer } from "@/lib/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "অননুমোদিত এক্সেস। লগইন করুন।" }, { status: 401 });
    }

    const { id } = await params;
    const [match, user] = await Promise.all([
      prisma.match.findUnique({ where: { id } }),
      prisma.user.findUnique({ where: { id: sessionUser.id } }),
    ]);

    if (!match) {
      return NextResponse.json({ error: "ম্যাচ পাওয়া যায়নি" }, { status: 404 });
    }

    if (!user) {
      return NextResponse.json({ error: "ইউজার পাওয়া যায়নি।" }, { status: 404 });
    }

    const maxPlayers = match.maxPlayers || 2;

    // Backfill players array if legacy match
    let currentPlayers: MatchPlayer[] = (match.players as unknown as MatchPlayer[]) || [];
    if (currentPlayers.length === 0) {
      if (match.creatorId) {
        currentPlayers.push({
          userId: match.creatorId,
          name: match.creatorName || "খেলোয়াড় ১",
          phone: match.creatorPhone || "",
          slot: 1,
          isHost: true,
          joinedAt: match.createdAt.toISOString(),
        });
      }
      if (match.opponentId) {
        currentPlayers.push({
          userId: match.opponentId,
          name: match.opponentName || "খেলোয়াড় ২",
          phone: match.opponentPhone || "",
          slot: 2,
          isHost: false,
          joinedAt: match.updatedAt.toISOString(),
        });
      }
    }

    // Prevent joining if match is not open or seats are full
    if (match.status !== "WAITING" || currentPlayers.length >= maxPlayers) {
      return NextResponse.json({ error: "এই ম্যাচটিতে সকল সিট পূর্ণ হয়ে গিয়েছে।" }, { status: 400 });
    }

    // Prevent joining same match twice
    const alreadyJoined =
      currentPlayers.some((p) => p.userId === user.id) ||
      match.creatorId === user.id ||
      match.opponentId === user.id;

    if (alreadyJoined) {
      return NextResponse.json({ error: "আপনি ইতিমধ্যেই এই ম্যাচে জয়েন করে আছেন।" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const playerName =
      body.ludoKingName?.trim() || `${user.firstName} ${user.lastName}`.trim() || user.phone;
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

    const deductMain = Math.min(user.mainBalance, fee);
    const deductWin = fee - deductMain;

    const nextSlot = currentPlayers.length + 1;
    const newPlayer: MatchPlayer = {
      userId: user.id,
      name: playerName,
      phone: user.phone,
      slot: nextSlot,
      isHost: false,
      joinedAt: new Date().toISOString(),
      mfsProvider: isDirectTrx ? paymentMethod : "WALLET",
    };

    const updatedPlayers = [...currentPlayers, newPlayer];
    const isNowFull = updatedPlayers.length >= maxPlayers;

    const matchUpdates: any = {
      players: updatedPlayers as any,
      status: isNowFull ? "RUNNING" : "WAITING",
    };

    // Keep creatorId and opponentId for backwards compatibility
    if (nextSlot === 1) {
      matchUpdates.creatorId = user.id;
      matchUpdates.creatorName = playerName;
      matchUpdates.creatorPhone = user.phone;
    } else if (nextSlot === 2) {
      matchUpdates.opponentId = user.id;
      matchUpdates.opponentName = playerName;
      matchUpdates.opponentPhone = user.phone;
    }

    const dbOps: any[] = [];

    // If using wallet balance, deduct fee
    if (!isDirectTrx) {
      dbOps.push(
        prisma.user.update({
          where: { id: user.id },
          data: {
            mainBalance: { decrement: deductMain },
            winBalance: { decrement: deductWin },
          },
        })
      );
    }

    dbOps.push(
      prisma.match.update({
        where: { id },
        data: matchUpdates,
      })
    );

    dbOps.push(
      prisma.transaction.create({
        data: {
          userId: user.id,
          userName: `${user.firstName} ${user.lastName}`.trim(),
          userPhone: user.phone,
          type: "MATCH_FEE",
          amount: fee,
          status: isDirectTrx ? "PENDING" : "APPROVED",
          mfsProvider: isDirectTrx ? (paymentMethod as any) : null,
          accountNumber: senderPhone,
          trxId: trxId,
          note: isDirectTrx
            ? `ম্যাচ #${match.matchNo} ডিরেক্ট ${paymentMethod} পেমেন্ট জয়েন (TrxID: ${trxId})`
            : `ম্যাচ #${match.matchNo} জয়েন ফি কাটা হয়েছে (স্লট ${nextSlot}/${maxPlayers})`,
        },
      })
    );

    const results = await prisma.$transaction(dbOps);
    const updatedMatch = (isDirectTrx ? results[0] : results[1]) as typeof match;

    // If match is now full, notify players
    if (isNowFull) {
      for (const p of updatedPlayers) {
        if (match.roomCode) {
          await prisma.notification.create({
            data: {
              userId: p.userId,
              title: `🎮 ম্যাচ #${match.matchNo} শুরু হয়েছে!`,
              message: `সকল প্লেয়ার যুক্ত হয়েছে! Ludo King রুম কোড: ${match.roomCode}। এখনই গেমে জয়েন করুন।`,
              type: "SUCCESS",
              link: `/matches/${match.id}`,
            },
          });
        } else if (p.isHost) {
          await prisma.notification.create({
            data: {
              userId: p.userId,
              title: `⚡ ম্যাচ #${match.matchNo} সিট পূর্ণ হয়েছে!`,
              message: `সকল ${maxPlayers} জন খেলোয়াড় জয়েন করেছে। দ্রুত Ludo King থেকে রুম কোড দিন।`,
              type: "ALERT",
              link: `/matches/${match.id}`,
            },
          });
        } else {
          await prisma.notification.create({
            data: {
              userId: p.userId,
              title: `⚡ ম্যাচ #${match.matchNo} সিট পূর্ণ হয়েছে!`,
              message: `ম্যাচে ${maxPlayers} জন পূর্ণ হয়েছে। হোস্ট প্লেয়ার শীঘ্রই রুম কোড দিচ্ছেন।`,
              type: "INFO",
              link: `/matches/${match.id}`,
            },
          });
        }
      }
    }

    const messageText = isNowFull
      ? `সফলভাবে ${nextSlot}ম খেলোয়াড় হিসেবে জয়েন করেছেন! সকল সিট (${maxPlayers}/${maxPlayers}) পূর্ণ হয়েছে, খেলা শুরু!`
      : `সফলভাবে ${nextSlot}ম খেলোয়াড় হিসেবে জয়েন করেছেন! (${updatedPlayers.length}/${maxPlayers} জন যুক্ত)`;

    return NextResponse.json({
      success: true,
      message: messageText,
      match: {
        ...updatedMatch,
        players: (updatedMatch.players as unknown as MatchPlayer[]) || [],
        createdAt: updatedMatch.createdAt.toISOString(),
        updatedAt: updatedMatch.updatedAt.toISOString(),
      },
      slotsFilled: updatedPlayers.length,
      maxPlayers,
    });
  } catch (error) {
    console.error("Error joining match:", error);
    return NextResponse.json({ error: "ম্যাচে জয়েন করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
