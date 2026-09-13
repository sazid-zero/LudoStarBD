"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useLanguage } from "./LanguageContext";

interface NoticeModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  autoShowOnLogin?: boolean;
  isAdmin?: boolean;
}

export default function NoticeModal({
  isOpen,
  onClose,
  autoShowOnLogin = true,
  isAdmin = false,
}: NoticeModalProps) {
  const { lang } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen === true) {
      setVisible(true);
      return;
    }

    if (autoShowOnLogin && !isAdmin) {
      // Check if triggered right after login or first time in session
      const showFlag = typeof window !== "undefined" ? sessionStorage.getItem("show_login_notice") : null;
      const seenNotice = typeof window !== "undefined" ? sessionStorage.getItem("ludoearn_notice_seen_v2") : null;

      if (showFlag === "true" || !seenNotice) {
        const timer = setTimeout(() => {
          setVisible(true);
          try {
            sessionStorage.removeItem("show_login_notice");
          } catch {}
        }, 350);
        return () => clearTimeout(timer);
      }
    }

    if (isOpen === false || isAdmin) {
      setVisible(false);
    }
  }, [isOpen, autoShowOnLogin, isAdmin]);

  const handleClose = () => {
    setVisible(false);
    sessionStorage.setItem("ludoearn_notice_seen_v2", "true");
    sessionStorage.removeItem("show_login_notice");
    if (onClose) onClose();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      {/* Modal Container matching cool realistic blue glow theme */}
      <div className="relative w-full max-w-sm sm:max-w-md bg-[#0a1228] border border-sky-500/30 rounded-3xl shadow-[0_0_50px_rgba(14,165,233,0.35)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top iOS-style Pill Grabber */}
        <div className="w-10 h-1 bg-sky-400/40 rounded-full mx-auto mt-3 mb-1 flex-shrink-0 shadow-[0_0_6px_rgba(56,189,248,0.5)]" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-2 pb-3 flex-shrink-0">
          <h2 className="text-xl font-bold text-white tracking-wide font-sans flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00E5FF]" />
            <span>Notice</span>
          </h2>
          <button
            onClick={handleClose}
            type="button"
            className="text-slate-400 hover:text-white p-1 transition-colors active:scale-95"
            aria-label="Close Notice"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Notice Content: Exact text and spacing matching user screenshot */}
        <div className="px-6 py-2 overflow-y-auto space-y-3.5 text-[13px] sm:text-[14px] leading-relaxed text-slate-300 font-sans select-text">
          {lang === "en" ? (
            <>
              <p className="font-bold text-cyan-300 text-base drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]">
                🏆 Ludo Best Club 🏆
              </p>
              <p className="text-rose-300 font-medium bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                🚫 Warning: Abusive behavior or harassment towards opponents during a match will result in a 100 Coin fine & permanent account ban!
              </p>
              <p className="font-bold text-cyan-400">
                📌 Match Rules:
              </p>
              <p>
                🚫 Limit: Please check your Ludo King daily game limit before joining. Limit issues are entirely the player's responsibility.
              </p>
              <p>
                🆔 Name Match: Your in-game name in Ludo King and Ludo Best Club must match. If matching, you receive instant winning approval upon proof submission.
              </p>
              <p>
                ⏱️ Timeout: If opponent does not join within 4-5 minutes of room ID generation, take a screenshot while sitting inside the room. You must report within 5 minutes along with your match number; late reports are not accepted.
              </p>
              <p className="text-emerald-400 font-medium">
                🟢 Our support service operates 24/7. Best wishes to everyone, have a great game! 🎲 🔥
              </p>
            </>
          ) : (
            <>
              <p className="font-bold text-cyan-300 text-base drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]">
                🏆 Ludo Best Club 🏆
              </p>
              <p className="text-rose-300 font-medium bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                🚫 সতর্কতা: ম্যাচ চলাকালীন অপোনেন্টের সাথে খারাপ ব্যবহার বা গালাগালি করলে ১০০ টাকা জরিমানা ও অ্যাকাউন্ট ব্যান করা হবে!
              </p>
              <p className="font-bold text-cyan-400">
                📌 খেলার নিয়মাবলী:
              </p>
              <p>
                🚫 লিমিট: জয়েন করার আগে Ludo King-এর ডেইলি লিমিট চেক করুন। লিমিট সমস্যার দায় আপনার।
              </p>
              <p>
                🆔 নামের মিল: Ludo King এবং Ludo Best Club-এ নাম সেম থাকতে হবে। মিল থাকলে স্ক্রিনশট দিলেই সাথে সাথে Winning পাবেন।
              </p>
              <p>
                ⏱️ টাইম ওভার: রুম আইডি দেওয়ার ৪-৫ মিনিটের মধ্যে অপোনেন্ট না আসলে রুম এ বসে থাকা অবস্থায় স্ক্রিনসট দিন। অবশ্যই রুম কোড দেয়ার পর ৫ মিনিটের মধ্যে জানাতে হবে ও ম্যাচ নাম্বার বলতে হবে , নয়তো পরে জানালে গ্রহণযোগ্য নয়।
              </p>
              <p className="text-emerald-400 font-medium">
                🟢 আমাদের ২৪ ঘণ্টা সার্ভিস চালু থাকে। সবার জন্য শুভকামনা, ভালো খেলা হোক! 🎲 🔥
              </p>
            </>
          )}
        </div>

        {/* Bottom Button: Electric Cyan / Ice Blue glow button */}
        <div className="p-5 pt-3 flex-shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-base shadow-[0_0_24px_rgba(0,229,255,0.4)] active:scale-98 transition-all tracking-wide text-center"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
