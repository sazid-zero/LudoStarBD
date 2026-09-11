"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Match, User } from "@/lib/types";
import { useLanguage } from "../common/LanguageContext";
import { useToast } from "../common/ToastContext";
import { X, Flame, BookOpen, Wallet, CreditCard, Copy, Check, ArrowRight } from "lucide-react";

interface JoinMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
  user: User | null;
  onSuccess?: () => void;
}

export default function JoinMatchModal({
  isOpen,
  onClose,
  match,
  user,
  onSuccess,
}: JoinMatchModalProps) {
  const { lang } = useLanguage();
  const { showToast } = useToast();
  const router = useRouter();

  const [paymentMode, setPaymentMode] = useState<"WALLET" | "DIRECT">("WALLET");
  const [ludoKingName, setLudoKingName] = useState("");
  const [mfsProvider, setMfsProvider] = useState<"BKASH" | "NAGAD" | "ROCKET">("BKASH");
  const [senderPhone, setSenderPhone] = useState("");
  const [trxId, setTrxId] = useState("");
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const adminMfsNumber = process.env.NEXT_PUBLIC_ADMIN_BKASH_NUMBER || "01321063123";

  // Set default in-game name and phone from user account
  useEffect(() => {
    if (user) {
      const defaultName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.phone;
      setLudoKingName(defaultName);
      if (user.phone) {
        setSenderPhone(user.phone);
      }
    }
  }, [user]);

  if (!isOpen || !match) return null;

  const mainBal = user?.mainBalance || 0;
  const winBal = user?.winBalance || 0;
  const totalBalance = mainBal + winBal;
  const entryFee = match.entryFee;
  const hasEnoughBalance = totalBalance >= entryFee;

  const handleCopyAdminNumber = () => {
    navigator.clipboard.writeText(adminMfsNumber);
    setCopiedNumber(true);
    showToast(lang === "en" ? "Number copied!" : "নম্বর কপি করা হয়েছে!", "info");
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handleConfirmJoin = async () => {
    if (!user) {
      showToast(lang === "en" ? "Please login to join matches" : "ম্যাচে জয়েন করতে আগে লগইন করুন", "error");
      router.push(`/login?redirect=/matches/${match.id}`);
      return;
    }

    if (!ludoKingName.trim()) {
      showToast(
        lang === "en" ? "Please enter your Ludo King name" : "আপনার লুডো কিং নাম লিখুন",
        "error"
      );
      return;
    }

    if (paymentMode === "WALLET") {
      if (!hasEnoughBalance) {
        showToast(
          lang === "en"
            ? `Insufficient balance! You need ৳${entryFee}, your total balance is ৳${totalBalance}`
            : `অপর্যাপ্ত ব্যালেন্স! আপনার ব্যালেন্স ৳${totalBalance}, কিন্তু প্রয়োজন ৳${entryFee}। সরাসরি বিকাশ/নগদে পেমেন্ট করুন।`,
          "error"
        );
        setPaymentMode("DIRECT");
        return;
      }
    } else {
      // Direct payment validation
      if (!senderPhone.trim() || senderPhone.trim().length < 11) {
        showToast("সঠিক ১১ ডিজিটের প্রেরক নম্বর লিখুন", "error");
        return;
      }
      if (!trxId.trim() || trxId.trim().length < 4) {
        showToast("টাকা পাঠানোর পর প্রাপ্ত TrxID প্রদান করুন", "error");
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload: any = {
        ludoKingName: ludoKingName.trim(),
        paymentMethod: paymentMode === "DIRECT" ? mfsProvider : "WALLET",
      };

      if (paymentMode === "DIRECT") {
        payload.senderPhone = senderPhone.trim();
        payload.trxId = trxId.trim();
      }

      const res = await fetch(`/api/matches/${match.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (lang === "en" ? "Failed to join match" : "ম্যাচে জয়েন করতে সমস্যা হয়েছে"));
      }

      showToast(data.message || (lang === "en" ? "Joined match successfully!" : "সফলভাবে ম্যাচে জয়েন করেছেন!"), "success");
      onClose();
      if (onSuccess) onSuccess();
      // Directly navigate user to the joined match page
      router.push(`/matches/${match.id}`);
    } catch (err: any) {
      showToast(err.message || "সমস্যা হয়েছে", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-[400px] bg-[#0c1224] border border-sky-500/30 rounded-3xl p-4 sm:p-5 shadow-2xl text-left space-y-3.5 max-h-[92vh] overflow-y-auto scrollbar-none">
        
        {/* Close Button Top Right */}
        <button
          onClick={onClose}
          disabled={submitting}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-all active:scale-95"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 1. Match Header Card */}
        <div className="bg-[#121b36] border border-amber-500/40 rounded-2xl p-3.5 shadow-inner space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-extrabold text-white">
              {lang === "en" ? "Match ID:" : "ম্যাচ আইডি:"}{" "}
              <span className="font-mono text-cyan-400">#{match.matchNo || match.id.slice(-6)}</span>
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-200">
            <div>
              {lang === "en" ? "Entry:" : "এন্ট্রি:"}{" "}
              <span className="font-extrabold text-amber-400">৳{match.entryFee}.00</span>
            </div>
            <div>
              {lang === "en" ? "Prize:" : "পুরস্কার:"}{" "}
              <span className="font-extrabold text-emerald-400">৳{match.prize}.00</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 pt-1 text-[11px] font-bold text-amber-300">
            <Flame className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 animate-pulse" />
            <span>
              {lang === "en"
                ? "Winner Match - Starts as soon as 2 players join!"
                : "বিজয়ী ম্যাচ - ২ জন খেলোয়াড় যোগ দিলেই শুরু!"}
            </span>
          </div>
        </div>

        {/* 2. Payment Method Selector Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#070c18] rounded-xl border border-sky-500/20 text-xs">
          <button
            type="button"
            onClick={() => setPaymentMode("WALLET")}
            className={`py-2 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
              paymentMode === "WALLET"
                ? "bg-cyan-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>ওয়ালেট ব্যালেন্স</span>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMode("DIRECT")}
            className={`py-2 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
              paymentMode === "DIRECT"
                ? "bg-amber-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>বিকাশ/নগদ পেমেন্ট</span>
          </button>
        </div>

        {/* Mode A: Wallet Balance View */}
        {paymentMode === "WALLET" && (
          <div className="bg-[#121b36] border border-sky-500/20 rounded-2xl p-3 space-y-2.5">
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-[#090e1c] border border-sky-500/20 rounded-xl p-2">
                <span className="text-[10px] text-slate-400 block">
                  {lang === "en" ? "Gaming Balance" : "গেমিং ব্যালেন্স"}
                </span>
                <span className="text-sm font-extrabold text-white">৳{mainBal}</span>
              </div>
              <div className="bg-[#090e1c] border border-sky-500/20 rounded-xl p-2">
                <span className="text-[10px] text-slate-400 block">
                  {lang === "en" ? "Winning Balance" : "জেতা ব্যালেন্স"}
                </span>
                <span className="text-sm font-extrabold text-emerald-400">৳{winBal}</span>
              </div>
            </div>

            {!hasEnoughBalance && (
              <div className="bg-[#ffebee] border border-rose-300 rounded-xl p-2.5 text-center space-y-1 animate-pulse">
                <div className="text-xs font-bold text-[#c62828] leading-tight">
                  মোট ব্যালেন্স ৳{totalBalance}, কিন্তু প্রয়োজন ৳{entryFee}।
                </div>
                <button
                  type="button"
                  onClick={() => setPaymentMode("DIRECT")}
                  className="text-[11px] font-black text-[#b71c1c] underline hover:text-rose-900 block mx-auto"
                >
                  সরাসরি বিকাশ/নগদে পেমেন্ট করে যোগ দিন ›
                </button>
              </div>
            )}
          </div>
        )}

        {/* Mode B: Direct MFS Payment View */}
        {paymentMode === "DIRECT" && (
          <div className="bg-[#121b36] border border-amber-500/30 rounded-2xl p-3 space-y-3 text-xs">
            {/* Admin Number Display Box */}
            <div className="p-2.5 bg-[#090e1c] rounded-xl border border-amber-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-amber-400 uppercase font-bold block">
                  এডমিন বিকাশ/নগদ (Personal) নম্বর
                </span>
                <span className="text-sm font-extrabold text-white font-mono tracking-wider">
                  {adminMfsNumber}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyAdminNumber}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold flex items-center gap-1 border border-amber-500/40 active:scale-95"
              >
                {copiedNumber ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedNumber ? "কপি হয়েছে" : "কপি"}</span>
              </button>
            </div>

            <p className="text-[10px] text-slate-300 leading-tight">
              উপরে দেওয়া নম্বরে <strong>৳{entryFee}</strong> Send Money / ক্যাশইন করুন এবং নিচের তথ্য পূরণ করুন:
            </p>

            {/* Provider Selector */}
            <div className="grid grid-cols-3 gap-1.5">
              {(["BKASH", "NAGAD", "ROCKET"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setMfsProvider(p)}
                  className={`py-1.5 rounded-lg font-extrabold text-[11px] transition-all ${
                    mfsProvider === p
                      ? p === "BKASH"
                        ? "bg-[#E2136E] text-white"
                        : p === "NAGAD"
                        ? "bg-[#F7941D] text-white"
                        : "bg-[#8C3494] text-white"
                      : "bg-[#090e1c] text-slate-400 border border-slate-800"
                  }`}
                >
                  {p === "BKASH" ? "bKash" : p === "NAGAD" ? "Nagad" : "Rocket"}
                </button>
              ))}
            </div>

            {/* Sender Number Field */}
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                যে নম্বর থেকে টাকা পাঠিয়েছেন:
              </label>
              <input
                type="tel"
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full bg-[#161f38] border border-sky-500/30 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            {/* Transaction ID Field */}
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                পেমেন্ট ট্রানজেকশন আইডি (TrxID):
              </label>
              <input
                type="text"
                value={trxId}
                onChange={(e) => setTrxId(e.target.value)}
                placeholder="যেমন: BLM987123A"
                className="w-full bg-[#161f38] border border-sky-500/30 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono tracking-wider uppercase placeholder-slate-500 focus:outline-none focus:border-amber-400"
                required
              />
            </div>
          </div>
        )}

        {/* 3. Ludo King In-Game Name Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 block">
            {lang === "en" ? "Enter your Ludo King Name:" : "আপনার লুডো কিং নাম লিখুন:"}
          </label>
          <input
            type="text"
            value={ludoKingName}
            onChange={(e) => setLudoKingName(e.target.value)}
            placeholder={lang === "en" ? "Ludo King in-game name..." : "লুডো কিং অ্যাপের নাম লিখুন..."}
            className="w-full bg-[#161f38] border border-sky-500/30 rounded-xl px-3.5 py-2.5 text-sm text-white font-bold placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-all shadow-inner"
          />
        </div>

        {/* 4. Important Rules Box */}
        <div className="bg-[#fbf4db] border border-[#e8dcb8] rounded-2xl p-3 text-[#3e3215] space-y-1.5 shadow-sm">
          <div className="flex items-center gap-1.5 font-black text-xs text-[#2c220b]">
            <BookOpen className="w-4 h-4 text-[#437a28] flex-shrink-0" />
            <span>{lang === "en" ? "Important Rules:" : "গুরুত্বপূর্ণ নিয়মাবলী:"}</span>
          </div>
          <ul className="text-[11px] leading-relaxed space-y-1 font-semibold text-[#483c1b]">
            <li className="flex items-start gap-1.5">
              <span className="text-[#437a28] font-bold">•</span>
              <span>মোবাইলে অবশ্যই Ludo King অ্যাপ ইন্সটল থাকতে হবে।</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-[#437a28] font-bold">•</span>
              <span>২ জন খেলোয়াড় জয়েন করলেই এডমিন রুম আইডি দিয়ে দিবেন।</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-[#437a28] font-bold">•</span>
              <span>খেলা শেষে বিজয়ী স্ক্রিনশট আপলোড করে প্রাইজ বুঝে নিবেন।</span>
            </li>
          </ul>
        </div>

        {/* 5. Bottom Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {/* Cancel Button */}
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="py-3 px-4 rounded-xl bg-[#161f38] hover:bg-[#1e2a4a] border border-sky-500/20 text-white font-black text-xs sm:text-sm active:scale-95 transition-all text-center"
          >
            {lang === "en" ? "Cancel" : "বাতিল"}
          </button>

          {/* Join Button */}
          <button
            type="button"
            onClick={handleConfirmJoin}
            disabled={submitting}
            className="py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-[0_0_15px_rgba(245,158,11,0.4)] active:scale-95 transition-all text-center disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <span>
              {submitting
                ? "জয়েনিং..."
                : paymentMode === "DIRECT"
                ? "পেমেন্ট করে জয়েন"
                : `জয়েন (৳${entryFee})`}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}
