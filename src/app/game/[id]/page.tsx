"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { LudoGameConsole } from "@/components/ludo/LudoGameConsole";
import { useUser } from "@/components/common/UserContext";
import { useToast } from "@/components/common/ToastContext";
import { Match } from "@/lib/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function MatchGamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user, refreshUser } = useUser();
  const { showToast } = useToast();

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMatch() {
      try {
        const res = await fetch(`/api/matches/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "ম্যাচ লোড ব্যর্থ");

        if (!data.isParticipant) {
          showToast("রুম কোড ও গেমপ্লে দেখতে প্রথমে ডিপোজিট/প্রবেশ ফি দিয়ে ম্যাচে জয়েন করুন।", "error");
          router.replace(`/matches/${id}`);
          return;
        }

        setMatch(data.match);
      } catch (err: any) {
        showToast(err.message || "সমস্যা হয়েছে", "error");
      } finally {
        setLoading(false);
      }
    }
    loadMatch();
  }, [id, router, showToast]);

  const handleMatchWin = async (winnerName: string) => {
    showToast(`অভিনন্দন! ${winnerName} জয়লাভ করেছেন!`, "success");
    try {
      const res = await fetch(`/api/matches/${id}/result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          result: "WON",
          proofUrl: null,
          disputeReason: "Won via Browser Ludo Console"
        })
      });
      if (res.ok) {
        showToast("ম্যাচ জয় রেকর্ড হয়েছে এবং প্রাইজ ব্যালেন্স আপডেট হয়েছে!", "success");
        if (refreshUser) await refreshUser();
      }
    } catch {
      // Non-critical
    }
  };

  if (loading) {
    return (
      <main className="min-h-[100dvh] bg-slate-950 flex flex-col items-center justify-center p-4 max-w-md mx-auto">
        <div className="w-full space-y-4">
          <div className="h-16 bg-slate-900 rounded-2xl animate-pulse" />
          <div className="aspect-square bg-slate-900 rounded-3xl animate-pulse" />
          <div className="h-16 bg-slate-900 rounded-2xl animate-pulse" />
        </div>
      </main>
    );
  }

  if (!match) {
    return (
      <main className="min-h-[100dvh] bg-slate-950 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-3">
        <p className="text-slate-400 text-sm">ম্যাচটি খুঁজে পাওয়া যায়নি।</p>
        <Link
          href="/matches"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          ম্যাচ লবিতে ফিরে যান
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-slate-950 flex flex-col justify-between max-w-md mx-auto relative shadow-2xl overflow-x-hidden">
      <LudoGameConsole
        initialMode="MATCH_ROOM"
        matchId={match.id}
        matchPrize={match.prize}
        currentUserId={user?.id}
        creatorName={match.creatorName || "খেলোয়াড় ১"}
        opponentName={match.opponentName || "খেলোয়াড় ২"}
        onMatchWin={handleMatchWin}
        onBackHref={`/matches/${match.id}`}
      />
    </main>
  );
}
