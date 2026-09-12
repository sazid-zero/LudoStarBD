import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত এক্সেস। এডমিন একাউন্টে লগইন করুন।" }, { status: 403 });
    }

    const [allUsers, allMatches, allTransactions, activeNotice] = await Promise.all([
      prisma.user.findMany(),
      prisma.match.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.transaction.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.notice.findFirst({ where: { isActive: true }, orderBy: { createdAt: "desc" } }),
    ]);

    // Only count wallet DEPOSIT requests as pending deposits (not MATCH_FEE)
    const allPendingPayments = allTransactions.filter(
      (t) => t.type === "DEPOSIT" && t.status === "PENDING"
    );
    const approvedDeposits = allTransactions.filter(
      (t) => t.type === "DEPOSIT" && t.status === "APPROVED"
    );
    const totalDepositAmount = approvedDeposits.reduce((sum, t) => sum + t.amount, 0);
    const pendingDepositAmount = allPendingPayments.reduce((sum, t) => sum + t.amount, 0);

    // Withdrawals breakdown
    const withdrawals = allTransactions.filter((t) => t.type === "WITHDRAW");
    const pendingWithdrawals = withdrawals.filter((t) => t.status === "PENDING");
    const approvedWithdrawals = withdrawals.filter((t) => t.status === "APPROVED");
    const totalWithdrawAmount = approvedWithdrawals.reduce((sum, t) => sum + t.amount, 0);
    const pendingWithdrawAmount = pendingWithdrawals.reduce((sum, t) => sum + t.amount, 0);

    // Matches breakdown
    const activeMatches = allMatches.filter(
      (m) => m.status === "WAITING" || m.status === "RUNNING" || m.status === "DISPUTED"
    );
    const disputedMatches = allMatches.filter((m) => m.status === "DISPUTED");
    const completedMatches = allMatches.filter((m) => m.status === "COMPLETED");

    // Matches awaiting room code: any active match where at least 1 or 2 players have joined and roomCode is not yet set
    const matchesAwaitingRoomCode = allMatches.filter(
      (m) =>
        (m.status === "RUNNING" || (m.status === "WAITING" && Boolean(m.creatorId))) &&
        !m.roomCode
    );

    // Matches with submitted victory screenshot proofs
    const matchesWithProof = allMatches.filter(
      (m) =>
        m.status !== "COMPLETED" &&
        m.status !== "CANCELLED" &&
        Boolean(
          m.creatorProofUrl ||
          m.opponentProofUrl ||
          m.creatorResult === "WON" ||
          m.opponentResult === "WON" ||
          m.status === "DISPUTED"
        )
    );

    // Platform Rake / Commission from completed matches
    const totalPlatformRake = completedMatches.reduce((sum, m) => {
      const matchRake = (m.entryFee * 2) - m.prize;
      return sum + Math.max(0, matchRake);
    }, 0);

    return NextResponse.json({
      stats: {
        totalUsers: allUsers.length,
        activeUsers: allUsers.filter((u) => !u.isBanned).length,
        bannedUsers: allUsers.filter((u) => u.isBanned).length,
        
        totalDepositAmount,
        pendingDepositsCount: allPendingPayments.length,
        pendingDepositAmount,
        
        totalWithdrawAmount,
        pendingWithdrawalsCount: pendingWithdrawals.length,
        pendingWithdrawAmount,
        
        totalMatches: allMatches.length,
        activeMatchesCount: activeMatches.length,
        matchesAwaitingRoomCodeCount: matchesAwaitingRoomCode.length,
        matchesWithProofCount: matchesWithProof.length,
        disputedMatchesCount: disputedMatches.length,
        completedMatchesCount: completedMatches.length,
        totalPlatformRake,
      },
      pendingDeposits: allPendingPayments.slice(0, 15),
      pendingWithdrawals: pendingWithdrawals.slice(0, 15),
      matchesAwaitingRoomCode,
      matchesWithProof,
      disputedMatches,
      recentTransactions: allTransactions.slice(0, 10),
      notice: activeNotice?.text || "",
    });
  } catch (error) {
    console.error("Admin overview error:", error);
    return NextResponse.json({ error: "এডমিন ডেটা লোড করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
