"use client";

import React, { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { useUser } from "@/components/common/UserContext";
import { useToast } from "@/components/common/ToastContext";
import { useLanguage } from "@/components/common/LanguageContext";
import DepositModal from "@/components/wallet/DepositModal";
import JoinMatchModal from "@/components/matches/JoinMatchModal";
import { Match, MatchPlayer } from "@/lib/types";
import {
  Copy,
  Check,
  Trophy,
  Swords,
  Users,
  AlertTriangle,
  UploadCloud,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  ShieldAlert,
  Lock,
  ArrowDownCircle,
  Share2,
  MessageCircle,
  Send,
  KeyRound,
  Sparkles,
  Trash2,
} from "lucide-react";

export default function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user, refreshUser } = useUser();
  const { showToast } = useToast();
  const { lang, t } = useLanguage();

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);

  // Host room code input state
  const [hostRoomCode, setHostRoomCode] = useState("");
  const [submittingCode, setSubmittingCode] = useState(false);

  // Result submission states
  const [selectedResult, setSelectedResult] = useState<"WON" | "LOST" | "DISPUTE">("WON");
  const [disputeReason, setDisputeReason] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [cancellingMatch, setCancellingMatch] = useState(false);

  const fetchMatch = async () => {
    try {
      const res = await fetch(`/api/matches/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ম্যাচ লোড ব্যর্থ");
      setMatch(data.match);
    } catch (err: any) {
      showToast(err.message || "সমস্যা হয়েছে", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatch();
    const timer = setInterval(() => {
      fetchMatch();
    }, 3500);
    return () => clearInterval(timer);
  }, [id]);

  const handleCopyRoomCode = () => {
    if (!match?.roomCode) return;
    navigator.clipboard.writeText(match.roomCode);
    setCopied(true);
    showToast("রুম কোড কপি করা হয়েছে! Ludo King-এ পেস্ট করুন।", "info");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyShareLink = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    showToast("ম্যাচ ইনভাইট লিংক কপি করা হয়েছে!", "success");
    setTimeout(() => setLinkCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    if (typeof window === "undefined" || !match) return;
    const shareUrl = window.location.href;
    const text = `🎲 আমি Ludo King-এ ৳${match.entryFee} বাজি ধরে একটি ম্যাচ তৈরি করেছি! জিতলে পুরস্কার ৳${match.prize}!\n\nআমার সাথে খেলতে এখনই জয়েন করো:\n${shareUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleShareTelegram = () => {
    if (typeof window === "undefined" || !match) return;
    const shareUrl = window.location.href;
    const text = `🎲 Ludo King ৳${match.entryFee} ম্যাচ! জয়ী পুরস্কার ৳${match.prize}! খেলতে জয়েন করো:`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`, "_blank");
  };

  // Host submits room code
  const handleHostSubmitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostRoomCode || hostRoomCode.trim().length < 4) {
      showToast("সঠিক ৪-৮ ডিজিটের Ludo King রুম কোড লিখুন", "error");
      return;
    }

    setSubmittingCode(true);
    try {
      const res = await fetch(`/api/matches/${id}/room-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode: hostRoomCode.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "রুম কোড সেভ করা সম্ভব হয়নি");
      }

      showToast(data.message || "রুম কোড সফলভাবে যোগ করা হয়েছে!", "success");
      setHostRoomCode("");
      await fetchMatch();
    } catch (err: any) {
      showToast(err.message || "সমস্যা হয়েছে", "error");
    } finally {
      setSubmittingCode(false);
    }
  };

  // Host cancels the match (WAITING only)
  const handleCancelMatch = async () => {
    if (!confirm("সত্যিই এই ম্যাচ বাতিল করতে চান? সকল খেলোয়াড়ের এন্ট্রি ফি রিফান্ড হবে।")) return;
    setCancellingMatch(true);
    try {
      const res = await fetch(`/api/matches/${id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ম্যাচ বাতিল করা সম্ভব হয়নি");
      showToast(data.message || "ম্যাচ বাতিল হয়েছে! ব্যালেন্স রিফান্ড হয়েছে।", "success");
      await refreshUser();
      router.push("/play");
    } catch (err: any) {
      showToast(err.message || "সমস্যা হয়েছে", "error");
    } finally {
      setCancellingMatch(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreviewUrl(URL.createObjectURL(f));
    }
  };

  const handleSubmitResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast("অননুমোদিত এক্সেস। লগইন করুন।", "error");
      return;
    }

    if (selectedResult === "WON" && !file && !match?.creatorProofUrl && !match?.opponentProofUrl) {
      showToast("জয়ের প্রমাণ হিসেবে অবশ্যই স্ক্রিনশট আপলোড করতে হবে", "error");
      return;
    }

    setSubmitting(true);
    try {
      let uploadedProofUrl: string | null = null;

      // 1. Upload proof to Cloudinary / storage if file selected
      if (file) {
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || "ছবি আপলোড ব্যর্থ হয়েছে");
        }
        uploadedProofUrl = uploadData.url;
      }

      // 2. Submit match result
      const res = await fetch(`/api/matches/${id}/result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          result: selectedResult,
          proofUrl: uploadedProofUrl,
          disputeReason: selectedResult === "DISPUTE" ? disputeReason : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "ফলাফল জমা দিতে সমস্যা হয়েছে");
      }

      showToast(data.message || "ফলাফল জমা দেওয়া হয়েছে!", "success");
      await refreshUser();
      await fetchMatch();
    } catch (err: any) {
      showToast(err.message || "সমস্যা হয়েছে", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppShell title="ম্যাচ বিবরণ" showBack>
        <div className="p-4 space-y-4">
          <div className="h-40 bg-slate-900/60 rounded-2xl animate-pulse" />
          <div className="h-48 bg-slate-900/60 rounded-2xl animate-pulse" />
        </div>
      </AppShell>
    );
  }

  if (!match) {
    return (
      <AppShell title="ম্যাচ পাওয়া যায়নি" showBack>
        <div className="p-8 text-center text-slate-400">
          <p className="text-sm">ম্যাচটি খুঁজে পাওয়া যায়নি।</p>
        </div>
      </AppShell>
    );
  }

  const maxPlayers = match.maxPlayers || 2;

  // Build unified players list
  let currentPlayers: MatchPlayer[] = match.players ? [...match.players] : [];
  if (currentPlayers.length === 0) {
    if (match.creatorId) {
      currentPlayers.push({
        userId: match.creatorId,
        name: match.creatorName || "খেলোয়াড় ১",
        phone: match.creatorPhone || "",
        slot: 1,
        isHost: true,
        joinedAt: match.createdAt,
      });
    }
    if (match.opponentId) {
      currentPlayers.push({
        userId: match.opponentId,
        name: match.opponentName || "খেলোয়াড় ২",
        phone: match.opponentPhone || "",
        slot: 2,
        isHost: false,
        joinedAt: match.updatedAt,
      });
    }
  }

  const isCreator = user?.id === match.creatorId;
  const isHost = isCreator || currentPlayers.find((p) => p.isHost)?.userId === user?.id;
  const isParticipant =
    isCreator ||
    user?.id === match.opponentId ||
    currentPlayers.some((p) => p.userId === user?.id);

  const myResult = isCreator ? match.creatorResult : user?.id === match.opponentId ? match.opponentResult : null;
  const myProof = isCreator ? match.creatorProofUrl : user?.id === match.opponentId ? match.opponentProofUrl : null;

  return (
    <AppShell title={`ম্যাচ #${match.matchNo}`} showBack>
      <div className="p-3.5 space-y-4">
        {/* Match Header Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-850 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>১ বনাম ১ (1v1) • Ludo King</span>
            </span>

            {match.status === "WAITING" && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                অপেক্ষমাণ ({currentPlayers.length}/{maxPlayers})
              </span>
            )}
            {match.status === "RUNNING" && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                চলমান
              </span>
            )}
            {match.status === "COMPLETED" && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                সমাপ্ত
              </span>
            )}
            {match.status === "DISPUTED" && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                বিরোধাধীন (Admin Review)
              </span>
            )}
          </div>

          <h2 className="text-lg font-black text-white mb-3">
            {match.title}
          </h2>

          {/* Prize and Entry Bar */}
          <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950/80 rounded-xl border border-slate-800 mb-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                প্রবেশ ফি
              </span>
              <span className="text-lg font-extrabold text-amber-400 font-mono">
                ৳ {match.entryFee}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                বিজয়ী পুরস্কার
              </span>
              <span className="text-lg font-extrabold text-emerald-400 font-mono">
                ৳ {match.prize}
              </span>
            </div>
          </div>

          {/* Dynamic Multi-Player Slots Grid */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              খেলোয়াড় তালিকা ({currentPlayers.length}/{maxPlayers}):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Array.from({ length: maxPlayers }).map((_, idx) => {
                const slotNum = idx + 1;
                const player = currentPlayers.find((p) => p.slot === slotNum);
                const isMe = player && user?.id === player.userId;

                return (
                  <div
                    key={slotNum}
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                      player
                        ? isMe
                          ? "bg-amber-500/10 border-amber-500/30"
                          : "bg-slate-950/60 border-slate-800"
                        : "bg-slate-950/30 border-dashed border-slate-800/80 opacity-70"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                          slotNum === 1
                            ? "bg-amber-500 text-slate-950"
                            : slotNum === 2
                            ? "bg-cyan-500 text-slate-950"
                            : slotNum === 3
                            ? "bg-emerald-500 text-slate-950"
                            : "bg-purple-500 text-white"
                        }`}
                      >
                        {slotNum}
                      </div>
                      <div>
                        <span className="font-bold text-white block text-xs">
                          {player ? player.name : `স্লট ${slotNum} (খালি)`}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {player
                            ? player.isHost
                              ? "হোস্ট (Host)"
                              : isMe
                              ? "(আপনি)"
                              : `খেলোয়াড় ${slotNum}`
                            : "অপেক্ষা করছে..."}
                        </span>
                      </div>
                    </div>

                    {player ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">
                        যুক্ত
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px]">
                        খালি
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 1-Click Social Invitations Suite */}
        {match.status === "WAITING" && currentPlayers.length < maxPlayers && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5" />
                <span>বন্ধুদের ইনভাইট করুন (১-ক্লিক শেয়ার)</span>
              </span>
              <span className="text-[10px] text-slate-400">
                আর {maxPlayers - currentPlayers.length} জন বাকি
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="py-2.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-98"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleShareTelegram}
                className="py-2.5 px-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-98"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Telegram</span>
              </button>

              <button
                type="button"
                onClick={handleCopyShareLink}
                className="py-2.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-all active:scale-98"
              >
                {linkCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{linkCopied ? "কপি হয়েছে" : "লিংক কপি"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Host Cancel Match (WAITING only, before room is full) */}
        {isHost && match.status === "WAITING" && (
          <div className="p-3 rounded-2xl bg-red-500/5 border border-red-500/20 flex items-center justify-between gap-3">
            <div className="text-xs text-slate-400 flex items-start gap-2">
              <Trash2 className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>
                <span className="text-red-300 font-semibold block">ম্যাচ বাতিল করুন</span>
                সকল খেলোয়াড়ের এন্ট্রি ফি রিফান্ড হবে
              </span>
            </div>
            <button
              type="button"
              onClick={handleCancelMatch}
              disabled={cancellingMatch}
              className="flex-shrink-0 px-3 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 font-bold text-xs transition-all active:scale-98 disabled:opacity-50"
            >
              {cancellingMatch ? "বাতিল..." : "বাতিল করুন"}
            </button>
          </div>
        )}

        {/* Host Room Code Input Card (if user is Host and room code is not yet provided) */}
        {isHost && !match.roomCode && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-slate-900 to-slate-950 border border-amber-500/35 space-y-3 shadow-xl">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <KeyRound className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-black text-white">
                  👑 আপনি এই ম্যাচের হোস্ট!
                </h3>
                <span className="text-[11px] text-amber-300 font-semibold block">
                  Ludo King-এর রুম কোড দিয়ে খেলা শুরু করুন
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Ludo King অ্যাপে <strong>Play with Friends</strong> {">"} <strong>Create Room</strong> চেপে পাওয়া ৮ ডিজিটের কোডটি এখানে পেস্ট করুন:
            </p>

            <form onSubmit={handleHostSubmitCode} className="space-y-2.5">
              <input
                type="text"
                value={hostRoomCode}
                onChange={(e) => setHostRoomCode(e.target.value.replace(/\s+/g, ""))}
                placeholder="যেমন: 04821943"
                className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-4 py-3 text-base text-white focus:outline-none focus:border-amber-400 font-mono tracking-widest text-center font-bold"
                required
              />

              <button
                type="submit"
                disabled={submittingCode}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{submittingCode ? "সংরক্ষণ হচ্ছে..." : "রুম কোড সাবমিট করুন (অটো সবার কাছে যাবে)"}</span>
              </button>
            </form>
          </div>
        )}

        {/* Room Code Showcase - Only for Joined Participants! */}
        {!isParticipant ? (
          <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-500/15 via-[#0c1630] to-[#060b18] border border-cyan-500/35 text-center shadow-[0_0_30px_rgba(0,229,255,0.12)] space-y-3.5">
            <div className="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 mx-auto flex items-center justify-center text-xl shadow-[0_0_15px_rgba(0,229,255,0.25)]">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-sm font-black text-white">
                {lang === "en" ? "Room Code is Locked" : "রুম কোড লক করা রয়েছে"}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                {lang === "en"
                  ? `Pay the entry fee (৳${match.entryFee}) to join the match and view the room code.`
                  : `রুম কোড দেখতে এবং খেলায় অংশ নিতে প্রবেশ ফি (৳${match.entryFee}) দিয়ে ম্যাচে জয়েন করুন।`}
              </p>
            </div>

            {!user ? (
              <Link
                href={`/login?redirect=/matches/${match.id}`}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-xs shadow-[0_0_15px_rgba(0,229,255,0.3)] active:scale-98 transition-all block text-center"
              >
                {lang === "en" ? "Login to Join Match" : "লগইন করে ম্যাচে জয়েন করুন"}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setJoinModalOpen(true)}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <Swords className="w-4 h-4" />
                <span>
                  {lang === "en"
                    ? `Join Match (Fee: ৳${match.entryFee})`
                    : `ম্যাচে জয়েন করুন (ফি: ৳${match.entryFee})`}
                </span>
              </button>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/15 via-[#0c1630] to-[#060b18] border border-cyan-500/35 text-center shadow-[0_0_30px_rgba(0,229,255,0.12)]">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block mb-1">
              {lang === "en" ? "Ludo King Room Code" : "Ludo King রুম কোড"}
            </span>

            {match.roomCode ? (
              <div className="mt-2 space-y-3">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-3xl font-black text-cyan-200 font-mono tracking-widest bg-[#040814] px-5 py-2.5 rounded-xl border border-cyan-500/40 select-all shadow-[inset_0_0_15px_rgba(0,229,255,0.2)]">
                    {match.roomCode}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyRoomCode}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-sm shadow-[0_0_15px_rgba(0,229,255,0.3)] active:scale-98 transition-all"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? (lang === "en" ? "Room code copied!" : "রুম কোড কপি হয়েছে!") : (lang === "en" ? "Copy Room Code" : "রুম কোড কপি করুন")}</span>
                </button>

                <Link
                  href={`/game/${match.id}`}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-[0_0_15px_rgba(0,245,160,0.3)] active:scale-98 transition-all"
                >
                  <span>{lang === "en" ? "🎮 Play in Browser (Live Web Console)" : "🎮 ব্রাউজারে সরাসরি খেলুন (Live Web Console)"}</span>
                </Link>
              </div>
            ) : (
              <div className="py-5 px-3 text-center space-y-3 bg-[#081126] rounded-xl border border-sky-500/20">
                <div className="w-12 h-12 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center animate-pulse">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-300">
                    {isHost ? "রুম কোড প্রদান করুন" : "হোস্ট প্লেয়ারের কোডের জন্য অপেক্ষা করুন"}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto leading-relaxed">
                    {isHost
                      ? "উপরে রুম কোড ইনপুট ফর্মে Ludo King কোড দিয়ে সাবমিট করুন।"
                      : "হোস্ট প্লেয়ার Ludo King রুম কোড দিলে সাথে সাথে এখানে দেখতে পাবেন।"}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>রুম কোডের জন্য অটো চেক হচ্ছে...</span>
                </div>
              </div>
            )}

            {/* Quick instructions */}
            <div className="mt-3.5 pt-3 border-t border-sky-500/20 text-left text-[11px] text-slate-300 space-y-1.5">
              <div className="flex items-start gap-1.5">
                <span className="text-cyan-400 font-bold">1.</span>
                <span>Ludo King অ্যাপে ঢুকে <strong>Play with Friends</strong> এ ক্লিক করুন।</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-cyan-400 font-bold">2.</span>
                <span><strong>Join</strong> ট্যাবে গিয়ে উপরের রুম কোডটি পেস্ট করে ম্যাচে প্রবেশ করুন।</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-cyan-400 font-bold">3.</span>
                <span>খেলা শেষ হলে উইন স্ক্রিনশট নিয়ে নিচে আপলোড করুন।</span>
              </div>
            </div>
          </div>
        )}

        {/* Winner Announcement if Completed */}
        {match.status === "COMPLETED" && (
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-center">
            <Trophy className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <h3 className="text-base font-bold text-white">ম্যাচ সমাপ্ত!</h3>
            <p className="text-xs text-emerald-300 mt-1">
              বিজয়ী: <strong>{match.winnerName}</strong> (পুরস্কার ৳{match.prize} ব্যালেন্সে যোগ হয়েছে)
            </p>
          </div>
        )}

        {/* Result Submission Section (Only for participants when RUNNING or DISPUTED) */}
        {isParticipant && match.status !== "COMPLETED" && (
          <div className="p-4 rounded-2xl bg-[#0e1428] border border-[#212b48] shadow-xl">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>খেলার ফলাফল জমা দিন</span>
            </h3>

            {myResult ? (
              <div className="p-3 rounded-xl bg-[#090d1c] border border-[#1b243e] text-xs text-slate-300 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">আপনার সাবমিট করা রেজাল্ট:</span>
                  <span className="font-bold text-amber-400">
                    {myResult === "WON" && "আমি জিতেছি (Won)"}
                    {myResult === "LOST" && "আমি হেরেছি (Lost)"}
                    {myResult === "DISPUTE" && "বিরোধ (Dispute)"}
                  </span>
                </div>
                {myProof && (
                  <div className="mt-2">
                    <span className="text-[10px] text-slate-400 block mb-1">আপলোড করা স্ক্রিনশট:</span>
                    <a href={myProof} target="_blank" rel="noreferrer" className="text-cyan-400 underline font-mono text-[11px]">
                      প্রমাণ স্ক্রিনশট দেখুন
                    </a>
                  </div>
                )}
                <p className="text-[11px] text-slate-400 mt-2">
                  এডমিন যাচাই করছেন অথবা প্রতিপক্ষের রেজাল্টের অপেক্ষায় রয়েছে।
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitResult} className="space-y-3.5">
                {/* Result Option Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedResult("WON")}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition-all ${
                      selectedResult === "WON"
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                        : "bg-[#090d1c] border-[#1b243e] text-slate-400 hover:bg-[#12182c]"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>আমি জিতেছি</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedResult("LOST")}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition-all ${
                      selectedResult === "LOST"
                        ? "bg-rose-500/20 border-rose-500 text-rose-400"
                        : "bg-[#090d1c] border-[#1b243e] text-slate-400 hover:bg-[#12182c]"
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    <span>আমি হেরেছি</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedResult("DISPUTE")}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border flex flex-col items-center gap-1 transition-all ${
                      selectedResult === "DISPUTE"
                        ? "bg-amber-500/20 border-amber-500 text-amber-400"
                        : "bg-[#090d1c] border-[#1b243e] text-slate-400 hover:bg-[#12182c]"
                    }`}
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>বিরোধ</span>
                  </button>
                </div>

                {/* Screenshot Upload for "WON" */}
                {selectedResult === "WON" && (
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      জয়ের স্ক্রিনশট আপলোড করুন (বাধ্যতামূলক)
                    </label>

                    <label className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-700 hover:border-amber-500 bg-[#090d1c] cursor-pointer transition-colors">
                      <UploadCloud className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-xs font-semibold text-slate-300">
                        {file ? file.name : "স্ক্রিনশট নির্বাচন করতে ট্যাপ করুন"}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5">
                        JPEG, PNG (Max 10MB)
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>

                    {previewUrl && (
                      <div className="mt-2.5 relative w-full h-40 rounded-xl overflow-hidden border border-slate-700 bg-black">
                        <img
                          src={previewUrl}
                          alt="Proof preview"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Dispute Reason */}
                {selectedResult === "DISPUTE" && (
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      বিরোধের কারণ লিখুন
                    </label>
                    <textarea
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                      placeholder="যেমন: প্রতিপক্ষ গেম লিভ করেছে বা কোড দেয়নি..."
                      rows={3}
                      className="w-full bg-[#090d1c] border border-[#1b243e] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                )}

                {/* Info Banner about auto-credit */}
                {selectedResult === "WON" && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-200 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>স্ক্রিনশট সহ জমা দিলে সাথে সাথে ব্যালেন্সে যোগ হবে!</strong> Ludo King-এর নিজস্ব রিজাল্ট স্ক্রিনশট আপলোড করুন — এডমিনের অপেক্ষা ছাড়াই ফ্যালার্ড তৎক্ষণাৎ জমা হিসেবে যোগ হবে!
                    </span>
                  </div>
                )}

                {/* Anti-cheat Alert */}
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-[11px] text-red-300 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>
                    সতর্কতা: ভুয়া স্ক্রিনশট আপলোড করলে অথবা হেরে গিয়ে মিথ্যা বিজয়ের দাবি করলে আপনার একাউন্ট ও ব্যালেন্স স্থায়ীভাবে ব্যান করা হবে।
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md transition-all active:scale-98 disabled:opacity-50"
                >
                  {submitting ? "জমা দেওয়া হচ্ছে..." : "ফলাফল নিশ্চিত করুন"}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      <DepositModal
        isOpen={depositOpen}
        onClose={() => setDepositOpen(false)}
        onSuccess={() => {
          refreshUser();
          fetchMatch();
        }}
      />

      <JoinMatchModal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        match={match}
        user={user}
        onSuccess={() => {
          refreshUser();
          fetchMatch();
        }}
      />
    </AppShell>
  );
}
