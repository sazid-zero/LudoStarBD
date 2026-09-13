"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Match } from "@/lib/types";
import { useLanguage } from "../common/LanguageContext";
import { useUser } from "../common/UserContext";
import JoinMatchModal from "./JoinMatchModal";
import {
  Copy,
  Check,
  Clock,
  HelpCircle,
  X,
  Lock,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Play,
  ExternalLink,
} from "lucide-react";
import { getYoutubeEmbedUrl, getYoutubeWatchUrl } from "@/lib/youtube";

interface MatchCardProps {
  match: Match;
  currentUserId?: string | null;
  onJoin?: (matchId: string) => void;
  joining?: boolean;
  tutorialVideoUrl?: string;
}

export default function MatchCard({
  match,
  currentUserId,
  onJoin,
  joining,
  tutorialVideoUrl,
}: MatchCardProps) {
  const { lang } = useLanguage();
  const { user, refreshUser } = useUser();
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showRoomIdModal, setShowRoomIdModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [effectiveVideoUrl, setEffectiveVideoUrl] = useState(tutorialVideoUrl || "");

  useEffect(() => {
    if (tutorialVideoUrl) {
      setEffectiveVideoUrl(tutorialVideoUrl);
      return;
    }
    // Fetch video_matches from /api/settings if not supplied
    fetch("/api/settings")
      .then((res) => res.json())
      .then((d) => {
        if (d?.settings?.video_matches) {
          setEffectiveVideoUrl(d.settings.video_matches);
        }
      })
      .catch(() => {});
  }, [tutorialVideoUrl]);

  const isCreator = Boolean(currentUserId && match.creatorId === currentUserId);
  const isOpponent = Boolean(currentUserId && match.opponentId === currentUserId);
  const isParticipant = isCreator || isOpponent;

  // Joined calculation: count actual players present
  const hasCreator = Boolean(match.creatorId);
  const hasOpponent = Boolean(match.opponentId);
  const joinedCount = (hasCreator ? 1 : 0) + (hasOpponent ? 1 : 0);
  
  // Match is FULL when: both players present OR non-joinable status
  const bothFull = hasCreator && hasOpponent;
  const closedStatus = match.status === "COMPLETED" || match.status === "CANCELLED" || match.status === "DISPUTED";
  const isFull = bothFull || closedStatus;
  
  const progressPercent = bothFull ? 100 : joinedCount === 1 ? 50 : 0;

  const handleCopyCode = () => {
    if (!match.roomCode) return;
    navigator.clipboard.writeText(match.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <>
      {/* Match Card Container matching exact screenshot */}
      <div className="bg-white rounded-3xl p-4 text-slate-900 shadow-[0_4px_20px_rgba(0,0,0,0.07)] border border-slate-100 relative mb-4 overflow-hidden transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)]">
        {/* Top-right decorative trophy & dice illustration */}
        <div className="absolute top-1 right-2 w-32 h-20 pointer-events-none opacity-90 overflow-hidden">
          <Image
            src="/trophy_dice.png"
            alt="Trophy & Dice"
            fill
            className="object-contain object-right"
          />
        </div>

        {/* Top Header: Logo & Title */}
        <div className="flex items-start gap-3 mb-3 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-black border border-slate-800 p-0.5 flex-shrink-0 shadow-sm flex items-center justify-center overflow-hidden">
            <Image
              src="/logo.png"
              alt="LudoEarn"
              width={44}
              height={44}
              className="object-contain w-full h-full rounded-xl"
            />
          </div>

          <div className="min-w-0 flex-1 pr-16">
            <div className="flex items-center gap-1 text-sm font-black text-slate-900 tracking-tight">
              <span>🔥</span>
              <h3 className="truncate uppercase font-black">{match.title}</h3>
              <span>🔥</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium truncate">
              {lang === "en"
                ? "Starts immediately when 2 players join."
                : "২ জন জয়েন হলেই স্টার্ট দেওয়া হবে।"}
            </p>
          </div>
        </div>

        {/* 4 Info Boxes Grid matching screenshot 2 */}
        <div className="grid grid-cols-2 gap-2.5 my-3 relative z-10">
          {/* Box 1: Total Prize */}
          <div className="p-3 rounded-2xl bg-slate-50/90 border border-slate-100 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center flex-shrink-0 text-sm font-bold">
              💰
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-500 block leading-tight">
                {lang === "en" ? "Total Prize" : "মোট পুরস্কার"}
              </span>
              <span className="text-base font-black text-emerald-600 font-mono leading-none">
                ৳{match.prize.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Box 2: Entry Fee */}
          <div className="p-3 rounded-2xl bg-slate-50/90 border border-slate-100 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-purple-500/15 text-purple-600 flex items-center justify-center flex-shrink-0 text-sm font-bold">
              👥
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-500 block leading-tight">
                {lang === "en" ? "Entry Fee" : "এন্ট্রি ফি"}
              </span>
              <span className="text-base font-black text-slate-900 font-mono leading-none">
                ৳{match.entryFee.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Box 3: Version */}
          <div className="p-3 rounded-2xl bg-slate-50/90 border border-slate-100 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-cyan-500/15 text-cyan-600 flex items-center justify-center flex-shrink-0 text-sm">
              ⚡
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-500 block leading-tight">
                {lang === "en" ? "Version" : "ভার্সন"}
              </span>
              <span className="text-xs font-black text-slate-800 leading-none">
                Mobile / Web
              </span>
            </div>
          </div>

          {/* Box 4: Board Type */}
          <div className="p-3 rounded-2xl bg-slate-50/90 border border-slate-100 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-600 flex items-center justify-center flex-shrink-0 text-sm">
              🎲
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-500 block leading-tight">
                {lang === "en" ? "Board Type" : "বোর্ড টাইপ"}
              </span>
              <span className="text-xs font-black text-slate-800 leading-none">
                1 vs 1 Battle
              </span>
            </div>
          </div>
        </div>

        {/* Seat Progress & Status Bar (Sky Blue Progress Bar & Action Button) */}
        {/* Seat Progress & Status Bar matching screenshot 2 */}
        <div className="my-3 flex items-center justify-between gap-3 relative z-10">
          <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden relative">
            <div
              className="h-full rounded-full bg-[#06B6D4] transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md font-mono flex-shrink-0 tracking-wider">
            {joinedCount}/2 JOINED ({joinedCount}/2)
          </span>
        </div>

        {/* Bottom 2 Action Buttons matching screenshot 2: "কিভাবে খেলবেন?" and "JOIN NOW" */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowHowToPlay(true)}
            className="py-2.5 px-3 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-black text-xs transition-all active:scale-95 text-center flex items-center justify-center gap-1.5 shadow-sm"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{lang === "en" ? "How to play?" : "কিভাবে খেলবেন?"}</span>
          </button>

          {closedStatus ? (
            <span className="py-2.5 px-3 rounded-xl bg-slate-100 text-slate-500 font-black text-xs text-center flex items-center justify-center">
              {match.status === "COMPLETED" ? (lang === "en" ? "Completed" : "সম্পন্ন") :
               match.status === "CANCELLED" ? (lang === "en" ? "Cancelled" : "বাতিল") :
               (lang === "en" ? "Dispute" : "বিরোধ")}
            </span>
          ) : bothFull ? (
            isParticipant ? (
              <Link
                href={`/matches/${match.id}`}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-sm active:scale-95 transition-all text-center flex items-center justify-center gap-1"
              >
                <span>{match.roomCode ? "🔑 রুম রেডি" : "⏳ অপেক্ষা..."}</span>
                <span>›</span>
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="py-2.5 px-3 rounded-xl bg-slate-200 text-slate-500 font-black text-xs cursor-default text-center flex items-center justify-center"
              >
                সিট পূর্ণ
              </button>
            )
          ) : (
            isParticipant ? (
              <Link
                href={`/matches/${match.id}`}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-sm active:scale-95 transition-all text-center flex items-center justify-center gap-1"
              >
                <span>১ জন জয়েন</span>
                <span>›</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    window.location.href = `/login?redirect=/matches/${match.id}`;
                    return;
                  }
                  setShowJoinModal(true);
                }}
                disabled={joining}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#00D06C] to-[#059669] hover:from-[#00b960] hover:to-[#047857] text-white font-black text-xs shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1 text-center disabled:opacity-50"
              >
                <span>{joining ? "জয়েনিং..." : "JOIN NOW ⚔"}</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Modal 1: How to Play Modal with Embedded Tutorial Video */}
      {showHowToPlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#0a1228] border border-sky-500/40 rounded-3xl p-4 sm:p-5 shadow-2xl text-left space-y-3.5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-sky-500/20 pb-2.5">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-black text-white">
                  {lang === "en" ? "How to Play? (Video Guide)" : "কিভাবে খেলবেন? (ভিডিও গাইড)"}
                </h3>
              </div>
              <button
                onClick={() => setShowHowToPlay(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Embedded YouTube Tutorial Video */}
            <div className="space-y-1.5">
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-cyan-500/40 shadow-lg shadow-cyan-500/10">
                <iframe
                  className="w-full h-full"
                  src={getYoutubeEmbedUrl(effectiveVideoUrl || tutorialVideoUrl)}
                  title="Ludo King এ কীভাবে খেলবেন - সম্পূর্ণ নিয়ম"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              <div className="flex items-center justify-between text-[11px] px-1">
                <span className="text-cyan-400 font-bold flex items-center gap-1">
                  <Play className="w-3 h-3 fill-cyan-400" />
                  <span>ভিডিও দেখে ১ মিনিটে শিখে নিন</span>
                </span>
                <a
                  href={getYoutubeWatchUrl(effectiveVideoUrl || tutorialVideoUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-white hover:underline flex items-center gap-1 font-semibold"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>YouTube এ ওপেন করুন</span>
                </a>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300 pt-1">
              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                  ১
                </span>
                <p>
                  {lang === "en"
                    ? "Click 'Join' button and pay entry fee to enter the match."
                    : "প্রথমে 'জয়েন করুন' বাটনে ক্লিক করে এন্ট্রি ফি দিয়ে ম্যাচে যুক্ত হোন।"}
                </p>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                  ২
                </span>
                <p>
                  {lang === "en"
                    ? "Wait for room ID. An admin will provide the Ludo King room ID shortly."
                    : "রুম আইডির জন্য অপেক্ষা করুন, অ্যাডমিন শীঘ্রই আপনাকে Ludo King রুম আইডি প্রদান করবেন।"}
                </p>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                  ৩
                </span>
                <p>
                  {lang === "en"
                    ? "Open Ludo King app > Play with Friends > Join tab and paste the code."
                    : "Ludo King অ্যাপে ঢুকে 'Play with Friends' > 'Join' ট্যাবে রুম কোডটি পেস্ট করে খেলায় যুক্ত হোন।"}
                </p>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                  ৪
                </span>
                <p>
                  {lang === "en"
                    ? "After winning the match, take a screenshot and submit proof in the match room to claim your prize."
                    : "খেলা শেষে বিজয়ী হলে উইনিং স্ক্রিনশট নিয়ে ওয়েবসাইট ম্যাচ রুমে প্রুফ সাবমিট করে পুরস্কার বুঝে নিন।"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHowToPlay(false)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95"
            >
              {lang === "en" ? "Got It" : "বুঝেছি"}
            </button>
          </div>
        </div>
      )}

      {/* Modal 2: Room ID Modal (Controlled Visibility & Waiting for Admin Notice) */}
      {showRoomIdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-sm bg-[#0a1228] border border-sky-500/30 rounded-3xl p-5 shadow-2xl text-center space-y-4">
            <button
              onClick={() => setShowRoomIdModal(false)}
              className="absolute right-4 top-4 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            {!isParticipant ? (
              // If user has NOT joined
              <div className="space-y-3 pt-2">
                <div className="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 mx-auto flex items-center justify-center">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-white">
                  {lang === "en" ? "Room ID Locked" : "রুম কোড লক করা রয়েছে"}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {lang === "en"
                    ? `Please join the match (Entry fee: ৳${match.entryFee}) to receive the room ID.`
                    : `রুম আইডি দেখতে প্রথমে এন্ট্রি ফি (৳${match.entryFee}) দিয়ে ম্যাচে জয়েন করুন।`}
                </p>
                {!isFull && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowRoomIdModal(false);
                      if (onJoin) onJoin(match.id);
                    }}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md active:scale-95 transition-all"
                  >
                    {lang === "en" ? "Join Match Now" : "এখনই জয়েন করুন"}
                  </button>
                )}
              </div>
            ) : match.roomCode ? (
              // If user joined AND admin already set room code
              <div className="space-y-3 pt-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {lang === "en" ? "Ludo King Room ID" : "আপনার Ludo King রুম আইডি"}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {lang === "en" ? "Copy and join in Ludo King app" : "কোডটি কপি করে লুডো কিং-এ প্রবেশ করুন"}
                  </p>
                </div>

                <div className="py-2.5 px-4 rounded-xl bg-black/60 border border-cyan-500/40 text-2xl font-mono font-black text-cyan-300 tracking-widest select-all shadow-[inset_0_0_12px_rgba(0,229,255,0.2)]">
                  {match.roomCode}
                </div>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? (lang === "en" ? "Copied!" : "কপি হয়েছে!") : (lang === "en" ? "Copy Room ID" : "রুম কোড কপি করুন")}</span>
                </button>

                <Link
                  href={`/matches/${match.id}`}
                  className="w-full py-2.5 rounded-xl bg-[#141e3a] hover:bg-[#1b294e] border border-sky-500/20 text-slate-200 font-bold text-xs transition-all block text-center"
                >
                  {lang === "en" ? "Go to Match Arena" : "ম্যাচ এরিনায় যান"}
                </Link>
              </div>
            ) : (
              // If user joined BUT room code is not set yet by admin (User's specific requirement!)
              <div className="space-y-3 pt-2">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center animate-pulse">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-amber-300">
                    {lang === "en" ? "Waiting for Room ID" : "রুম আইডির জন্য অপেক্ষা করুন"}
                  </h3>
                  <p className="text-xs text-slate-200 mt-2 leading-relaxed px-2">
                    {lang === "en"
                      ? "Waiting for room ID, an admin will give you room ID soon."
                      : "রুম আইডির জন্য অপেক্ষা করুন, অ্যাডমিন শীঘ্রই আপনাকে রুম আইডি প্রদান করবেন।"}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>
                    {lang === "en"
                      ? "Admin is creating the room..."
                      : "অ্যাডমিন রুম কোড সেট করার সাথে সাথেই দেখতে পাবেন"}
                  </span>
                </div>

                <Link
                  href={`/matches/${match.id}`}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95 block text-center"
                >
                  {lang === "en" ? "Enter Match Arena" : "ম্যাচ রুমে প্রবেশ করুন"}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal 3: Join Match Confirmation Modal (exact layout from mobile screenshot) */}
      <JoinMatchModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        match={match}
        user={user}
        onSuccess={() => {
          refreshUser();
          if (onJoin) onJoin(match.id);
        }}
      />
    </>
  );
}
