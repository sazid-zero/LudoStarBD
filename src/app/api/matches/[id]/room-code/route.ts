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

    const players = (match.players as unknown as MatchPlayer[]) || [];

    // Check if caller is Host (Creator) or Admin
    const isHost =
      match.creatorId === user.id ||
      players.find((p) => p.isHost)?.userId === user.id ||
      user.role === "ADMIN";

    if (!isHost) {
      return NextResponse.json(
        { error: "শুধুমাত্র ম্যাচ হোস্ট (তৈরি কারী) রুম কোড দিতে পারেন।" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const rawCode = body.roomCode;

    if (!rawCode || String(rawCode).trim().length < 4) {
      return NextResponse.json(
        { error: "সঠিক Ludo King রুম কোড লিখুন (কমপক্ষে ৪-৮ ডিজিট)।" },
        { status: 400 }
      );
    }

    const cleanRoomCode = String(rawCode).trim().replace(/\s+/g, "");

    const maxPlayers = match.maxPlayers || 2;
    const currentCount = players.length || (match.opponentId ? 2 : 1);
    const isFull = currentCount >= maxPlayers;

    const updated = await prisma.match.update({
      where: { id },
      data: {
        roomCode: cleanRoomCode,
        status: isFull ? "RUNNING" : match.status,
      },
    });

    // Notify all other players in this match
    const playersToNotify = players.length > 0
      ? players.filter((p) => p.userId !== user.id)
      : match.opponentId && match.opponentId !== user.id
      ? [{ userId: match.opponentId }]
      : [];

    for (const p of playersToNotify) {
      await prisma.notification.create({
        data: {
          userId: p.userId,
          title: `🎮 ম্যাচ #${match.matchNo} রুম কোড তৈরি!`,
          message: `হোস্ট রুম কোড দিয়েছেন: ${cleanRoomCode}। এখনই Ludo King-এ জয়েন করুন।`,
          type: "SUCCESS",
          link: `/matches/${match.id}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "রুম কোড সফলভাবে সেভ করা হয়েছে এবং প্রতিপক্ষকে জানানো হয়েছে!",
      roomCode: cleanRoomCode,
      match: {
        ...updated,
        players: (updated.players as unknown as MatchPlayer[]) || [],
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error setting room code:", error);
    return NextResponse.json(
      { error: "রুম কোড সেভ করতে সমস্যা হয়েছে।" },
      { status: 500 }
    );
  }
}
