"use client";

import React, { useState } from "react";
import { LudoGameConsole } from "@/components/ludo/LudoGameConsole";
import { Bot, Users } from "lucide-react";

export default function PlayPage() {
  const [activeTab, setActiveTab] = useState<"VS_BOT" | "PASS_N_PLAY">("VS_BOT");

  return (
    <main className="min-h-[100dvh] bg-slate-950 flex flex-col justify-between max-w-md mx-auto relative shadow-2xl overflow-x-hidden">
      {/* Mode Switcher Pill at Top */}
      <div className="pt-2 px-3 flex items-center justify-between gap-2 bg-slate-950/90 border-b border-slate-900">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
          মোড বেছে নিন:
        </span>
        <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
          <button
            onClick={() => setActiveTab("VS_BOT")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              activeTab === "VS_BOT"
                ? "bg-amber-500 text-slate-950 shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>বট এআই</span>
          </button>

          <button
            onClick={() => setActiveTab("PASS_N_PLAY")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              activeTab === "PASS_N_PLAY"
                ? "bg-emerald-500 text-slate-950 shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>পাস অ্যান্ড প্লে</span>
          </button>
        </div>
      </div>

      {/* The Mobile-First Interactive Game Console */}
      <div className="flex-1 flex flex-col">
        <LudoGameConsole
          key={activeTab}
          initialMode={activeTab}
          creatorName="আপনি (খেলোয়াড় ১)"
          opponentName={activeTab === "VS_BOT" ? "স্মার্ট রোবট (AI)" : "বন্ধু (খেলোয়াড় ২)"}
          onBackHref="/dashboard"
        />
      </div>
    </main>
  );
}
