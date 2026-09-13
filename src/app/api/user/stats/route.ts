import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ played: 0, won: 0, winnings: 0 });
    }

    // Fetch matches participated by user
    const userMatches = await prisma.match.findMany({
      where: {
        OR: [
          { creatorId: user.id },
          { opponentId: user.id },
        ],
      },
      select: {
        id: true,
        status: true,
        winnerId: true,
        prize: true,
      },
    });

    const played = userMatches.length;
    const wonMatches = userMatches.filter((m) => m.winnerId === user.id);
    const won = wonMatches.length;
    const totalMatchWinnings = wonMatches.reduce((acc, m) => acc + (m.prize || 0), 0);
    const winnings = totalMatchWinnings > 0 ? totalMatchWinnings : user.winBalance;

    return NextResponse.json({
      played,
      won,
      winnings,
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json({ played: 0, won: 0, winnings: 0 }, { status: 500 });
  }
}
