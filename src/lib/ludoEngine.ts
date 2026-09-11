/**
 * Ludo Game Engine & Rules
 * Implements standard international Ludo rules:
 * - 15x15 Board Grid coordinate mapping
 * - 52 track perimeter steps, 4 home corridors (5 steps each) + Home
 * - 4 Players: Green (0), Yellow (1), Blue (2), Red (3)
 * - Safe star cells: [0, 8, 13, 21, 26, 34, 39, 47]
 * - Rolling 6 releases token from base (step 0 of player) or moves 6
 * - Rolling 6 grants extra turn
 * - Capturing opponent token sends it to base & grants extra turn
 * - Reaching Home grants extra turn
 * - Built-in procedural Web Audio synthesizer (zero external sound assets)
 * - Smart AI Bot logic
 */

export type PlayerColor = "green" | "yellow" | "blue" | "red";

export interface TokenPosition {
  id: number; // 0..3 for each player
  state: "BASE" | "TRACK" | "CORRIDOR" | "HOME";
  step: number; // For TRACK: 0..50 relative to player. For CORRIDOR: 0..4.
}

export interface PlayerState {
  id: number; // 0: green, 1: yellow, 2: blue, 3: red
  color: PlayerColor;
  name: string;
  isBot: boolean;
  avatar?: string;
  tokens: TokenPosition[];
  tokensHome: number;
}

export interface LudoGameState {
  players: PlayerState[];
  currentTurnIndex: number;
  diceValue: number | null;
  hasRolled: boolean;
  canRoll: boolean;
  consecutiveSixes: number;
  selectedTokenId: number | null;
  validTokenMoves: number[]; // ids of tokens that can move
  winner: PlayerState | null;
  moveLog: string[];
  gameMode: "VS_BOT" | "PASS_N_PLAY" | "MATCH_ROOM";
  isSoundEnabled: boolean;
}

// 52 Coordinate steps of the Ludo perimeter (Row, Col) clockwise on 15x15 board
export const TRACK_COORDINATES: [number, number][] = [
  // Green side moving right (0..4)
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  // Going up towards Yellow (5..10)
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  // Top crossing (11)
  [0, 7],
  // Going down Yellow side (12..17)
  [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  // Going right into Yellow/Blue arm (18..23)
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  // Right crossing (24)
  [7, 14],
  // Going left Blue arm (25..30)
  [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  // Going down Blue side (31..36)
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  // Bottom crossing (37)
  [14, 7],
  // Going up Red side (38..43)
  [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  // Going left Red arm (44..49)
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  // Left crossing (50)
  [7, 0],
  // Corner back to Green (51)
  [6, 0]
];

// Start offsets on TRACK_COORDINATES for each player:
// 0: Green -> index 0 ([6, 1])
// 1: Yellow -> index 13 ([1, 8])
// 2: Blue -> index 26 ([8, 13])
// 3: Red -> index 39 ([13, 6])
export const PLAYER_START_OFFSETS: Record<number, number> = {
  0: 0,
  1: 13,
  2: 26,
  3: 39
};

// Safe squares on TRACK_COORDINATES:
// 4 starting squares (0, 13, 26, 39) + 4 stars (8, 21, 34, 47)
export const SAFE_TRACK_STEPS = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

// Home Corridors for each player (5 steps before Home):
export const CORRIDOR_COORDINATES: Record<number, [number, number][]> = {
  0: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]], // Green -> right
  1: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]], // Yellow -> down
  2: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]], // Blue -> left
  3: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]] // Red -> up
};

// Base pocket coordinates for 4 tokens of each player:
export const BASE_COORDINATES: Record<number, [number, number][]> = {
  0: [[2, 2], [2, 3.5], [3.5, 2], [3.5, 3.5]], // Green Top-Left
  1: [[2, 11], [2, 12.5], [3.5, 11], [3.5, 12.5]], // Yellow Top-Right
  2: [[11, 11], [11, 12.5], [12.5, 11], [12.5, 12.5]], // Blue Bottom-Right
  3: [[11, 2], [11, 3.5], [12.5, 2], [12.5, 3.5]] // Red Bottom-Left
};

// Home finish coordinates (Center triangle)
export const HOME_COORDINATES: Record<number, [number, number]> = {
  0: [7, 6.2],
  1: [6.2, 7],
  2: [7, 7.8],
  3: [7.8, 7]
};

export const COLOR_CONFIG: Record<
  PlayerColor,
  {
    nameBn: string;
    primary: string;
    glow: string;
    border: string;
    bgLight: string;
    bgDark: string;
  }
> = {
  green: {
    nameBn: "সবুজ (Green)",
    primary: "#10B981",
    glow: "rgba(16, 185, 129, 0.5)",
    border: "#059669",
    bgLight: "#34D399",
    bgDark: "#064E3B"
  },
  yellow: {
    nameBn: "হলুদ (Yellow)",
    primary: "#F59E0B",
    glow: "rgba(245, 158, 11, 0.5)",
    border: "#D97706",
    bgLight: "#FBBF24",
    bgDark: "#78350F"
  },
  blue: {
    nameBn: "নীল (Blue)",
    primary: "#06B6D4",
    glow: "rgba(6, 182, 212, 0.5)",
    border: "#0891B2",
    bgLight: "#38BDF8",
    bgDark: "#164E63"
  },
  red: {
    nameBn: "লাল (Red)",
    primary: "#EF4444",
    glow: "rgba(239, 68, 68, 0.5)",
    border: "#DC2626",
    bgLight: "#F87171",
    bgDark: "#7F1D1D"
  }
};

/**
 * Get absolute track index for a player's relative track step
 */
export function getAbsoluteTrackIndex(playerId: number, relativeStep: number): number {
  const offset = PLAYER_START_OFFSETS[playerId];
  return (offset + relativeStep) % 52;
}

