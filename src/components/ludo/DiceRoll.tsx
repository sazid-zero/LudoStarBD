"use client";

import React, { useState, useEffect } from "react";
import { COLOR_CONFIG, PlayerColor } from "@/lib/ludoEngine";

interface DiceRollProps {
  value: number | null;
  isRolling: boolean;
  disabled: boolean;
  playerColor: PlayerColor;
  playerName: string;
  isBot?: boolean;
  onRoll: () => void;
}

export const DiceRoll: React.FC<DiceRollProps> = ({
  value,
  isRolling,
  disabled,
  playerColor,
  playerName,
  isBot = false,
  onRoll
}) => {
  const [displayValue, setDisplayValue] = useState<number>(value || 1);
  const colorCfg = COLOR_CONFIG[playerColor];

  // Cycling dice numbers during rolling
  useEffect(() => {
    if (isRolling) {
      const interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 6) + 1);
      }, 70);
      return () => clearInterval(interval);
    } else if (value !== null) {
      setDisplayValue(value);
    }
  }, [isRolling, value]);

  // Render dice pips (1 to 6)
  const renderPips = (val: number) => {
    // 3x3 grid dots layout
    const pips: boolean[] = Array(9).fill(false);

    switch (val) {
      case 1:
        pips[4] = true;
        break;
      case 2:
        pips[0] = true;
        pips[8] = true;
        break;
      case 3:
        pips[0] = true;
        pips[4] = true;
        pips[8] = true;
        break;
      case 4:
        pips[0] = true;
        pips[2] = true;
        pips[6] = true;
        pips[8] = true;
        break;
      case 5:
        pips[0] = true;
        pips[2] = true;
        pips[4] = true;
        pips[6] = true;
        pips[8] = true;
        break;
      case 6:
        pips[0] = true;
        pips[2] = true;
        pips[3] = true;
        pips[5] = true;
        pips[6] = true;
        pips[8] = true;
        break;
    }

    return (
      <div className="grid grid-cols-3 grid-rows-3 gap-1.5 w-11 h-11 sm:w-14 sm:h-14 p-1.5">
        {pips.map((active, idx) => (
          <div key={idx} className="flex items-center justify-center">
            {active ? (
              <div
                className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shadow-inner"
                style={{
                  backgroundColor: val === 6 ? colorCfg.primary : "#1E293B",
                  boxShadow: val === 6 ? `0 0 6px ${colorCfg.glow}` : "inset 0 1px 2px rgba(0,0,0,0.5)"
                }}
              />
            ) : null}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      <div className="relative flex items-center justify-center">
        {/* Glow pulse when ready to roll */}
        {!disabled && !isRolling && !isBot && (
          <div
            className="absolute -inset-2 rounded-2xl animate-ping opacity-35"
            style={{ backgroundColor: colorCfg.primary }}
          />
        )}

        <button
          type="button"
          onClick={onRoll}
          disabled={disabled || isRolling || isBot}
          className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200 border-2 shadow-2xl flex items-center justify-center transition-all duration-200 transform ${
            disabled
              ? "opacity-60 cursor-not-allowed border-slate-700 bg-slate-800"
              : isRolling
              ? "animate-bounce scale-105 border-cyan-400 shadow-cyan-500/50"
              : "hover:scale-105 active:scale-95 cursor-pointer shadow-lg"
          }`}
          style={{
            borderColor: !disabled ? colorCfg.primary : "#334155",
            boxShadow: !disabled ? `0 8px 24px -4px ${colorCfg.glow}` : "none"
          }}
          title={disabled ? "অন্য খেলোয়াড়ের পালা" : isBot ? "বট চালছে..." : "ডাইস রোল করতে ক্লিক করুন"}
        >
          {/* Subtle inner 3D bevel */}
          <div className="absolute inset-1 rounded-xl bg-white/40 pointer-events-none" />

          {/* Dice face */}
          {renderPips(displayValue)}

          {/* Corner badge showing number */}
          {value !== null && !isRolling && (
            <div
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full text-xs font-black text-white flex items-center justify-center border-2 border-slate-900 shadow"
              style={{ backgroundColor: colorCfg.primary }}
            >
              {value}
            </div>
          )}
        </button>
      </div>

      <div className="text-center">
        <span
          className="text-xs font-bold tracking-wide block"
          style={{ color: colorCfg.primary }}
        >
          {isRolling ? "ঘুরছে..." : !disabled ? (isBot ? "বট রোল করছে..." : "রোল করুন!") : playerName}
        </span>
      </div>
    </div>
  );
};
