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
    const match = await prisma.match.findUnique({
      where: { id },
    });

    if (!match) {
      return NextResponse.json({ error: "ম্যাচ পাওয়া যায়নি" }, { status: 404 });
    }

    const currentUser = await getSessionUser();
    const players = (match.players as unknown as MatchPlayer[]) || [];
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
