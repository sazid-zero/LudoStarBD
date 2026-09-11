"use client";

import React, { useState } from "react";
import { X, Copy, Check, AlertCircle, ArrowDownCircle } from "lucide-react";
import { useToast } from "../common/ToastContext";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DepositModal({ isOpen, onClose, onSuccess }: DepositModalProps) {
  const { showToast } = useToast();
  const [provider, setProvider] = useState<"BKASH" | "NAGAD" | "ROCKET">("BKASH");
  const [amount, setAmount] = useState("100");
  const [accountNumber, setAccountNumber] = useState("");
  const [trxId, setTrxId] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const receiverNumbers = {
    BKASH: process.env.NEXT_PUBLIC_BKASH_NUMBER || "01342968557",
    NAGAD: process.env.NEXT_PUBLIC_NAGAD_NUMBER || "01342968557",
    ROCKET: process.env.NEXT_PUBLIC_ROCKET_NUMBER || "01342968557",
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(receiverNumbers[provider]);
    setCopied(true);
    showToast("নম্বর কপি করা হয়েছে!", "info");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) < 20) {
      showToast("সর্বনিম্ন ডিপোজিট ২০ টাকা", "error");
      return;
    }
    if (!accountNumber || accountNumber.length < 11) {
      showToast("সঠিক মোবাইল নম্বর দিন", "error");
      return;
    }
    if (!trxId || trxId.length < 6) {
      showToast("সঠিক TrxID দিন", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount),
          mfsProvider: provider,
          accountNumber,
          trxId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "ডিপোজিট রিকোয়েস্ট ব্যর্থ হয়েছে");
      }

      showToast(data.message || "ডিপোজিট রিকোয়েস্ট সফল!", "success");
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || "সমস্যা হয়েছে", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl p-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ArrowDownCircle className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">টাকা জমা দিন (ডিপোজিট)</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Provider Selection */}
        <div className="mt-4">
          <label className="text-xs font-semibold text-slate-400 block mb-2">
            পেমেন্ট মেথড নির্বাচন করুন
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(["BKASH", "NAGAD", "ROCKET"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setProvider(p)}
                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                  provider === p
                    ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-500/20"
                    : "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800"
                }`}
              >
                {p === "BKASH" && "বিকাশ"}
                {p === "NAGAD" && "নগদ"}
                {p === "ROCKET" && "রকেট"}
              </button>
            ))}
          </div>
        </div>

        {/* Receiver Number Box */}
        <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800">
          <span className="text-[11px] font-medium text-slate-400 block">
            আমাদের {provider} Personal নম্বর (Send Money করুন):
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-lg font-mono font-bold text-emerald-400">
              {receiverNumbers[provider]}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "কপি হয়েছে" : "কপি"}</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {/* Quick Amount Buttons */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5">
              টাকার পরিমাণ (৳)
            </label>
            <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
              {["50", "100", "200", "500", "1000"].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  className={`px-3 py-1 rounded-md text-xs font-mono font-bold border ${
                    amount === val
                      ? "bg-cyan-400 text-slate-950 border-cyan-400 font-black shadow-sm shadow-cyan-400/30"
                      : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750"
                  }`}
                >
                  ৳{val}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="পরিমাণ লিখুন"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/40"
              required
            />
          </div>

          {/* Sender Phone Number */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              যে নম্বর থেকে টাকা পাঠিয়েছেন
            </label>
            <input
              type="tel"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="01XXXXXXXXX"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/40 font-mono"
              required
            />
          </div>

          {/* TrxID */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              ট্রানজেকশন আইডি (TrxID)
            </label>
            <input
              type="text"
              value={trxId}
              onChange={(e) => setTrxId(e.target.value.toUpperCase())}
              placeholder="যেমন: BLM987123A"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/40 font-mono tracking-wider"
              required
            />
          </div>

          {/* Guidelines */}
          <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-[11px] text-cyan-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <span>
              টাকা পাঠানোর পর প্রাপ্ত SMS থেকে TrxID কপি করে উপরে দিন। ৫ থেকে ১০ মিনিটের মধ্যে ব্যালেন্স যোগ হবে।
            </span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold text-sm transition-all active:scale-98 disabled:opacity-50"
          >
            {loading ? "জমা দেওয়া হচ্ছে..." : "ডিপোজিট রিকোয়েস্ট নিশ্চিত করুন"}
          </button>
        </form>
      </div>
    </div>
  );
}
