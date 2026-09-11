"use client";

import React, { useMemo } from "react";
import {
  LudoGameState,
  COLOR_CONFIG,
  TRACK_COORDINATES,
  CORRIDOR_COORDINATES,
  BASE_COORDINATES,
  HOME_COORDINATES,
  SAFE_TRACK_STEPS,
  PLAYER_START_OFFSETS,
  getAbsoluteTrackIndex
} from "@/lib/ludoEngine";

interface LudoBoardProps {
  gameState: LudoGameState;
  onTokenClick: (tokenId: number) => void;
  activePlayerId: number;
}

export const LudoBoard: React.FC<LudoBoardProps> = ({
  gameState,
  onTokenClick,
  activePlayerId
}) => {
  const { players, currentTurnIndex, validTokenMoves, hasRolled } = gameState;
  const activePlayer = players[currentTurnIndex];

  // Helper to test if a track coordinate is a safe star cell
  const isSafeCoord = (r: number, c: number): boolean => {
    return TRACK_COORDINATES.some(
      (coord, idx) => coord[0] === r && coord[1] === c && SAFE_TRACK_STEPS.has(idx)
    );
  };

  // Helper to test if a track coordinate is a start cell
  const getStartCellColor = (r: number, c: number): string | null => {
    for (let p = 0; p < 4; p++) {
      const startAbs = PLAYER_START_OFFSETS[p];
      const coord = TRACK_COORDINATES[startAbs];
      if (coord && coord[0] === r && coord[1] === c) {
        return players[p].color;
      }
    }
    return null;
  };

  // Helper to test if cell is part of corridor
  const getCorridorColor = (r: number, c: number): string | null => {
    for (let p = 0; p < 4; p++) {
      const coords = CORRIDOR_COORDINATES[p];
      if (coords && coords.some(([cr, cc]) => cr === r && cc === c)) {
        return players[p].color;
      }
    }
    return null;
  };

  // Compute all token positions on the 15x15 board
  const renderedTokens = useMemo(() => {
    const list: Array<{
      playerId: number;
      tokenId: number;
      color: string;
      row: number;
      col: number;
      isMovable: boolean;
      isSelected: boolean;
      state: string;
    }> = [];

    players.forEach((player) => {
      player.tokens.forEach((token) => {
        let r = 0;
        let c = 0;

        if (token.state === "BASE") {
          const baseCoord = BASE_COORDINATES[player.id]?.[token.id] || [0, 0];
          r = baseCoord[0];
          c = baseCoord[1];
        } else if (token.state === "TRACK") {
          const absIdx = getAbsoluteTrackIndex(player.id, token.step);
          const coord = TRACK_COORDINATES[absIdx] || [0, 0];
          r = coord[0];
          c = coord[1];
        } else if (token.state === "CORRIDOR") {
          const coord = CORRIDOR_COORDINATES[player.id]?.[token.step] || [0, 0];
          r = coord[0];
          c = coord[1];
        } else if (token.state === "HOME") {
          const coord = HOME_COORDINATES[player.id] || [7, 7];
          r = coord[0];
          c = coord[1];
        }

        const isMovable =
          player.id === activePlayerId &&
          hasRolled &&
          validTokenMoves.includes(token.id);

        list.push({
          playerId: player.id,
          tokenId: token.id,
          color: player.color,
          row: r,
          col: c,
          isMovable,
          isSelected: gameState.selectedTokenId === token.id,
          state: token.state
        });
      });
    });

    return list;
  }, [players, activePlayerId, hasRolled, validTokenMoves, gameState.selectedTokenId]);

  // Group tokens occupying the exact same cell to offset slightly
  const tokensByCell = useMemo(() => {
    const map = new Map<string, number>();
    renderedTokens.forEach((t) => {
      const key = `${t.row.toFixed(1)}_${t.col.toFixed(1)}`;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [renderedTokens]);

  const cellTokenCounters = new Map<string, number>();

  return (
    <div className="relative w-full aspect-square max-w-[420px] mx-auto bg-slate-950 p-1.5 sm:p-2.5 rounded-2xl sm:rounded-3xl border border-slate-800 shadow-2xl overflow-hidden select-none touch-manipulation">
      {/* Outer ambient glow */}
      <div
        className="absolute inset-0 rounded-2xl opacity-15 blur-xl pointer-events-none transition-colors duration-500"
        style={{ backgroundColor: COLOR_CONFIG[activePlayer.color].primary }}
      />

      {/* Main 15x15 Board Grid with explicit inline template for bulletproof rendering */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(15, minmax(0, 1fr))",
          gridTemplateRows: "repeat(15, minmax(0, 1fr))",
          width: "100%",
          height: "100%"
        }}
        className="relative bg-slate-900 rounded-xl sm:rounded-2xl overflow-hidden border border-slate-700/80 shadow-inner"
      >
        {/* 1. TOP-LEFT BASE: Green */}
        <div
          style={{ gridColumn: "1 / 7", gridRow: "1 / 7" }}
          className="p-1 sm:p-2 bg-emerald-950/70 border-r border-b border-emerald-600/50 flex items-center justify-center relative"
        >
          <div className="w-full h-full rounded-xl bg-emerald-950/90 border border-emerald-500/40 p-1 sm:p-1.5 flex flex-col items-center justify-between shadow-inner">
            <div className="flex items-center gap-1 self-start">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[8px] sm:text-[10px] font-extrabold uppercase tracking-wider text-emerald-300">
                {players[0]?.name?.split(" ")[0] || "সবুজ"}
              </span>
            </div>
            {/* 4 Token Pockets */}
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2.5 p-0.5 sm:p-1">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className="w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-emerald-900/80 border border-emerald-400/50 shadow-inner flex items-center justify-center"
                />
              ))}
            </div>
            <span className="text-[7px] sm:text-[8px] text-emerald-400/60 font-mono">BASE</span>
          </div>
        </div>

        {/* 2. TOP-RIGHT BASE: Yellow */}
        <div
          style={{ gridColumn: "10 / 16", gridRow: "1 / 7" }}
          className="p-1 sm:p-2 bg-amber-950/70 border-l border-b border-amber-600/50 flex items-center justify-center relative"
        >
          <div className="w-full h-full rounded-xl bg-amber-950/90 border border-amber-500/40 p-1 sm:p-1.5 flex flex-col items-center justify-between shadow-inner">
            <div className="flex items-center gap-1 self-start">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[8px] sm:text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
                {players[1]?.name?.split(" ")[0] || "হলুদ"}
              </span>
            </div>
            {/* 4 Token Pockets */}
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2.5 p-0.5 sm:p-1">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className="w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-amber-900/80 border border-amber-400/50 shadow-inner flex items-center justify-center"
                />
              ))}
            </div>
            <span className="text-[7px] sm:text-[8px] text-amber-400/60 font-mono">BASE</span>
          </div>
        </div>

        {/* 3. BOTTOM-RIGHT BASE: Blue */}
        <div
          style={{ gridColumn: "10 / 16", gridRow: "10 / 16" }}
          className="p-1 sm:p-2 bg-cyan-950/70 border-l border-t border-cyan-600/50 flex items-center justify-center relative"
        >
          <div className="w-full h-full rounded-xl bg-cyan-950/90 border border-cyan-500/40 p-1 sm:p-1.5 flex flex-col items-center justify-between shadow-inner">
            <div className="flex items-center gap-1 self-start">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[8px] sm:text-[10px] font-extrabold uppercase tracking-wider text-cyan-300">
                {players[2]?.name?.split(" ")[0] || "নীল"}
              </span>
            </div>
            {/* 4 Token Pockets */}
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2.5 p-0.5 sm:p-1">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className="w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-cyan-900/80 border border-cyan-400/50 shadow-inner flex items-center justify-center"
                />
              ))}
            </div>
            <span className="text-[7px] sm:text-[8px] text-cyan-400/60 font-mono">BASE</span>
          </div>
        </div>

        {/* 4. BOTTOM-LEFT BASE: Red */}
        <div
          style={{ gridColumn: "1 / 7", gridRow: "10 / 16" }}
          className="p-1 sm:p-2 bg-red-950/70 border-r border-t border-red-600/50 flex items-center justify-center relative"
        >
          <div className="w-full h-full rounded-xl bg-red-950/90 border border-red-500/40 p-1 sm:p-1.5 flex flex-col items-center justify-between shadow-inner">
            <div className="flex items-center gap-1 self-start">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-400 animate-pulse" />
              <span className="text-[8px] sm:text-[10px] font-extrabold uppercase tracking-wider text-red-300">
                {players[3]?.name?.split(" ")[0] || "লাল"}
              </span>
            </div>
            {/* 4 Token Pockets */}
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2.5 p-0.5 sm:p-1">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className="w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-red-900/80 border border-red-400/50 shadow-inner flex items-center justify-center"
                />
              ))}
            </div>
            <span className="text-[7px] sm:text-[8px] text-red-400/60 font-mono">BASE</span>
          </div>
        </div>

        {/* 5. CENTER HOME FINISH (3x3: Rows 7-9, Cols 7-9) */}
        <div
          style={{ gridColumn: "7 / 10", gridRow: "7 / 10" }}
          className="bg-slate-950 border border-slate-700/80 relative overflow-hidden flex items-center justify-center"
        >
          {/* Green Left Triangle */}
          <div
            className="absolute inset-0 bg-emerald-600/80"
            style={{ clipPath: "polygon(0 0, 50% 50%, 0 100%)" }}
          />
          {/* Yellow Top Triangle */}
          <div
            className="absolute inset-0 bg-amber-500/80"
            style={{ clipPath: "polygon(0 0, 100% 0, 50% 50%)" }}
          />
          {/* Blue Right Triangle */}
          <div
            className="absolute inset-0 bg-cyan-600/80"
            style={{ clipPath: "polygon(100% 0, 100% 100%, 50% 50%)" }}
          />
          {/* Red Bottom Triangle */}
          <div
            className="absolute inset-0 bg-red-600/80"
            style={{ clipPath: "polygon(0 100%, 50% 50%, 100% 100%)" }}
          />
          {/* Center Crown */}
          <div className="relative z-10 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-950/90 border border-amber-400/70 flex items-center justify-center shadow-lg text-[10px] sm:text-xs font-black">
            👑
          </div>
        </div>

        {/* 6. TRACK AND CORRIDOR SQUARES */}
        {Array.from({ length: 15 }).map((_, r) =>
          Array.from({ length: 15 }).map((_, c) => {
            // Skip the 4 bases and center home
            const isBaseTL = r < 6 && c < 6;
            const isBaseTR = r < 6 && c >= 9;
            const isBaseBR = r >= 9 && c >= 9;
            const isBaseBL = r >= 9 && c < 6;
            const isCenter = r >= 6 && r <= 8 && c >= 6 && c <= 8;

            if (isBaseTL || isBaseTR || isBaseBR || isBaseBL || isCenter) {
              return null;
            }

            const isSafe = isSafeCoord(r, c);
            const startColor = getStartCellColor(r, c);
            const corridorColor = getCorridorColor(r, c);

            // Determine cell styling
            let cellBg = "bg-slate-900/90";
            let borderStyle = "border-slate-800/80";

            if (corridorColor) {
              if (corridorColor === "green") cellBg = "bg-emerald-600/60 border-emerald-500/40";
              else if (corridorColor === "yellow") cellBg = "bg-amber-500/60 border-amber-400/40";
              else if (corridorColor === "blue") cellBg = "bg-cyan-600/60 border-cyan-500/40";
              else if (corridorColor === "red") cellBg = "bg-red-600/60 border-red-500/40";
            } else if (startColor) {
              if (startColor === "green") cellBg = "bg-emerald-600/75 border-emerald-400";
              else if (startColor === "yellow") cellBg = "bg-amber-500/75 border-amber-400";
              else if (startColor === "blue") cellBg = "bg-cyan-600/75 border-cyan-400";
              else if (startColor === "red") cellBg = "bg-red-600/75 border-red-400";
            } else if (isSafe) {
              cellBg = "bg-slate-800 border-amber-500/30";
            }

            return (
              <div
                key={`cell_${r}_${c}`}
                style={{
                  gridRowStart: r + 1,
                  gridColumnStart: c + 1
                }}
                className={`relative flex items-center justify-center border text-[8px] select-none ${cellBg} ${borderStyle} transition-colors`}
              >
                {/* Safe Star Icon */}
                {isSafe && (
                  <span className="text-amber-400 drop-shadow text-[9px] sm:text-xs">
                    ⭐
                  </span>
                )}
                {/* Start Arrow or Dot */}
                {startColor && !isSafe && (
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white/80 shadow-sm" />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 7. TOKENS OVERLAY LAYER (Exact percentage coordinates) */}
      <div className="absolute inset-1.5 sm:inset-2.5 pointer-events-none">
        {renderedTokens.map((t) => {
          const key = `${t.row.toFixed(1)}_${t.col.toFixed(1)}`;
          const totalInCell = tokensByCell.get(key) || 1;
          const currentIdx = cellTokenCounters.get(key) || 0;
          cellTokenCounters.set(key, currentIdx + 1);

          // Subtle offset if multiple tokens share the exact cell
          const offset =
            totalInCell > 1
              ? (currentIdx - (totalInCell - 1) / 2) * 4
              : 0;

          // Compute percentage coordinates
          const leftPercent = ((t.col + 0.5) / 15) * 100;
          const topPercent = ((t.row + 0.5) / 15) * 100;

          const colorConfig = COLOR_CONFIG[t.color as keyof typeof COLOR_CONFIG] || COLOR_CONFIG.green;

          return (
            <div
              key={`token_${t.playerId}_${t.tokenId}`}
              onClick={(e) => {
                e.stopPropagation();
                if (t.isMovable) {
                  onTokenClick(t.tokenId);
                }
              }}
              style={{
                left: `calc(${leftPercent}% + ${offset}px)`,
                top: `calc(${topPercent}% + ${offset}px)`,
                transform: "translate(-50%, -50%)",
                transition: "left 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), top 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)"
              }}
              className={`absolute pointer-events-auto cursor-pointer p-1 -m-1 ${
                t.isMovable ? "z-30" : "z-20"
              }`}
            >
              {/* Token Pulsing Ring when movable */}
              {t.isMovable && (
                <div
                  className="absolute inset-0 rounded-full animate-ping opacity-80"
                  style={{ backgroundColor: colorConfig.primary }}
                />
              )}

              {/* 3D Circular Token Body */}
              <div
                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center border-2 shadow-lg transition-transform duration-150 ${
                  t.isMovable
                    ? "scale-110 ring-2 ring-white hover:scale-125 animate-bounce shadow-xl cursor-pointer"
                    : "hover:scale-105"
                }`}
                style={{
                  backgroundColor: colorConfig.primary,
                  borderColor: "#FFFFFF",
                  boxShadow: t.isMovable
                    ? `0 0 10px ${colorConfig.glow}, 0 2px 5px rgba(0,0,0,0.6)`
                    : "0 2px 4px rgba(0,0,0,0.5)"
                }}
                title={
                  t.isMovable
                    ? "চালতে ট্যাপ করুন!"
                    : `${players[t.playerId]?.name} এর টোকেন #${t.tokenId + 1}`
                }
              >
                {/* Inner metallic dot */}
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white/95 flex items-center justify-center shadow-inner">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: colorConfig.bgDark }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
