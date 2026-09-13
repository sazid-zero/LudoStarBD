"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import { useUser } from "@/components/common/UserContext";
import { useToast } from "@/components/common/ToastContext";
import DepositModal from "@/components/wallet/DepositModal";
import WithdrawModal from "@/components/wallet/WithdrawModal";
import { Transaction } from "@/lib/types";
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Trophy,
  Gift,
  Coins,
} from "lucide-react";

export default function WalletPage() {
  const { user, refreshUser } = useUser();
  const { showToast } = useToast();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "DEPOSIT" | "WITHDRAW" | "MATCH">("ALL");

  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/wallet/transactions");
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter((t) => {
    if (filter === "DEPOSIT") return t.type === "DEPOSIT";
    if (filter === "WITHDRAW") return t.type === "WITHDRAW";
    if (filter === "MATCH") return t.type === "MATCH_FEE" || t.type === "MATCH_WIN";
    return true;
  });

  const totalBalance = (user?.mainBalance || 0) + (user?.winBalance || 0);

  return (
    <AppShell title="আমার ওয়ালেট">
      <div className="p-3.5 space-y-4">
        {/* Wallet Hero Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0B152B] via-[#101E3D] to-[#070D1E] border border-cyan-500/30 text-center shadow-xl shadow-cyan-950/20 relative overflow-hidden">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block mb-1">
            মোট ব্যালেন্স
          </span>
          <div className="text-3xl sm:text-4xl font-black text-white font-mono mb-4 tracking-tight">
            🪙 {totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })} Coins
          </div>

          {/* Breakdown Boxes */}
          <div className="grid grid-cols-2 gap-2 text-left mb-4">
            <div className="p-3 rounded-xl bg-[#030712]/80 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                খেলার ব্যালেন্স
              </span>
              <span className="text-base font-extrabold text-cyan-400 font-mono">
                🪙 {(user?.mainBalance || 0).toLocaleString()}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#030712]/80 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                উত্তোলনযোগ্য ব্যালেন্স
              </span>
              <span className="text-base font-extrabold text-emerald-400 font-mono">
                🪙 {(user?.winBalance || 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setDepositOpen(true)}
              className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold text-xs shadow-lg active:scale-95 transition-all"
            >
              <ArrowDownCircle className="w-4 h-4" />
              <span>ডিপোজিট করুন</span>
            </button>

            <button
              onClick={() => setWithdrawOpen(true)}
              className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
            >
              <ArrowUpCircle className="w-4 h-4" />
              <span>উইথড্র করুন</span>
            </button>
          </div>
        </div>

        {/* Transactions Section */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              লেনদেনের ইতিহাস
            </h3>
            <button
              onClick={fetchTransactions}
              className="p-1 text-slate-400 hover:text-white"
              title="রিফ্রেশ"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: "ALL", label: "সকল লেনদেন" },
              { id: "DEPOSIT", label: "ডিপোজিট" },
              { id: "WITHDRAW", label: "উইথড্র" },
              { id: "MATCH", label: "ম্যাচ ফি ও জয়" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  filter === f.id
                    ? "bg-slate-700 text-white border border-slate-600"
                    : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Transaction List */}
          {loading ? (
            <div className="space-y-2.5">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-16 bg-slate-900/60 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-slate-800 text-slate-400">
              <Coins className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-500" />
              <p className="text-xs font-semibold">কোনো লেনদেন পাওয়া যায়নি।</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTransactions.map((t) => {
                const isCredit =
                  t.type === "DEPOSIT" ||
                  t.type === "MATCH_WIN" ||
                  t.type === "REFERRAL_BONUS";

                return (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          t.type === "DEPOSIT"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : t.type === "WITHDRAW"
                            ? "bg-rose-500/10 text-rose-400"
                            : t.type === "MATCH_WIN"
                            ? "bg-cyan-500/10 text-cyan-400"
                            : "bg-blue-500/10 text-blue-400"
                        }`}
                      >
                        {t.type === "DEPOSIT" && <ArrowDownCircle className="w-4 h-4" />}
                        {t.type === "WITHDRAW" && <ArrowUpCircle className="w-4 h-4" />}
                        {t.type === "MATCH_WIN" && <Trophy className="w-4 h-4" />}
                        {t.type === "MATCH_FEE" && <Coins className="w-4 h-4" />}
                        {t.type === "REFERRAL_BONUS" && <Gift className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0">
                        <span className="font-bold text-white block truncate">
                          {t.note || (t.type === "DEPOSIT" ? "ডিপোজিট" : "উইথড্র")}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(t.createdAt).toLocaleDateString("bn-BD", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {t.trxId ? ` • TrxID: ${t.trxId}` : ""}
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span
                        className={`font-mono font-bold text-sm block ${
                          isCredit ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {isCredit ? "+" : "-"}🪙{t.amount}
                      </span>

                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                          t.status === "APPROVED"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : t.status === "PENDING"
                            ? "bg-cyan-500/15 text-cyan-300"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {t.status === "APPROVED" && "সফল"}
                        {t.status === "PENDING" && "প্রক্রিয়াধীন"}
                        {t.status === "REJECTED" && "বাতিল"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <DepositModal
        isOpen={depositOpen}
        onClose={() => setDepositOpen(false)}
        onSuccess={() => {
          refreshUser();
          fetchTransactions();
        }}
      />

      <WithdrawModal
        isOpen={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        winBalance={user?.winBalance || 0}
        onSuccess={() => {
          refreshUser();
          fetchTransactions();
        }}
      />
    </AppShell>
  );
}
