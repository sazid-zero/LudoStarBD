import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { readDb } from "@/lib/db";
import fs from "fs";
import path from "path";

const GAMES_DIR = path.join(process.cwd(), ".data", "games");

function ensureGamesDir() {
  if (!fs.existsSync(GAMES_DIR)) {
    fs.mkdirSync(GAMES_DIR, { recursive: true });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = readDb();
    const match = db.matches.find((m) => m.id === id);
    if (!match) {
      return NextResponse.json({ error: "ম্যাচ পাওয়া যায়নি" }, { status: 404 });
    }

    ensureGamesDir();
    const gameFilePath = path.join(GAMES_DIR, `${id}.json`);

    let gameState = null;
    if (fs.existsSync(gameFilePath)) {
      gameState = JSON.parse(fs.readFileSync(gameFilePath, "utf-8"));
    }

    return NextResponse.json({
      match,
      gameState
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "সমস্যা হয়েছে" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "অননুমোদিত এক্সেস" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { gameState } = body;

    const db = readDb();
    const match = db.matches.find((m) => m.id === id);
    if (!match) {
      return NextResponse.json({ error: "ম্যাচ পাওয়া যায়নি" }, { status: 404 });
    }

    ensureGamesDir();
    const gameFilePath = path.join(GAMES_DIR, `${id}.json`);
    fs.writeFileSync(gameFilePath, JSON.stringify(gameState, null, 2), "utf-8");

    return NextResponse.json({ success: true, gameState });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "আপডেট ব্যর্থ" }, { status: 500 });
  }
}