/**
 * Calculate valid moves for current player given a dice roll
 */
export function getValidMoves(player: PlayerState, diceValue: number): number[] {
  const valid: number[] = [];

  player.tokens.forEach((token) => {
    if (token.state === "BASE") {
      // Need a 6 to leave the base
      if (diceValue === 6) {
        valid.push(token.id);
      }
    } else if (token.state === "TRACK") {
      const targetStep = token.step + diceValue;
      // 0..50 are on track (51 steps). Step 51..55 enter corridor (0..4). Step 56 is HOME.
      if (targetStep <= 56) {
        valid.push(token.id);
      }
    } else if (token.state === "CORRIDOR") {
      // Current corridor step is 0..4. Home is step 5.
      if (token.step + diceValue <= 5) {
        valid.push(token.id);
      }
    }
  });

  return valid;
}

/**
 * Procedural Web Audio Sound Generator
 */
class LudoAudioEngine {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  playDiceRoll() {
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Rapid series of percussive clicks
      for (let i = 0; i < 7; i++) {
        const time = now + i * 0.045;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = i % 2 === 0 ? "triangle" : "square";
        osc.frequency.setValueAtTime(200 + Math.random() * 300, time);
        osc.frequency.exponentialRampToValueAtTime(80, time + 0.03);

        gain.gain.setValueAtTime(0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + 0.04);
      }
    } catch {
      // Audio fallback
    }
  }

  playTokenMove() {
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(720, now + 0.09);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.11);
    } catch {}
  }

  playCapture() {
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Punchy hit
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {}
  }

  playSafe() {
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.2, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.22);
      });
    } catch {}
  }

  playSixFanfare() {
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      [587.33, 880].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.25, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.26);
      });
    } catch {}
  }

  playVictory() {
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880, 1108.73];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0.3, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.45);
      });
    } catch {}
  }
}

export const ludoAudio = new LudoAudioEngine();

/**
 * Smart Bot Decision Engine
 * Prioritizes:
 * 1. Capturing an opponent token
 * 2. Entering Home
 * 3. Moving a token in danger to safety
 * 4. Releasing a token from base (if rolled 6)
 * 5. Advancing the furthest or closest token strategically
 */
export function getSmartBotMove(
  gameState: LudoGameState,
  botPlayer: PlayerState,
  validMoves: number[]
): number {
  if (validMoves.length === 0) return -1;
  if (validMoves.length === 1) return validMoves[0];

  const dice = gameState.diceValue || 0;

  // 1. Check if any move captures an opponent token
  for (const tokenId of validMoves) {
    const token = botPlayer.tokens[tokenId];
    if (token.state === "BASE" && dice === 6) {
      // Releasing to start cell: does start cell have a vulnerable opponent?
      const startAbs = PLAYER_START_OFFSETS[botPlayer.id];
      const oppAtStart = getOpponentAtTrackIndex(gameState, botPlayer.id, startAbs);
      if (oppAtStart && !SAFE_TRACK_STEPS.has(startAbs)) {
        return tokenId;
      }
    } else if (token.state === "TRACK") {
      const targetStep = token.step + dice;
      if (targetStep <= 50) {
        const targetAbs = getAbsoluteTrackIndex(botPlayer.id, targetStep);
        if (!SAFE_TRACK_STEPS.has(targetAbs)) {
          const opp = getOpponentAtTrackIndex(gameState, botPlayer.id, targetAbs);
          if (opp) return tokenId;
        }
      }
    }
  }

  // 2. Check if any move reaches Home
  for (const tokenId of validMoves) {
    const token = botPlayer.tokens[tokenId];
    if (token.state === "CORRIDOR" && token.step + dice === 5) {
      return tokenId;
    }
    if (token.state === "TRACK" && token.step + dice === 56) {
      return tokenId;
    }
  }

  // 3. If rolled 6, and tokens in base, release with 75% priority to activate pieces
  if (dice === 6) {
    const baseToken = validMoves.find((id) => botPlayer.tokens[id].state === "BASE");
    if (baseToken !== undefined) {
      return baseToken;
    }
  }

  // 4. Move token into safe zone or corridor if possible
  for (const tokenId of validMoves) {
    const token = botPlayer.tokens[tokenId];
    if (token.state === "TRACK") {
      const targetStep = token.step + dice;
      if (targetStep > 50) {
        // Entering home corridor - safe from captures!
        return tokenId;
      }
      const targetAbs = getAbsoluteTrackIndex(botPlayer.id, targetStep);
      if (SAFE_TRACK_STEPS.has(targetAbs)) {
        return tokenId;
      }
    }
  }

  // 5. Default: advance the token furthest along the board to score
  let bestToken = validMoves[0];
  let maxProgress = -1;

  for (const tokenId of validMoves) {
    const token = botPlayer.tokens[tokenId];
    let progress = 0;
    if (token.state === "TRACK") progress = token.step + 10;
    else if (token.state === "CORRIDOR") progress = 60 + token.step;
    if (progress > maxProgress) {
      maxProgress = progress;
      bestToken = tokenId;
    }
  }

  return bestToken;
}

/**
 * Helper to check if any opponent token occupies an absolute track index
 */
function getOpponentAtTrackIndex(
  gameState: LudoGameState,
  myPlayerId: number,
  absIndex: number
): { playerId: number; tokenId: number } | null {
  for (const player of gameState.players) {
    if (player.id === myPlayerId) continue;
    for (const token of player.tokens) {
      if (token.state === "TRACK") {
        const tokenAbs = getAbsoluteTrackIndex(player.id, token.step);
        if (tokenAbs === absIndex) {
          return { playerId: player.id, tokenId: token.id };
        }
      }
    }
  }
  return null;
}
