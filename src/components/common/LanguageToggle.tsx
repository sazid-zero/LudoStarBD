"use client";

import React from "react";
import { useLanguage } from "./LanguageContext";
import { Globe } from "lucide-react";

export default function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, toggleLang } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleLang}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide transition-all border shadow-sm flex-shrink-0 ${
        lang === "bn"
          ? "bg-slate-900/95 text-emerald-400 border-emerald-500/40 hover:border-emerald-300 hover:bg-slate-800"
          : "bg-slate-900/95 text-cyan-300 border-cyan-500/40 hover:border-cyan-300 hover:bg-slate-800"
      } ${className}`}
      title={lang === "bn" ? "Switch to English" : "বাংলায় পরিবর্তন করুন"}
    >
      <Globe className="w-3 h-3 text-cyan-400 flex-shrink-0" />
      <span>{lang === "bn" ? "বাং" : "EN"}</span>
    </button>
  );
}
