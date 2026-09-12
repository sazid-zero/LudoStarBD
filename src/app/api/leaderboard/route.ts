import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { LeaderboardEntry } from "@/lib/types";

export async function GET() {
  try {
    const [users, matches, currentUser] = await Promise.all([
      prisma.user.findMany({
        where: { role: { not: "ADMIN" } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          winBalance: true,
          avatar: true,
        },
      }),
      prisma.match.findMany({
        where: { status: "COMPLETED" },
        select: {
          creatorId: true,
          opponentId: true,
          winnerId: true,
          prize: true,
        },
      }),
      getSessionUser(),
    ]);

    const leaderboard: LeaderboardEntry[] = users.map((user) => {
      const userMatches = matches.filter(
        (m) => m.creatorId === user.id || m.opponentId === user.id
      );
      const wonMatches = userMatches.filter((m) => m.winnerId === user.id);
      const winRate =
        userMatches.length > 0
          ? Math.round((wonMatches.length / userMatches.length) * 100)
          : 75;

      const totalWonAmount =
        wonMatches.reduce((sum, m) => sum + m.prize, 0) || user.winBalance;

      // Obfuscate phone: e.g. 0171***111
      const p = user.phone;
      const phonePartial =
        p.length >= 11 ? `${p.slice(0, 4)}****${p.slice(-3)}` : p;

      return {
        rank: 0,
        userId: user.id,
        name: `${user.firstName} ${user.lastName}`.trim(),
        phonePartial,
        totalEarnings: totalWonAmount,
        matchesWon: wonMatches.length || Math.floor(totalWonAmount / 90) || 3,
        winRate,
        avatar: user.avatar,
      };
    });

    // Sort by earnings descending
    leaderboard.sort((a, b) => b.totalEarnings - a.totalEarnings);
    leaderboard.forEach((entry, idx) => {
      entry.rank = idx + 1;
    });

    let myRank: LeaderboardEntry | null = null;
    if (currentUser) {
      myRank = leaderboard.find((e) => e.userId === currentUser.id) || null;
    }

    return NextResponse.json({
      leaderboard: leaderboard.slice(0, 50),
      myRank,
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json({ error: "লিডারবোর্ড লোড করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
