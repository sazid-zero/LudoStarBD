export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { MatchPlayer } from "@/lib/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let match = await prisma.match.findUnique({
      where: { id },
    });

    if (!match) {
      return NextResponse.json({ error: "ম্যাচ পাওয়া যায়নি" }, { status: 404 });
    }

    let players = (match.players as unknown as MatchPlayer[]) || [];

    // ─────────────────────────────────────────────────────────────────────────────
    // ⏱️ 15-MINUTE AUTO-FORFEIT CHECK
    // If match is RUNNING, 1 player claimed WON >= 15 mins ago, and opponent hasn't responded:
    // Auto-complete match in favor of the claimed winner!
    // ─────────────────────────────────────────────────────────────────────────────
    if (match.status === "RUNNING") {
      const winnerClaim = players.find(
        (p) => p.result === "WON" && p.submittedAt
      );
      const otherClaim = players.find(
        (p) => p.userId !== winnerClaim?.userId && (p.result === "WON" || p.result === "DISPUTE")
      );

      if (winnerClaim && !otherClaim && winnerClaim.submittedAt) {
        const elapsedMs = Date.now() - new Date(winnerClaim.submittedAt).getTime();
        const FIFTEEN_MINUTES = 15 * 60 * 1000;

        if (elapsedMs >= FIFTEEN_MINUTES) {
          const winnerUser = await prisma.user.findUnique({
            where: { id: winnerClaim.userId },
          });

          if (winnerUser) {
            const winnerName =
              winnerClaim.name ||
              `${winnerUser.firstName} ${winnerUser.lastName}`.trim() ||
              winnerUser.phone;

            await prisma.$transaction([
              prisma.user.update({
                where: { id: winnerClaim.userId },
                data: { winBalance: { increment: match.prize } },
              }),
              prisma.transaction.create({
                data: {
                  userId: winnerClaim.userId,
                  userName: winnerName,
                  userPhone: winnerUser.phone,
                  type: "MATCH_WIN",
                  amount: match.prize,
                  status: "APPROVED",
                  note: `ম্যাচ #${match.matchNo} জয়ের পুরস্কার — প্রতিপক্ষ ১৫ মিনিটে রেসপন্স না করায় স্বয়ংক্রিয় জয় (Forfeit)`,
                },
              }),
              prisma.match.update({
                where: { id },
                data: {
                  status: "COMPLETED",
                  winnerId: winnerClaim.userId,
                  winnerName,
                  adminNotes: "প্রতিপক্ষ নির্ধারিত ১৫ মিনিটে কোনো ফলাফল জমা না দেওয়ায় ফরফিট/স্বয়ংক্রিয় জয় প্রদান করা হয়েছে",
                },
              }),
            ]);

            // Notify winner
            await prisma.notification.create({
              data: {
                userId: winnerClaim.userId,
                title: `🏆 অভিনন্দন! ম্যাচ #${match.matchNo} স্বয়ংক্রিয় জয়!`,
                message: `প্রতিপক্ষ ১৫ মিনিটে ফলাফল জমা না দেওয়ায় আপনি ওয়াকওভার বিজয়ী হয়েছেন! ৳${match.prize} ব্যালেন্সে যোগ হয়েছে।`,
                type: "SUCCESS",
                link: "/wallet",
              },
            });

            // Re-fetch match
            const fresh = await prisma.match.findUnique({ where: { id } });
            if (fresh) {
              match = fresh;
              players = (match.players as unknown as MatchPlayer[]) || [];
            }
          }
        }
      }
    }

    const currentUser = await getSessionUser();
    players = (match.players as unknown as MatchPlayer[]) || [];
    const isParticipant =
      currentUser &&
      (match.creatorId === currentUser.id ||
        match.opponentId === currentUser.id ||
        players.some((p) => p.userId === currentUser.id));
    const isAdmin = currentUser && currentUser.role === "ADMIN";

    // Without depositing/paying entry fee and joining, room code is strictly hidden!
    const sanitizedMatch = {
      ...match,
      roomCode: isParticipant || isAdmin ? match.roomCode : null,
      players,
      createdAt: match.createdAt.toISOString(),
      updatedAt: match.updatedAt.toISOString(),
    };

    return NextResponse.json({
      match: sanitizedMatch,
      currentUserId: currentUser ? currentUser.id : null,
      isParticipant: Boolean(isParticipant),
    });
  } catch (error) {
    console.error("Error fetching match:", error);
    return NextResponse.json({ error: "ম্যাচ লোড করা সম্ভব হয়নি" }, { status: 500 });
  }
}
