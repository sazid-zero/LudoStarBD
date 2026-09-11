"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  LudoGameState,
  PlayerState,
  COLOR_CONFIG,
  getValidMoves,
  getSmartBotMove,
  getAbsoluteTrackIndex,
  SAFE_TRACK_STEPS,
  ludoAudio,
  PlayerColor
} from "@/lib/ludoEngine";
import { LudoBoard } from "./LudoBoard";
import { DiceRoll } from "./DiceRoll";
import Link from "next/link";
import { ArrowLeft, Volume2, VolumeX, RotateCcw, HelpCircle, Trophy, Sparkles } from "lucide-react";

interface LudoGameConsoleProps {
  initialMode?: "VS_BOT" | "PASS_N_PLAY" | "MATCH_ROOM";
  matchId?: string;
  matchPrize?: number;
  currentUserId?: string;
  creatorName?: string;
  opponentName?: string;
  onMatchWin?: (winnerId: string) => void;
  onBackHref?: string;
}

export const LudoGameConsole: React.FC<LudoGameConsoleProps> = ({
  initialMode = "VS_BOT",
  matchId,
  matchPrize = 0,
  currentUserId,
  creatorName = "আপনি (খেলোয়াড় ১)",
  opponentName = "স্মার্ট বট (AI)",
  onMatchWin,
  onBackHref = "/dashboard"
}) => {
  const [gameMode, setGameMode] = useState<"VS_BOT" | "PASS_N_PLAY" | "MATCH_ROOM">(initialMode);
  const [tokensToWin, setTokensToWin] = useState<number>(2); // 2 for quick match, 4 for full
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("খেলা শুরু করতে ডাইস রোল করুন!");
  const [showRules, setShowRules] = useState<boolean>(false);

  // Initialize Players (Player 0: Green, Player 1: Yellow)
  const initPlayers = useCallback((): PlayerState[] => {
    return [
      {
        id: 0,
        color: "green" as PlayerColor,
        name: creatorName,
        isBot: false,
        tokensHome: 0,
        tokens: [
          { id: 0, state: "BASE", step: 0 },
          { id: 1, state: "BASE", step: 0 },
          { id: 2, state: "BASE", step: 0 },
          { id: 3, state: "BASE", step: 0 }
        ]
      },
      {
        id: 1,
        color: "yellow" as PlayerColor,
        name: gameMode === "VS_BOT" ? "স্মার্ট বট (AI)" : opponentName,
        isBot: gameMode === "VS_BOT",
        tokensHome: 0,
        tokens: [
          { id: 0, state: "BASE", step: 0 },
          { id: 1, state: "BASE", step: 0 },
          { id: 2, state: "BASE", step: 0 },
          { id: 3, state: "BASE", step: 0 }
        ]
      },
      {
        id: 2,
        color: "blue" as PlayerColor,
        name: "নীল",
        isBot: true,
        tokensHome: 0,
        tokens: [
          { id: 0, state: "BASE", step: 0 },
          { id: 1, state: "BASE", step: 0 },
          { id: 2, state: "BASE", step: 0 },
          { id: 3, state: "BASE", step: 0 }
        ]
      },
      {
        id: 3,
        color: "red" as PlayerColor,
        name: "লাল",
        isBot: true,
        tokensHome: 0,
        tokens: [
          { id: 0, state: "BASE", step: 0 },
          { id: 1, state: "BASE", step: 0 },
          { id: 2, state: "BASE", step: 0 },
          { id: 3, state: "BASE", step: 0 }
        ]
      }
    ];
  }, [gameMode, creatorName, opponentName]);

  const [gameState, setGameState] = useState<LudoGameState>(() => ({
    players: initPlayers(),
    currentTurnIndex: 0,
    diceValue: null,
    hasRolled: false,
    canRoll: true,
    consecutiveSixes: 0,
    selectedTokenId: null,
    validTokenMoves: [],
    winner: null,
    moveLog: ["লুডো কনসোলে স্বাগতম! চাল দিতে ডাইস রোল করুন।"],
    gameMode: initialMode,
    isSoundEnabled: true
  }));

  const botTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Restart game
  const handleRestart = () => {
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    setGameState({
      players: initPlayers(),
      currentTurnIndex: 0,
      diceValue: null,
      hasRolled: false,
      canRoll: true,
      consecutiveSixes: 0,
      selectedTokenId: null,
      validTokenMoves: [],
      winner: null,
      moveLog: ["নতুন ম্যাচ শুরু হয়েছে! ডাইস রোল করুন।"],
      gameMode,
      isSoundEnabled: soundEnabled
    });
    setStatusMessage("খেলা শুরু করতে ডাইস রোল করুন!");
  };

  // Pass turn to next active player
  const passTurn = useCallback((reason: string) => {
    setGameState((prev) => {
      const nextIndex = (prev.currentTurnIndex + 1) % 2; // 1v1
      return {
        ...prev,
        currentTurnIndex: nextIndex,
        diceValue: null,
        hasRolled: false,
        canRoll: true,
        consecutiveSixes: 0,
        selectedTokenId: null,
        validTokenMoves: [],
        moveLog: [reason, ...prev.moveLog.slice(0, 15)]
      };
    });
    setStatusMessage("পরবর্তী খেলোয়াড়ের পালা...");
  }, []);

  // Execute Token Movement
  const handleMoveToken = useCallback(
    (tokenId: number) => {
      setGameState((prev) => {
        if (!prev.hasRolled || prev.diceValue === null || prev.winner) return prev;

        const activePlayer = prev.players[prev.currentTurnIndex];
        const dice = prev.diceValue;
        const token = activePlayer.tokens[tokenId];
        if (!token) return prev;

        let newTokensHome = activePlayer.tokensHome;
        let earnedBonusRoll = dice === 6;
        let captureMessage = "";
        let winNotice = "";

        // Update token state
        const updatedTokens = activePlayer.tokens.map((t) => {
          if (t.id !== tokenId) return t;

          if (t.state === "BASE" && dice === 6) {
            if (soundEnabled) ludoAudio.playTokenMove();
            return { ...t, state: "TRACK" as const, step: 0 };
          } else if (t.state === "TRACK") {
            const nextStep = t.step + dice;
            if (soundEnabled) ludoAudio.playTokenMove();

            if (nextStep < 51) {
              return { ...t, step: nextStep };
            } else if (nextStep < 56) {
              return { ...t, state: "CORRIDOR" as const, step: nextStep - 51 };
            } else if (nextStep === 56) {
              newTokensHome += 1;
              earnedBonusRoll = true;
              if (soundEnabled) ludoAudio.playSixFanfare();
              return { ...t, state: "HOME" as const, step: 5 };
            }
          } else if (t.state === "CORRIDOR") {
            const nextStep = t.step + dice;
            if (nextStep < 5) {
              if (soundEnabled) ludoAudio.playTokenMove();
              return { ...t, step: nextStep };
            } else if (nextStep === 5) {
              newTokensHome += 1;
              earnedBonusRoll = true;
              if (soundEnabled) ludoAudio.playSixFanfare();
              return { ...t, state: "HOME" as const, step: 5 };
            }
          }

          return t;
        });

        // Check for opponent captures (if landed on TRACK)
        const movedToken = updatedTokens.find((t) => t.id === tokenId);
        let updatedPlayers = prev.players.map((p) =>
          p.id === activePlayer.id
            ? { ...p, tokens: updatedTokens, tokensHome: newTokensHome }
            : p
        );

        if (movedToken && movedToken.state === "TRACK") {
          const myAbs = getAbsoluteTrackIndex(activePlayer.id, movedToken.step);

          if (!SAFE_TRACK_STEPS.has(myAbs)) {
            updatedPlayers = updatedPlayers.map((p) => {
              if (p.id === activePlayer.id) return p;

              let hasCaptured = false;
              const newTokens = p.tokens.map((oppToken) => {
                if (oppToken.state === "TRACK") {
                  const oppAbs = getAbsoluteTrackIndex(p.id, oppToken.step);
                  if (oppAbs === myAbs) {
                    hasCaptured = true;
                    return { ...oppToken, state: "BASE" as const, step: 0 };
                  }
                }
                return oppToken;
              });

              if (hasCaptured) {
                earnedBonusRoll = true;
                captureMessage = `⚔️ ${activePlayer.name} ${p.name} এর গুটি কেটেছে! অতিরিক্ত রোল!`;
                if (soundEnabled) ludoAudio.playCapture();
              }

              return { ...p, tokens: newTokens };
            });
          } else {
            if (soundEnabled) ludoAudio.playSafe();
          }
        }

        // Check Victory
        let winner: PlayerState | null = null;
        if (newTokensHome >= tokensToWin) {
          winner = { ...activePlayer, tokensHome: newTokensHome };
          winNotice = `🏆 অভিনন্দন! ${activePlayer.name} জয়ী হয়েছেন!`;
          if (soundEnabled) ludoAudio.playVictory();
          if (onMatchWin) onMatchWin(activePlayer.name);
        }

        let nextTurnIndex = prev.currentTurnIndex;
        let canRollAgain = earnedBonusRoll && !winner;

        if (!canRollAgain && !winner) {
          nextTurnIndex = (prev.currentTurnIndex + 1) % 2;
        }

        const logItem =
          captureMessage ||
          winNotice ||
          `${activePlayer.name} টোকেন #${tokenId + 1} চালিয়েছেন (${dice})` +
            (canRollAgain ? " (বোনাস চাল!)" : "");

        setStatusMessage(
          winner
            ? winNotice
            : canRollAgain
            ? `${activePlayer.name} আবার রোল করুন!`
            : `${updatedPlayers[nextTurnIndex].name} এর পালা`
        );

        return {
          ...prev,
          players: updatedPlayers,
          currentTurnIndex: nextTurnIndex,
          diceValue: canRollAgain ? null : prev.diceValue,
          hasRolled: false,
          canRoll: !winner,
          consecutiveSixes: dice === 6 ? prev.consecutiveSixes + 1 : 0,
          selectedTokenId: null,
          validTokenMoves: [],
          winner,
          moveLog: [logItem, ...prev.moveLog.slice(0, 15)]
        };
      });
    },
    [soundEnabled, tokensToWin, onMatchWin]
  );

  // Roll Dice Action
  const handleRollDice = useCallback(() => {
    if (gameState.hasRolled || !gameState.canRoll || gameState.winner || isRolling) return;

    setIsRolling(true);
    if (soundEnabled) ludoAudio.playDiceRoll();

    setTimeout(() => {
      const rolled = Math.floor(Math.random() * 6) + 1;
      setIsRolling(false);

      setGameState((prev) => {
        const activePlayer = prev.players[prev.currentTurnIndex];
        const validMoves = getValidMoves(activePlayer, rolled);

        // Consecutive 6s penalty
        if (rolled === 6 && prev.consecutiveSixes === 2) {
          if (soundEnabled) ludoAudio.playSafe();
          setStatusMessage("পরপর ৩ বার ৬! চাল বাতিল হয়ে পরের জনের পালা।");
          setTimeout(() => passTurn("পরপর ৩ বার ৬ পড়ায় চাল বাতিল!"), 1000);
          return {
            ...prev,
            diceValue: rolled,
            hasRolled: true,
            canRoll: false,
            validTokenMoves: []
          };
        }

        if (rolled === 6 && soundEnabled) {
          ludoAudio.playSixFanfare();
        }

        const logMsg = `${activePlayer.name} ডাইসে ${rolled} তুলেছেন!`;

        if (validMoves.length === 0) {
          setStatusMessage(`${activePlayer.name} এর চাল সম্ভব নয়।`);
          setTimeout(() => passTurn(`${activePlayer.name} এর চাল সম্ভব নয়`), 1100);
          return {
            ...prev,
            diceValue: rolled,
            hasRolled: true,
            canRoll: false,
            validTokenMoves: [],
            moveLog: [logMsg, ...prev.moveLog.slice(0, 15)]
          };
        }

        setStatusMessage(`${activePlayer.name}: চাল দিতে গুটিতে ট্যাপ করুন!`);

        return {
          ...prev,
          diceValue: rolled,
          hasRolled: true,
          canRoll: false,
          validTokenMoves: validMoves,
          moveLog: [logMsg, ...prev.moveLog.slice(0, 15)]
        };
      });
    }, 600);
  }, [gameState.hasRolled, gameState.canRoll, gameState.winner, isRolling, soundEnabled, passTurn]);

  // AI Bot Automated Turn Logic
  useEffect(() => {
    const activePlayer = gameState.players[gameState.currentTurnIndex];
    if (!activePlayer || !activePlayer.isBot || gameState.winner || isRolling) return;

    if (!gameState.hasRolled && gameState.canRoll) {
      botTimerRef.current = setTimeout(() => {
        handleRollDice();
      }, 800);
    } else if (gameState.hasRolled && gameState.validTokenMoves.length > 0) {
      botTimerRef.current = setTimeout(() => {
        const bestTokenId = getSmartBotMove(
          gameState,
          activePlayer,
          gameState.validTokenMoves
        );
        if (bestTokenId !== -1) {
          handleMoveToken(bestTokenId);
        }
      }, 900);
    }

    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
    };
  }, [
    gameState.currentTurnIndex,
    gameState.hasRolled,
    gameState.canRoll,
    gameState.validTokenMoves,
    gameState.winner,
    isRolling,
    handleRollDice,
    handleMoveToken,
    gameState
  ]);

  const p1 = gameState.players[0]; // Green (You)
  const p2 = gameState.players[1]; // Yellow (Opponent / Bot)
  const isP1Turn = gameState.currentTurnIndex === 0;
  const isP2Turn = gameState.currentTurnIndex === 1;

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center justify-between min-h-[100dvh] bg-slate-950 text-white select-none px-2.5 py-2">
      {/* 1. Sleek Top Bar (Single, Non-Overlapping Header) */}
      <header className="w-full flex items-center justify-between py-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Link
            href={onBackHref}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white active:scale-95 transition-all"
            title="ফিরে যান"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
              <span>🎲 লুডো কনসোল</span>
              <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                LIVE
              </span>
            </h1>
            <span className="text-[10px] text-slate-400">
              {gameMode === "VS_BOT" ? "বট প্র্যাকটিস" : gameMode === "PASS_N_PLAY" ? "পাস অ্যান্ড প্লে" : `ম্যাচ #${matchId}`}
            </span>
          </div>
        </div>

        {/* Quick Controls */}
        <div className="flex items-center gap-1.5">
          {/* Quick (2) / Full (4) mode toggle */}
          <button
            onClick={() => {
              setTokensToWin(tokensToWin === 2 ? 4 : 2);
              handleRestart();
            }}
            className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-extrabold text-cyan-400 hover:bg-slate-800 active:scale-95 transition-all"
            title="মোড পরিবর্তন করুন"
          >
            {tokensToWin === 2 ? "কুইক (২)" : "ফুল (৪)"}
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white active:scale-95 transition-all"
            title={soundEnabled ? "সাউন্ড বন্ধ করুন" : "সাউন্ড চালু করুন"}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
          </button>

          {/* Restart */}
          <button
            onClick={handleRestart}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white active:scale-95 transition-all"
            title="নতুন গেম শুরু করুন"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Rules Toggle */}
          <button
            onClick={() => setShowRules(!showRules)}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white active:scale-95 transition-all"
            title="নিয়মাবলী"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
          </button>
        </div>
      </header>

      {/* 2. Top Player Bar: Player 2 (Opponent / Bot) */}
      <div
        className={`w-full flex items-center justify-between p-2.5 rounded-2xl border transition-all duration-300 my-1 ${
          isP2Turn
            ? "bg-amber-950/40 border-amber-500/80 shadow-md shadow-amber-500/10"
            : "bg-slate-900/60 border-slate-800/80 opacity-85"
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shadow">
              {p2.isBot ? "🤖" : "২"}
            </div>
            {isP2Turn && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white leading-tight">
                {p2.name}
              </span>
              <span className="text-[9px] font-bold text-amber-400">
                (হলুদ)
              </span>
            </div>
            {/* Home Progress */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="flex gap-0.5">
                {Array.from({ length: tokensToWin }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full border border-amber-500/50 ${
                      i < p2.tokensHome ? "bg-amber-400" : "bg-slate-800"
                    }`}
                  />
                ))}
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {p2.tokensHome}/{tokensToWin}
              </span>
            </div>
          </div>
        </div>

        {/* Player 2 Dice / Mini Display */}
        <div className="flex items-center gap-2">
          {isP2Turn && (
            <span className="text-[10px] font-bold text-amber-300 animate-pulse hidden sm:inline">
              {p2.isBot ? "বট চালছে..." : "রোল করুন"}
            </span>
          )}
          <DiceRoll
            value={gameState.diceValue}
            isRolling={isRolling && isP2Turn}
            disabled={!isP2Turn || gameState.hasRolled || !gameState.canRoll || p2.isBot}
            playerColor="yellow"
            playerName={p2.name}
            isBot={p2.isBot}
            onRoll={handleRollDice}
          />
        </div>
      </div>

      {/* 3. Centerpiece: The 15x15 Ludo Board */}
      <div className="w-full flex flex-col items-center justify-center my-0.5 relative">
        <LudoBoard
          gameState={gameState}
          onTokenClick={handleMoveToken}
          activePlayerId={gameState.currentTurnIndex}
        />

        {/* Turn Status Pill Overlay */}
        <div
          className={`w-full max-w-[400px] mt-1.5 py-1 px-3 rounded-xl text-center text-xs font-bold border shadow transition-all ${
            isP1Turn
              ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/50"
              : "bg-amber-950/80 text-amber-300 border-amber-500/50"
          }`}
        >
          {statusMessage}
        </div>
      </div>

      {/* 4. Bottom Player Bar: Player 1 (You) */}
      <div
        className={`w-full flex items-center justify-between p-2.5 rounded-2xl border transition-all duration-300 my-1 ${
          isP1Turn
            ? "bg-emerald-950/40 border-emerald-500/80 shadow-md shadow-emerald-500/10"
            : "bg-slate-900/60 border-slate-800/80 opacity-85"
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-xs shadow">
              ১
            </div>
            {isP1Turn && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white leading-tight">
                {p1.name}
              </span>
              <span className="text-[9px] font-bold text-emerald-400">
                (সবুজ)
              </span>
            </div>
            {/* Home Progress */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="flex gap-0.5">
                {Array.from({ length: tokensToWin }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full border border-emerald-500/50 ${
                      i < p1.tokensHome ? "bg-emerald-400" : "bg-slate-800"
                    }`}
                  />
                ))}
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {p1.tokensHome}/{tokensToWin}
              </span>
            </div>
          </div>
        </div>

        {/* Player 1 (You) Big Interactive Dice */}
        <div className="flex items-center gap-2">
          {isP1Turn && (
            <span className="text-[10px] font-bold text-emerald-300 animate-pulse hidden sm:inline">
              আপনার পালা
            </span>
          )}
          <DiceRoll
            value={gameState.diceValue}
            isRolling={isRolling && isP1Turn}
            disabled={!isP1Turn || gameState.hasRolled || !gameState.canRoll}
            playerColor="green"
            playerName={p1.name}
            isBot={false}
            onRoll={handleRollDice}
          />
        </div>
      </div>

      {/* 5. Compact Bottom Footer: Latest Move Ticker */}
      <footer className="w-full flex items-center justify-between text-[11px] text-slate-400 px-1 py-1 border-t border-slate-800/80">
        <span className="truncate max-w-[280px]">
          📜 {gameState.moveLog[0] || "খেলা শুরু হয়েছে"}
        </span>
        <button
          onClick={() => setShowRules(true)}
          className="text-cyan-400 font-bold hover:underline ml-2 flex-shrink-0"
        >
          নিয়মাবলী
        </button>
      </footer>

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-[#0B152B] border border-cyan-500/30 p-5 rounded-3xl shadow-2xl shadow-cyan-950/40 space-y-3.5 text-xs text-slate-300">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                <span>💡</span> লুডো খেলার সহজ নিয়ম
              </h3>
              <button
                onClick={() => setShowRules(false)}
                className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>
            <ul className="space-y-2 text-[11px] text-slate-300 list-disc list-inside">
              <li>বেস থেকে গুটি বের করতে ডাইসে <strong>৬</strong> তুলতে হবে।</li>
              <li>ডাইসে <strong>৬</strong> তুললে বা প্রতিপক্ষের গুটি কাটলে বোনাস চাল পাবেন।</li>
              <li><strong>⭐ গোল্ডেন স্টার</strong> চিহ্নিত ঘরে গুটি নিরাপদ (কাটা যায় না)।</li>
              <li>হোমে গুটি প্রবেশ করালে অতিরিক্ত ১টি রোল সুযোগ পাবেন।</li>
              <li>প্রথমে <strong>{tokensToWin}টি গুটি</strong> হোমে পৌঁছালে ম্যাচ জয়ী হবেন!</li>
            </ul>
            <button
              onClick={() => setShowRules(false)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-xs shadow transition-all"
            >
              বুঝেছি, খেলা চালিয়ে যান
            </button>
          </div>
        </div>
      )}

      {/* Victory Modal */}
      {gameState.winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm bg-gradient-to-b from-[#0B152B] via-[#0E1B38] to-[#070D1E] border-2 border-cyan-400/80 p-6 rounded-3xl shadow-2xl shadow-cyan-500/20 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-tr from-cyan-400 to-sky-300 flex items-center justify-center text-3xl shadow-2xl animate-bounce text-slate-950">
              👑
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-cyan-400">
                বিজয়ী ঘোষিত!
              </h2>
              <p className="text-xs font-semibold text-slate-300 mt-1">
                অভিনন্দন <span className="text-cyan-400 font-bold">{gameState.winner.name}</span>! খেলায় জয়ী হয়েছেন!
              </p>
            </div>

            {matchPrize > 0 && (
              <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                  ম্যাচ উইনিং পুরস্কার
                </span>
                <span className="text-2xl font-black text-cyan-300">
                  ৳{matchPrize}
                </span>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleRestart}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-xs tracking-wide shadow-lg shadow-cyan-500/25 transition-all"
              >
                আবার খেলুন 🎮
              </button>

              <Link
                href={onBackHref}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition-all block text-center"
              >
                লবিতে ফিরে যান
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
