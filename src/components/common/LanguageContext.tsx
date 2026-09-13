"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "bn" | "en";

export interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: string, fallback?: string) => string;
}

const translations: Record<string, { bn: string; en: string }> = {
  // Navigation
  "nav.home": { bn: "হোম", en: "Home" },
  "nav.matches": { bn: "ম্যাচ", en: "Matches" },
  "nav.wallet": { bn: "ওয়ালেট", en: "Wallet" },
  "nav.profile": { bn: "প্রোফাইল", en: "Profile" },
  "nav.rules": { bn: "নিয়মাবলী", en: "Rules" },
  "nav.login": { bn: "লগইন", en: "Login" },
  "nav.register": { bn: "রেজিস্টার", en: "Register" },
  "nav.play": { bn: "খেলা", en: "Play" },
  "nav.features": { bn: "সুবিধা", en: "Features" },
  "nav.howItWorks": { bn: "কীভাবে খেলে", en: "How it Works" },
  "nav.faq": { bn: "প্রশ্নোত্তর", en: "FAQ" },
  "nav.playNow": { bn: "সরাসরি খেলুন", en: "Play Now" },

  // Common buttons & labels
  "btn.gotIt": { bn: "Got it", en: "Got it" },
  "btn.close": { bn: "বন্ধ করুন", en: "Close" },
  "btn.deposit": { bn: "টাকা জমা দিন", en: "Deposit" },
  "btn.withdraw": { bn: "টাকা তুলুন", en: "Withdraw" },
  "btn.joinMatch": { bn: "ম্যাচে জয়েন করুন", en: "Join Match" },
  "btn.downloadApk": { bn: "APK ডাউনলোড করুন", en: "Download APK" },
  "btn.playWeb": { bn: "ওয়েবে সরাসরি খেলুন", en: "Play on Web" },
  "btn.copyCode": { bn: "রুম কোড কপি করুন", en: "Copy Room Code" },
  "btn.copied": { bn: "রুম কোড কপি হয়েছে!", en: "Code Copied!" },
  "btn.playConsole": { bn: "🎮 ব্রাউজারে সরাসরি খেলুন (Live Web Console)", en: "🎮 Play in Browser (Live Web Console)" },
  "btn.submitResult": { bn: "ফলাফল নিশ্চিত করুন", en: "Submit Result" },
  "btn.logout": { bn: "লগআউট", en: "Logout" },

  // Dashboard & Wallet
  "wallet.mainBalance": { bn: "মেইন ব্যালেন্স", en: "Main Balance" },
  "wallet.winBalance": { bn: "উইনিং ব্যালেন্স", en: "Winning Balance" },
  "wallet.totalBalance": { bn: "মোট ব্যালেন্স", en: "Total Balance" },
  "wallet.depositTitle": { bn: "টাকা ডিপোজিট", en: "Deposit Money" },
  "wallet.withdrawTitle": { bn: "টাকা উইথড্র", en: "Withdraw Money" },
  "wallet.minDeposit": { bn: "সর্বনিম্ন ডিপোজিট ২০ টাকা", en: "Minimum deposit ৳20 (= 20 Coins)" },
  "wallet.minWithdraw": { bn: "সর্বনিম্ন উইথড্র ২০০ Coins", en: "Minimum withdrawal 200 Coins" },

  // Matches
  "match.liveMatches": { bn: "লাইভ ম্যাচ সমূহ", en: "Live Tournaments" },
  "match.entryFee": { bn: "প্রবেশ ফি", en: "Entry Fee" },
  "match.prize": { bn: "পুরস্কার", en: "Prize Pool" },
  "match.type": { bn: "টাইপ", en: "Type" },
  "match.status": { bn: "স্ট্যাটাস", en: "Status" },
  "match.waiting": { bn: "অপেক্ষমান", en: "Waiting" },
  "match.running": { bn: "চলমান", en: "In Progress" },
  "match.completed": { bn: "সমাপ্ত", en: "Completed" },
  "match.roomCode": { bn: "Ludo King রুম কোড", en: "Ludo King Room Code" },
  "match.roomLocked": { bn: "রুম কোড সুরক্ষিত (লকড)", en: "Room Code Locked" },
  "match.depositToUnlock": { bn: "রুম কোড দেখতে প্রথমে প্রবেশ ফি দিয়ে জয়েন করুন", en: "Deposit & join match to unlock room code" },
  "match.needDeposit": { bn: "টাকা ডিপোজিট করুন", en: "Deposit Funds" },

  // Notice
  "notice.title": { bn: "Notice", en: "Notice" },
  "notice.club": { bn: "🏆 Ludo Best Club 🏆", en: "🏆 Ludo Best Club 🏆" },
  "notice.warningTitle": { bn: "🚫 সতর্কতা:", en: "🚫 Warning:" },
  "notice.warning": {
    bn: "ম্যাচ চলাকালীন অপোনেন্টের সাথে খারাপ ব্যবহার বা গালাগালি করলে ১০০ টাকা জরিমানা ও অ্যাকাউন্ট ব্যান করা হবে!",
    en: "Misbehavior or abusive language towards opponents during a match will result in a 100 Coin fine & permanent account ban!"
  },
  "notice.rulesHeader": { bn: "📌 খেলার নিয়মাবলী:", en: "📌 Match Rules:" },
  "notice.limit": {
    bn: "🚫 লিমিট: জয়েন করার আগে Ludo King-এর ডেইলি লিমিট চেক করুন। লিমিট সমস্যার দায় আপনার।",
    en: "🚫 Limit: Check your Ludo King daily game limit before joining. Limit issues are the player's responsibility."
  },
  "notice.nameMatch": {
    bn: "🆔 নামের মিল: Ludo King এবং Ludo Best Club-এ নাম সেম থাকতে হবে। মিল থাকলে স্ক্রিনশট দিলেই সাথে সাথে Winning পাবেন।",
    en: "🆔 Name Match: Your in-game name in Ludo King and Ludo Best Club must match. Matches receive instant winning credit upon proof upload."
  },
  "notice.timeOver": {
    bn: "⏱️ টাইম ওভার: রুম আইডি দেওয়ার ৪-৫ মিনিটের মধ্যে অপোনেন্ট না আসলে রুম এ বসে থাকা অবস্থায় স্ক্রিনসট দিন। অবশ্যই রুম কোড দেয়ার পর ৫ মিনিটের মধ্যে জানাতে হবে ও ম্যাচ নাম্বার বলতে হবে , নয়তো পরে জানালে গ্রহণযোগ্য নয়।",
    en: "⏱️ Timeout: If opponent doesn't join within 4-5 mins of room code creation, take a screenshot sitting in the room. You must report within 5 minutes with match number; late reports will not be accepted."
  },
  "notice.support": {
    bn: "🟢 আমাদের ২৪ ঘণ্টা সার্ভিস চালু থাকে। সবার জন্য শুভকামনা, ভালো খেলা হোক! 🎲 🔥",
    en: "🟢 Our support service operates 24/7. Best wishes to everyone, have a great game! 🎲 🔥"
  },

  // Landing Page
  "hero.badge": {
    bn: "বাংলাদেশের সবচেয়ে বিশ্বস্ত লুডো টুর্নামেন্ট প্ল্যাটফর্ম",
    en: "Bangladesh's Most Trusted Ludo Tournament Platform"
  },
  "hero.title1": { bn: "রিয়েল প্লেয়ারদের সাথে ", en: "Play Competitive Ludo with " },
  "hero.titleHighlight": { bn: "প্রতিযোগিতামূলক লুডো", en: "Real Players & Win" },
  "hero.title2": { bn: " ম্যাচ খেলুন", en: " Instant Cash" },
  "hero.desc": {
    bn: "দ্রুত ম্যাচমেকিং, ১০০% ফেয়ার প্লে অ্যান্টি-চিট এবং বিকাশ, নগদ ও রকেটে তাত্ক্ষণিক উইথড্র সুবিধা। সেরা লুডো অভিজ্ঞতা এখন আপনার হাতের মুঠোয়।",
    en: "Instant matchmaking, 100% fair play anti-cheat, and rapid bKash, Nagad & Rocket withdrawals. Premium esports Ludo at your fingertips."
  },
  "hero.statPlayers": { bn: "সক্রিয় খেলোয়াড়", en: "Active Players" },
  "hero.statPrize": { bn: "পুরস্কার বিতরণ", en: "Total Distributed" },
  "hero.statFair": { bn: "নিরাপদ ও ফেয়ার", en: "Safe & Fair Play" },

  // Ticker
  "ticker.label": { bn: "নোটিশ:", en: "Notice:" },
  "ticker.default": {
    bn: "ম্যাচ চলাকালীন অপোনেন্টের সাথে খারাপ ব্যবহার বা গালাগালি করলে ১০০ টাকা জরিমানা ও একাউন্ট ব্যান হবে...",
    en: "Abusive language during matches will result in a 100 Coin fine and account ban..."
  }
};

const LanguageContext = createContext<LanguageContextType>({
  lang: "bn",
  setLang: () => {},
  toggleLang: () => {},
  t: (key: string, fallback?: string) => fallback || key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("bn");

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem("ludoearn_lang") as Language;
      if (savedLang === "en" || savedLang === "bn") {
        setLangState(savedLang);
      }
    } catch {
      // Ignore localStorage issues
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem("ludoearn_lang", newLang);
    } catch {
      // Ignore
    }
  };

  const toggleLang = () => {
    setLang(lang === "bn" ? "en" : "bn");
  };

  const t = (key: string, fallback?: string): string => {
    const item = translations[key];
    if (!item) return fallback !== undefined ? fallback : key;
    return item[lang] || item["bn"] || fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
