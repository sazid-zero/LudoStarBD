import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const match = db.findMatchById(id);

    if (!match) {
      return NextResponse.json({ error: "ম্যাচ পাওয়া যায়নি" }, { status: 404 });
    }

    const currentUser = await getSessionUser();
    const isParticipant =
      currentUser &&
      (match.creatorId === currentUser.id || match.opponentId === currentUser.id);
    const isAdmin = currentUser && currentUser.role === "ADMIN";

    // Without depositing/paying entry fee and joining, room code is strictly hidden!
    const sanitizedMatch = {
      ...match,
      roomCode: isParticipant || isAdmin ? match.roomCode : null,
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
