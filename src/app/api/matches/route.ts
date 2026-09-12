import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { MatchPlayer } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const myOnly = searchParams.get("myOnly") === "true";

    const currentUser = await getSessionUser();

    const where: any = {};
    if (status) {
      where.status = status.toUpperCase();
    }

    let matches = await prisma.match.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    if (myOnly && currentUser) {
      matches = matches.filter((m) => {
        const players = (m.players as unknown as MatchPlayer[]) || [];
        return (
          m.creatorId === currentUser.id ||
          m.opponentId === currentUser.id ||
          players.some((p) => p.userId === currentUser.id)
        );
      });
    }

    // Room ID is strictly hidden from non-participants
    const sanitizedMatches = matches.map((m) => {
      const players = (m.players as unknown as MatchPlayer[]) || [];
      const isParticipant =
        currentUser &&
        (m.creatorId === currentUser.id ||
          m.opponentId === currentUser.id ||
          players.some((p) => p.userId === currentUser.id));
      const isAdmin = currentUser && currentUser.role === "ADMIN";

      return {
        ...m,
        roomCode: isParticipant || isAdmin ? m.roomCode : null,
        players,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
      };
    });

    // Attach active notice
    const notice = await prisma.notice.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

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
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "অননুমোদিত এক্সেস। লগইন করুন।" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
    });

    if (!user) {
      return NextResponse.json({ error: "ইউজার পাওয়া যায়নি।" }, { status: 404 });
    }

    const body = await request.json();
    const { entryFee, matchType = "1v1 Classic", roomCode } = body;

    const fee = Number(entryFee);
    if (!fee || fee < 10) {
      return NextResponse.json({ error: "সঠিক এন্ট্রি ফি নির্ধারণ করুন (কমপক্ষে ১০ টাকা)।" }, { status: 400 });
    }

    const playersCount = 2; // Strictly 1v1

    // Calculate total available balance
    const totalBalance = user.mainBalance + user.winBalance;
    if (totalBalance < fee) {
      return NextResponse.json(
        { error: "আপনার একাউন্টে পর্যাপ্ত ব্যালেন্স নেই। অনুগ্রহ করে ডিপোজিট করুন।" },
        { status: 400 }
      );
    }

    // Deduct fee: first from mainBalance, then remainder from winBalance
    const deductMain = Math.min(user.mainBalance, fee);
    const deductWin = fee - deductMain;

    // 10% platform commission: totalPot (fee * 2) * 0.9
    const totalPot = fee * 2;
    const prize = Math.round(totalPot * 0.9);

    const matchesCount = await prisma.match.count();
    const matchNo = 2000 + matchesCount + 1;

    const cleanRoomCode = roomCode ? String(roomCode).trim().replace(/\s+/g, "") : null;
    const userName = `${user.firstName} ${user.lastName}`.trim() || user.phone;
    const modeTitle = `১ বনাম ১ ম্যাচ #${matchNo}`;

    const initialPlayer: MatchPlayer = {
      userId: user.id,
      name: userName,
      phone: user.phone,
      slot: 1,
      isHost: true,
      joinedAt: new Date().toISOString(),
    };

    const [updatedUser, newMatch] = await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          mainBalance: { decrement: deductMain },
          winBalance: { decrement: deductWin },
        },
      }),
      prisma.match.create({
        data: {
          matchNo,
          title: modeTitle,
          entryFee: fee,
          prize,
          matchType,
          maxPlayers: playersCount,
          roomCode: cleanRoomCode,
          status: "WAITING",
          creatorId: user.id,
          creatorPhone: user.phone,
          creatorName: userName,
          players: [initialPlayer] as any,
        },
      }),
      prisma.transaction.create({
        data: {
          userId: user.id,
          userName,
          userPhone: user.phone,
          type: "MATCH_FEE",
          amount: fee,
          status: "APPROVED",
          note: `ম্যাচ #${matchNo} এন্ট্রি ফি কাটা হয়েছে`,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "ম্যাচ সফলভাবে তৈরি হয়েছে!",
      match: {
        ...newMatch,
        players: (newMatch.players as unknown as MatchPlayer[]) || [],
        createdAt: newMatch.createdAt.toISOString(),
        updatedAt: newMatch.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error creating match:", error);
    return NextResponse.json({ error: "ম্যাচ তৈরি করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
