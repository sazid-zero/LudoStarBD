"use client";

import React, { useState } from "react";
import { X, ArrowUpCircle, AlertCircle } from "lucide-react";
import { useToast } from "../common/ToastContext";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  winBalance: number;
  onSuccess: () => void;
}

export default function WithdrawModal({
  isOpen,
  onClose,
  winBalance,
  onSuccess,
}: WithdrawModalProps) {
  const { showToast } = useToast();
  const [provider, setProvider] = useState<"BKASH" | "NAGAD" | "ROCKET">("BKASH");
  const [accountType, setAccountType] = useState<"Personal" | "Agent">("Personal");
  const [amount, setAmount] = useState("200");
  const [accountNumber, setAccountNumber] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const withdrawVal = Number(amount) || 0;
  const isAgent = accountType === "Agent";
  const fee = withdrawVal > 0 ? (isAgent ? Math.round(withdrawVal * 0.02 * 100) / 100 : 10) : 0;
  const netPayout = Math.max(0, withdrawVal - fee);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!withdrawVal || withdrawVal < 200) {
      showToast("সর্বনিম্ন উত্তোলনের পরিমাণ ২০০ টাকা", "error");
      return;
    }

    if (withdrawVal > winBalance) {
      showToast(`আপনার উইনিং ব্যালেন্স অপর্যাপ্ত (বর্তমান: ৳${winBalance})`, "error");
      return;
    }

    if (!accountNumber || accountNumber.length < 11) {
      showToast("সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: withdrawVal,
          mfsProvider: provider,
          accountType,
          accountNumber,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "উইথড্র রিকোয়েস্ট ব্যর্থ হয়েছে");
      }

      showToast(data.message || "উইথড্র রিকোয়েস্ট সফল!", "success");
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
            <ArrowUpCircle className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">টাকা উত্তোলন (উইথড্র)</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Withdrawable Balance Info */}
        <div className="mt-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-emerald-300 block">
              উত্তোলনযোগ্য উইনিং ব্যালেন্স
            </span>
            <span className="text-xl font-bold font-mono text-emerald-400">
              ৳ {winBalance.toLocaleString()}
            </span>
          </div>
          <span className="text-[11px] font-bold text-emerald-400 bg-emerald-900/50 px-2.5 py-1 rounded-full border border-emerald-700/50">
            মিনিমাম ৳২০০
          </span>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {/* Provider Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5">
              উত্তোলনের মাধ্যম
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

          {/* Account Type */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5">
              একাউন্টের ধরন
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["Personal", "Agent"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setAccountType(t)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                    accountType === t
                      ? "bg-cyan-950/70 border-cyan-400 text-cyan-200 shadow-sm shadow-cyan-500/10 font-bold"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  {t === "Personal" ? "পার্সোনাল (১০৳ চার্জ)" : "এজেন্ট (২% চার্জ)"}
                </button>
              ))}
            </div>
          </div>

          {/* Receiver Account Number */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              {provider} {accountType === "Agent" ? "এজেন্ট" : "পার্সোনাল"} নম্বর
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

          {/* Amount */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-400">
                উত্তোলনের পরিমাণ (৳)
              </label>
              <span className="text-[10px] text-cyan-400 font-bold">
                সর্বনিম্ন ২০০ টাকা
              </span>
            </div>
            <div className="flex gap-2 mb-2 overflow-x-auto pb-1 scrollbar-none">
              {["200", "500", "1000", "2000", "5000"].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  className={`px-3 py-1 rounded-md text-xs font-mono font-bold border transition-all ${
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
              placeholder="পরিমাণ লিখুন (সর্বনিম্ন ২০০)"
              min={200}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/40 font-mono"
              required
            />
          </div>

          {/* Real-time Calculation Breakdown */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>উইথড্র পরিমাণ:</span>
              <span className="font-bold text-white font-mono">৳{withdrawVal}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>{isAgent ? "এজেন্ট ক্যাশআউট চার্জ (২%):" : "পার্সোনাল সার্ভিস চার্জ:"}</span>
              <span className="font-bold font-mono text-amber-400">
                - ৳{fee}
              </span>
            </div>
            <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between font-bold">
              <span className="text-slate-200">আপনি একাউন্টে পাবেন:</span>
              <span className="text-cyan-400 font-mono text-sm font-black">৳{netPayout}</span>
            </div>
          </div>

          {/* Explicit Notice */}
          <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-[11px] text-amber-200 flex items-start gap-2 leading-relaxed">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-300">উইথড্র নীতিমালা ও চার্জ:</p>
              <p className="text-slate-300 mt-0.5">
                • সর্বনিম্ন উইথড্র ব্যালেন্স <strong>৳২০০</strong>।
                <br />
                • <strong>পার্সোনাল একাউন্ট:</strong> যেকোনো পরিমাণের জন্য ফিক্সড <strong>১০ টাকা</strong> সার্ভিস চার্জ প্রযোজ্য।
                <br />
                • <strong>এজেন্ট একাউন্ট:</strong> উত্তোলিত পরিমাণের ওপর <strong>২% ক্যাশআউট চার্জ</strong> প্রযোজ্য।
                <br />
                • রিকোয়েস্টের ৫ থেকে ৩০ মিনিটের মধ্যে আপনার নম্বরে টাকা পাঠানো হবে।
              </p>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || winBalance < 200 || withdrawVal < 200}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-sm shadow-lg shadow-cyan-500/20 transition-all active:scale-98 disabled:opacity-50"
          >
            {loading ? "প্রক্রিয়াকরণ হচ্ছে..." : `৳${withdrawVal} উইথড্র নিশ্চিত করুন (পাবেন ৳${netPayout})`}
          </button>
        </form>
      </div>
    </div>
  );
}
