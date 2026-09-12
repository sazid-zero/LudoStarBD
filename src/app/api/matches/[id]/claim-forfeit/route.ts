export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { MatchPlayer } from "@/lib/types";

const FORFEIT_TIMEOUT_MS = 15 * 60 * 1000;

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
    const match = await prisma.match.findUnique({ where: { id } });

    if (!match) return NextResponse.json({ error: "ম্যাচ পাওয়া যায়নি" }, { status: 404 });
    if (match.status === "COMPLETED") return NextResponse.json({ error: "ম্যাচ ইতিমধ্যে সম্পন্ন হয়েছে।" }, { status: 400 });
    if (match.status !== "RUNNING") return NextResponse.json({ error: "ম্যাচটি চলমান নয়।" }, { status: 400 });

    let currentPlayers: MatchPlayer[] = (match.players as unknown as MatchPlayer[]) || [];
    if (currentPlayers.length === 0) {
      if (match.creatorId) currentPlayers.push({ userId: match.creatorId, name: match.creatorName || "খেলোয়াড় ১", phone: match.creatorPhone || "", slot: 1, isHost: true, joinedAt: match.createdAt.toISOString() });
      if (match.opponentId) currentPlayers.push({ userId: match.opponentId, name: match.opponentName || "খেলোয়াড় ২", phone: match.opponentPhone || "", slot: 2, isHost: false, joinedAt: match.updatedAt.toISOString() });
    }

    const myEntry = currentPlayers.find((p) => p.userId === user.id);
    const isCreator = match.creatorId === user.id;
    const isOpponent = match.opponentId === user.id;

    if (!myEntry && !isCreator && !isOpponent) {
      return NextResponse.json({ error: "আপনি এই ম্যাচের খেলোয়াড় নন।" }, { status: 403 });
    }

    const legacyMyClaim = isCreator ? match.creatorResult : isOpponent ? match.opponentResult : null;
    const actualClaim = myEntry?.result || legacyMyClaim;

    if (actualClaim !== "WON") {
      return NextResponse.json({ error: "ফরফেইট দাবি করতে হলে আগে জয়ের ফলাফল জমা দিতে হবে।" }, { status: 400 });
    }

    const submittedTime = myEntry?.submittedAt ? new Date(myEntry.submittedAt).getTime() : null;
    if (!submittedTime) {
      return NextResponse.json({ error: "ফলাফল জমা দেওয়ার সময় পাওয়া যায়নি।" }, { status: 400 });
    }

    const elapsedMs = Date.now() - submittedTime;
    if (elapsedMs < FORFEIT_TIMEOUT_MS) {
      const remainingMinutes = Math.ceil((FORFEIT_TIMEOUT_MS - elapsedMs) / 60000);
      return NextResponse.json({ error: `এখনও ${remainingMinutes} মিনিট বাকি। ১৫ মিনিট পর ফরফেইট দাবি করা যাবে।`, remainingMs: FORFEIT_TIMEOUT_MS - elapsedMs }, { status: 400 });
    }

    const opponentEntry = currentPlayers.find((p) => p.userId !== user.id);
    const opponentLegacyClaim = isCreator ? match.opponentResult : match.creatorResult;
    const opponentActualClaim = opponentEntry?.result || opponentLegacyClaim;

    if (opponentActualClaim) {
      return NextResponse.json({ error: "প্রতিপক্ষ ইতিমধ্যে ফলাফল জমা দিয়েছেন।" }, { status: 400 });
    }

    const winnerUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!winnerUser) return NextResponse.json({ error: "ইউজার পাওয়া যায়নি।" }, { status: 404 });

    const winnerName = myEntry?.name || `${winnerUser.firstName} ${winnerUser.lastName}`.trim() || winnerUser.phone;
    const forfeitPlayers = currentPlayers.map((p) =>
      p.userId === user.id ? { ...p, result: "WON" as const } : { ...p, result: "LOST" as const, forfeit: true }
    );

    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { winBalance: { increment: match.prize } } }),
      prisma.transaction.create({
        data: {
          userId: user.id, userName: winnerName, userPhone: winnerUser.phone,
          type: "MATCH_WIN", amount: match.prize, status: "APPROVED",
          note: `ম্যাচ #${match.matchNo} ফরফেইট জয় — প্রতিপক্ষ ১৫ মিনিটে সাড়া দেয়নি`,
        },
      }),
      prisma.match.update({
        where: { id },
        data: {
          status: "COMPLETED", winnerId: user.id, winnerName,
          players: forfeitPlayers as any,
          creatorResult: isCreator ? "WON" : "LOST",
          opponentResult: isOpponent ? "WON" : "LOST",
          adminNotes: `ফরফেইট জয়: প্রতিপক্ষ ১৫ মিনিটে সাড়া দেয়নি।`,
        },
      }),
    ]);

    await prisma.notification.create({
      data: { userId: user.id, title: `🏆 ফরফেইট বিজয়! ম্যাচ #${match.matchNo}`, message: `প্রতিপক্ষ সাড়া না দেওয়ায় আপনাকে বিজয়ী ঘোষণা করা হয়েছে। ৳${match.prize} আপনার উইনিং ব্যালেন্সে যোগ হয়েছে।`, type: "SUCCESS", link: "/wallet" },
    });

    if (opponentEntry) {
      await prisma.notification.create({
        data: { userId: opponentEntry.userId, title: `ম্যাচ #${match.matchNo} ফরফেইট পরাজয়`, message: `আপনি নির্ধারিত সময়ে ফলাফল জমা না দেওয়ায় ${winnerName} বিজয়ী ঘোষিত হয়েছেন।`, type: "INFO", link: `/matches/${match.id}` },
      });
    }

    return NextResponse.json({ success: true, completed: true, message: `🏆 ফরফেইট জয়! প্রতিপক্ষ সাড়া না দেওয়ায় আপনাকে বিজয়ী ঘোষণা করা হয়েছে। ৳${match.prize} আপনার ব্যালেন্সে যোগ হয়েছে।` });
  } catch (error) {
    console.error("Error processing forfeit claim:", error);
    return NextResponse.json({ error: "ফরফেইট প্রক্রিয়া করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}