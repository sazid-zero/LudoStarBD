"use client";

import React, { useState } from "react";
import { X, Copy, Check, AlertCircle, ArrowDownCircle, Smartphone } from "lucide-react";
import { useToast } from "../common/ToastContext";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PROVIDERS = [
  { id: "BKASH", label: "বিকাশ", color: "from-pink-600/20 to-rose-600/10 border-pink-500/40 text-pink-300" },
  { id: "NAGAD", label: "নগদ", color: "from-orange-600/20 to-amber-600/10 border-orange-500/40 text-orange-300" },
  { id: "ROCKET", label: "রকেট", color: "from-violet-600/20 to-purple-600/10 border-violet-500/40 text-violet-300" },
] as const;

type Provider = typeof PROVIDERS[number]["id"];

export default function DepositModal({ isOpen, onClose, onSuccess }: DepositModalProps) {
  const { showToast } = useToast();
  const [provider, setProvider] = useState<Provider>("BKASH");
  const [amount, setAmount] = useState("100");
  const [accountNumber, setAccountNumber] = useState("");
  const [trxId, setTrxId] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const receiverNumbers: Record<Provider, string> = {
    BKASH: process.env.NEXT_PUBLIC_BKASH_NUMBER || "01342968557",
    NAGAD: process.env.NEXT_PUBLIC_NAGAD_NUMBER || "01342968557",
    ROCKET: process.env.NEXT_PUBLIC_ROCKET_NUMBER || "01342968557",
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(receiverNumbers[provider]);
    setCopied(true);
    showToast("নম্বর কপি করা হয়েছে!", "info");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) < 10) {
      showToast("সর্বনিম্ন ডিপোজিট ১০ টাকা", "error");
      return;
    }
    if (!accountNumber || accountNumber.trim().length < 11) {
      showToast("সঠিক মোবাইল নম্বর দিন (১১ ডিজিট)", "error");
      return;
    }
    if (!trxId || trxId.trim().length < 6) {
      showToast("সঠিক TrxID দিন (ন্যূনতম ৬ অক্ষর)", "error");
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
          accountNumber: accountNumber.trim(),
          senderPhone: accountNumber.trim(),
          trxId: trxId.trim().toUpperCase(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ডিপোজিট রিকোয়েস্ট ব্যর্থ হয়েছে");

      showToast(data.message || "ডিপোজিট রিকোয়েস্ট সফল! অ্যাডমিন শীঘ্রই যাচাই করবেন।", "success");
      setAmount("100");
      setAccountNumber("");
      setTrxId("");
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || "সমস্যা হয়েছে", "error");
    } finally {
      setLoading(false);
    }
  };

  const activeProvider = PROVIDERS.find((p) => p.id === provider)!;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl p-5 max-h-[92vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <ArrowDownCircle className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">টাকা জমা দিন (ডিপোজিট)</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Step 1 – Choose provider */}
          <div>
            <label className="text-xs font-bold text-slate-400 block mb-2">
              ধাপ ১: পেমেন্ট মেথড নির্বাচন করুন
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProvider(p.id)}
                  className={`py-2.5 px-2 rounded-xl text-xs font-extrabold border bg-gradient-to-br transition-all ${p.color} ${
                    provider === p.id
                      ? "ring-2 ring-white/20 shadow-md scale-[1.03]"
                      : "opacity-60 hover:opacity-90"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2 – Send money instruction */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-700 space-y-2">
            <p className="text-[11px] font-semibold text-slate-400">
              ধাপ ২: নিচের নম্বরে <span className="text-white font-bold">Send Money</span> করুন
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xl font-mono font-black text-emerald-400 tracking-wider">
                {receiverNumbers[provider]}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "কপি হয়েছে" : "কপি করুন"}</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              Personal নম্বরে Send Money করুন (বিকাশ অ্যাপ → Send Money → নম্বর দিন)
            </p>
          </div>

          {/* Step 3 – Amount */}
          <div>
            <label className="text-xs font-bold text-slate-400 block mb-2">
              ধাপ ৩: পরিমাণ লিখুন (৳)
            </label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {["10", "50", "100", "200", "500", "1000"].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                    amount === val
                      ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm shadow-emerald-500/30"
                      : "bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600"
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
              placeholder="পরিমাণ লিখুন (যেমন: 200)"
              min="10"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-500/30 font-mono font-bold"
              required
            />
          </div>

          {/* Step 4 – Sender number */}
          <div>
            <label className="text-xs font-bold text-slate-400 block mb-1.5">
              ধাপ ৪: যে নম্বর থেকে টাকা পাঠিয়েছেন
            </label>
            <div className="relative">
              <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="tel"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="01XXXXXXXXX"
                maxLength={11}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-3 text-sm text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/30 font-mono"
                required
              />
            </div>
          </div>

          {/* Step 5 – TrxID */}
          <div>
            <label className="text-xs font-bold text-slate-400 block mb-1.5">
              ধাপ ৫: ট্রানজেকশন আইডি (TrxID)
            </label>
            <input
              type="text"
              value={trxId}
              onChange={(e) => setTrxId(e.target.value.toUpperCase())}
              placeholder="যেমন: BLM987123A"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/30 font-mono tracking-wider uppercase"
              required
            />
          </div>

          {/* Info note */}
          <div className="p-3 rounded-xl bg-cyan-500/8 border border-cyan-500/20 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-cyan-200 leading-relaxed">
              SMS-এ আসা TrxID কপি করুন এবং উপরে দিন। অ্যাডমিন যাচাই করে <strong className="text-white">৫-১৫ মিনিটের</strong> মধ্যে ব্যালেন্স যোগ করে দেবেন।
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-black text-sm shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span>{loading ? "জমা দেওয়া হচ্ছে..." : "ডিপোজিট রিকোয়েস্ট জমা দিন"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
