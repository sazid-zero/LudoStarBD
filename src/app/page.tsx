"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Download,
  Smartphone,
  ShieldCheck,
  Zap,
  Trophy,
  Users,
  Headphones,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Facebook,
  Mail,
  Phone,
  Gamepad2,
  Sparkles,
  Play,
  ExternalLink,
} from "lucide-react";
import { useLanguage } from "@/components/common/LanguageContext";
import LanguageToggle from "@/components/common/LanguageToggle";
import { getYoutubeEmbedUrl, getYoutubeWatchUrl } from "@/lib/youtube";

function GooglePlayIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3.609 1.813a1.5 1.5 0 0 0-.359 1.031v18.312a1.5 1.5 0 0 0 .359 1.031l9.969-10.187L3.609 1.813z"
        fill="#2196F3"
      />
      <path
        d="M17.438 9.938l-3.859 2.062-3.61-3.687 7.469 1.625z"
        fill="#FFC107"
      />
      <path
        d="M3.609 1.813l9.969 10.187 3.86-2.063L6.594.469a2.03 2.03 0 0 0-2.985 1.344z"
        fill="#4CAF50"
      />
      <path
        d="M13.578 12l-9.969 10.188c.844.75 2.156.718 2.984.187l10.844-5.813-3.859-4.562z"
        fill="#F44336"
      />
    </svg>
  );
}

export default function LandingPage() {
  const { lang, t } = useLanguage();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [homeVideoUrl, setHomeVideoUrl] = useState("https://www.youtube.com/watch?v=Y7VWtTgX0Rc");

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((d) => {
        if (d?.settings?.video_homepage) {
          setHomeVideoUrl(d.settings.video_homepage);
        }
      })
      .catch((err) => console.error("Error loading home video:", err));
  }, []);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const banners = [
    {
      image: "/uploads/proofs/banner1.png",
      badgeBn: "দৈনিক টুর্নামেন্ট",
      badgeEn: "Daily Tournaments",
      titleBn: "খেলুন লুডো, জিতে নিন আকর্ষণীয় ক্যাশ পুরস্কার",
      titleEn: "Play Ludo & Win Real Cash Prizes Daily",
      subBn: "ইনস্ট্যান্ট বিকাশ ও নগদ উইথড্র সুবিধা ২৪/৭",
      subEn: "Instant bKash & Nagad withdrawal 24/7",
      ctaBn: "ম্যাচে অংশ নিন",
      ctaEn: "Join Matches",
      bg: "from-cyan-500/25 via-[#070D1E] to-[#030712]",
    },
    {
      image: "/uploads/proofs/banner2.png",
      badgeBn: "১০০% নিরাপদ প্ল্যাটফর্ম",
      badgeEn: "100% Secure Platform",
      titleBn: "ফেয়ার প্লে অ্যান্টি-চিট ও দ্রুত বিরোধ নিষ্পত্তি",
      titleEn: "Fair Play Anti-Cheat & Fast Dispute Resolution",
      subBn: "হাজারো রিয়েল প্লেয়ারের সাথে সরাসরি টুর্নামেন্ট",
      subEn: "Compete with verified real players in live rooms",
      ctaBn: "এখনই শুরু করুন",
      ctaEn: "Get Started Now",
      bg: "from-emerald-500/20 via-[#070D1E] to-[#030712]",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIdx((prev) => (prev + 1) % banners.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [banners.length]);

  const features = [
    {
      icon: Zap,
      title: lang === "en" ? "Instant Matchmaking" : "দ্রুত ম্যাচমেকিং",
      desc:
        lang === "en"
          ? "Find real opponents matching your skill level in seconds. Zero waiting time!"
          : "কয়েক সেকেন্ডের মধ্যে আপনার স্কিল লেভেলের রিয়েল প্রতিপক্ষ খুঁজে পান। কোনো অপেক্ষা নেই!",
      color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/25",
    },
    {
      icon: ShieldCheck,
      title: lang === "en" ? "Fair Play & Anti-Cheat" : "ফেয়ার প্লে ও অ্যান্টি-চিট",
      desc:
        lang === "en"
          ? "Strict screenshot verification and robust anti-cheat protocol. No bots or fakes."
          : "স্ক্রিনশট ভেরিফিকেশন ও শক্তিশালী অ্যান্টি-চিট সিস্টেম। কোনো বট বা ভুয়া প্লেয়ার নেই।",
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      icon: Trophy,
      title: lang === "en" ? "Instant Cashouts" : "তাত্ক্ষণিক ক্যাশআউট",
      desc:
        lang === "en"
          ? "Withdraw match winnings instantly directly to bKash, Nagad, or Rocket."
          : "ম্যাচ জয়ের সাথে সাথেই বিকাশ, নগদ অথবা রকেটে উইনিং টাকা উইথড্র করার সুযোগ।",
      color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    },
    {
      icon: Headphones,
      title: lang === "en" ? "24/7 Dedicated Support" : "২৪/৭ লাইভ সাপোর্ট",
      desc:
        lang === "en"
          ? "Our dedicated support team is active on WhatsApp and Telegram to resolve queries."
          : "যেকোনো সমস্যা বা বিরোধ নিষ্পত্তিতে আমাদের ডেডিকেটেড টিম সবসময় টেলিগ্রাম ও হোয়াটসঅ্যাপে সক্রিয়।",
      color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    },
  ];

  const faqs = [
    {
      q: lang === "en" ? "How do I play Ludo on LudoStar BD?" : "কীভাবে LudoStar BD-তে লুডো খেলবো?",
      a:
        lang === "en"
          ? "First create a free account. Deposit funds to your wallet, then join a match with your desired entry fee. Copy the room code from your match lobby, open Ludo King, select 'Play with Friends', paste the room code, and play!"
          : "প্রথমে একটি ফ্রি একাউন্ট খুলুন। ওয়ালেটে টাকা জমা করে পছন্দের এন্ট্রি ফি-র ম্যাচে জয়েন করুন। ম্যাচ রুমে প্রদত্ত Ludo King রুম কোডটি কপি করে Ludo King অ্যাপে 'Play with Friends' এ প্রবেশ করে কোড পেস্ট করে খেলুন।",
    },
    {
      q: lang === "en" ? "How do I receive my prize money after winning?" : "ম্যাচ শেষে জয়ের টাকা কীভাবে পাবো?",
      a:
        lang === "en"
          ? "Take a full-screen screenshot of the victory screen right after the match finishes. Return to LudoStar BD's match room, choose 'I Won', and upload your screenshot. Upon instant verification, prize funds are credited to your Winning Balance for immediate cashout."
          : "ম্যাচ জয়ের পর শেষ মুহূর্তের ফুল স্ক্রিনশট তুলুন। LudoStar BD-তে ম্যাচ রুমে এসে 'আমি জিতেছি' অপশনে স্ক্রিনশট আপলোড করুন। ভেরিফিকেশনের সাথে সাথেই টাকা আপনার উইনিং ব্যালেন্সে যোগ হবে এবং আপনি সরাসরি বিকাশ/নগদে ক্যাশআউট করতে পারবেন।",
    },
    {
      q: lang === "en" ? "How long does withdrawal take?" : "উইথড্র করতে কত সময় লাগে?",
      a:
        lang === "en"
          ? "Withdrawal requests are processed rapidly, usually within 5 to 30 minutes to your verified bKash, Nagad, or Rocket account."
          : "সাধারণত উইথড্র রিকোয়েস্ট করার ৫ থেকে ৩০ মিনিটের মধ্যে বিকাশ, নগদ বা রকেটের মাধ্যমে টাকা পাঠিয়ে দেওয়া হয়।",
    },
    {
      q: lang === "en" ? "What happens if a player cheats or submits a fake screenshot?" : "কোনো খেলোয়াড় প্রতারণা করলে কী হবে?",
      a:
        lang === "en"
          ? "We enforce zero-tolerance anti-cheat policies. Submitting false claims or fake screenshots results in a ৳100 penalty, permanent account ban, and the legitimate winner receives the full prize."
          : "আমাদের শক্তিশালী অ্যান্টি-চিট নিয়মাবলী রয়েছে। কেউ ভুল রেজাল্ট বা ভুয়া স্ক্রিনশট দিলে তার একাউন্ট স্থায়ীভাবে ব্যান করা হয় এবং সঠিক বিজয়ীকে পুরস্কার দেওয়া হয়।",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B132B] text-slate-100 flex flex-col selection:bg-[#00D2D3] selection:text-slate-950">
      {/* 4-Color Signature Rail */}
      <div className="token-rail" />

      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-[#0B132B]/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-black/40 border border-amber-400/40 p-0.5 flex items-center justify-center overflow-hidden shadow-md shadow-amber-500/10">
              <Image src="/newlogo.png" alt="LudoStar BD" width={40} height={40} className="object-contain w-full h-full" priority />
            </div>
            <span className="text-xl font-black tracking-tight text-white">
              LudoStar <span className="text-amber-400">BD</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-300">
            <a href="#features" className="hover:text-[#00D2D3] transition-colors">
              {lang === "en" ? "Features" : "সুবিধা"}
            </a>
            <a href="#how-it-works" className="hover:text-[#00D2D3] transition-colors">
              {lang === "en" ? "How it Works" : "কীভাবে খেলে"}
            </a>
            <a href="#faq" className="hover:text-[#00D2D3] transition-colors">
              {lang === "en" ? "FAQ" : "প্রশ্নোত্তর"}
            </a>
            <Link href="/rules" className="hover:text-[#00D2D3] transition-colors">
              {lang === "en" ? "Rules" : "নিয়মাবলী"}
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageToggle />

            <Link
              href="/login"
              className="text-xs md:text-sm font-bold px-3.5 py-2 rounded-xl text-slate-200 hover:text-white bg-slate-800/80 border border-slate-700 hover:border-slate-600 transition-all"
            >
              {lang === "en" ? "Login" : "লগইন"}
            </Link>
            <Link
              href="/dashboard"
              className="text-xs md:text-sm font-black px-4 py-2 rounded-xl bg-[#0070F3] hover:bg-blue-600 text-white shadow-md shadow-blue-500/25 transition-all active:scale-95"
            >
              {lang === "en" ? "Play Now" : "সরাসরি খেলুন"}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-10 pb-12 md:pt-16 md:pb-16 overflow-hidden">
        {/* Background glow meshes */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-500/15 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[450px] h-[320px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700 text-xs font-bold text-[#00D2D3] mb-6 shadow-sm">
            <span className="live-dot" />
            <span>{t("hero.badge")}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight md:leading-tight mb-5 text-white">
            {t("hero.title1")}
            <span className="text-[#00D2D3]">
              {t("hero.titleHighlight")}
            </span>
            {t("hero.title2")}
          </h1>

          <p className="text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed font-normal">
            {t("hero.desc")}
          </p>

          <div className="flex flex-col items-center justify-center gap-3.5 max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full">
              <Link
                href="/dashboard"
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#0070F3] hover:bg-blue-600 text-white font-black text-sm shadow-xl shadow-blue-500/25 active:scale-95 transition-all"
              >
                <Smartphone className="w-5 h-5 text-cyan-200" />
                <span>{t("btn.playWeb")}</span>
              </Link>

              {/* Ludo King Google Play Download Button */}
              <a
                href="https://play.google.com/store/apps/details?id=com.ludo.king"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-2xl bg-slate-900/95 hover:bg-slate-800 text-white border border-emerald-500/40 hover:border-emerald-400 shadow-lg shadow-emerald-500/10 active:scale-95 transition-all group"
                title="Download Ludo King on Google Play"
              >
                <GooglePlayIcon className="w-6 h-6 flex-shrink-0" />
                <div className="text-left">
                  <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-semibold leading-none">
                    GET IT ON
                  </span>
                  <span className="block text-xs font-black text-white group-hover:text-emerald-300 leading-tight">
                    Ludo King
                  </span>
                </div>
              </a>

              {/* Ludo World Google Play Download Button */}
              <a
                href="https://play.google.com/store/apps/details?id=com.tencent.ludosuperstar&pcampaignid=web_share"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-2xl bg-slate-900/95 hover:bg-slate-800 text-white border border-cyan-500/40 hover:border-cyan-400 shadow-lg shadow-cyan-500/10 active:scale-95 transition-all group"
                title="Download Ludo World on Google Play"
              >
                <GooglePlayIcon className="w-6 h-6 flex-shrink-0" />
                <div className="text-left">
                  <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-semibold leading-none">
                    GET IT ON
                  </span>
                  <span className="block text-xs font-black text-white group-hover:text-cyan-300 leading-tight">
                    Ludo World
                  </span>
                </div>
              </a>
            </div>
          </div>

          {/* Social proof stats */}
          <div className="grid grid-cols-3 gap-3 max-w-xl mx-auto mt-10 pt-7 border-t border-slate-800/80">
            <div>
              <span className="block text-2xl sm:text-3xl font-extrabold text-cyan-400 font-mono">৫০,০০০+</span>
              <span className="text-xs text-slate-400 font-medium">{t("hero.statPlayers")}</span>
            </div>
            <div>
              <span className="block text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">🪙 ২৫ লক্ষ+</span>
              <span className="text-xs text-slate-400 font-medium">{t("hero.statPrize")}</span>
            </div>
            <div>
              <span className="block text-2xl sm:text-3xl font-extrabold text-cyan-300 font-mono">১০০%</span>
              <span className="text-xs text-slate-400 font-medium">{t("hero.statFair")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Grand Tournament Showcase Banner Carousel */}
      <section className="max-w-5xl mx-auto px-4 mb-14 relative z-20 w-full">
        <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-cyan-500/30 bg-[#070D1E] aspect-[16/8] sm:aspect-[16/6] md:aspect-[21/8]">
          {banners.map((b, i) => (
            <div
              key={i}
              className={`absolute inset-0 flex items-center justify-between p-5 sm:p-8 bg-gradient-to-r ${b.bg} transition-opacity duration-700 overflow-hidden ${
                bannerIdx === i ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              {/* Photo from uploads/proofs */}
              <div className="absolute right-0 top-0 bottom-0 w-1/2 sm:w-2/5 overflow-hidden">
                <Image
                  src={b.image}
                  alt={lang === "en" ? b.titleEn : b.titleBn}
                  fill
                  sizes="(max-width: 640px) 240px, 480px"
                  className="object-cover object-top opacity-90 transition-transform duration-1000 scale-105"
                  priority={i === 0}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#070D1E] via-[#070D1E]/60 to-transparent" />
              </div>

              {/* Text content */}
              <div className="relative z-10 max-w-sm sm:max-w-lg space-y-2 sm:space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[10px] sm:text-xs font-black uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{lang === "en" ? b.badgeEn : b.badgeBn}</span>
                </div>
                <h2 className="text-lg sm:text-3xl font-black text-white leading-tight drop-shadow-md">
                  {lang === "en" ? b.titleEn : b.titleBn}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 font-medium line-clamp-2">
                  {lang === "en" ? b.subEn : b.subBn}
                </p>
                <div className="pt-2">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-cyan-500/25 active:scale-95 transition-all"
                  >
                    <span>{lang === "en" ? b.ctaEn : b.ctaBn}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {/* Dots Indicator */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setBannerIdx(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  bannerIdx === i ? "w-7 bg-cyan-400" : "w-2 bg-slate-600/70 hover:bg-slate-500"
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>

          {/* Prev/Next arrows on desktop */}
          <button
            onClick={() => setBannerIdx((prev) => (prev - 1 + banners.length) % banners.length)}
            className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-950/70 hover:bg-slate-900 border border-slate-700/80 items-center justify-center text-white transition-all active:scale-90"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setBannerIdx((prev) => (prev + 1) % banners.length)}
            className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-950/70 hover:bg-slate-900 border border-slate-700/80 items-center justify-center text-white transition-all active:scale-90"
            aria-label="Next slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-[#0E1A38] border-y border-slate-800 relative">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-black text-[#00D2D3] uppercase tracking-widest block mb-2">
              {lang === "en" ? "Why LudoStar BD?" : "কেন LudoStar BD সেরা?"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              {lang === "en" ? "Exclusive Features & Elite Gaming" : "অনন্য ফিচার ও চমৎকার গেমিং অভিজ্ঞতা"}
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="p-5 rounded-3xl bg-white text-slate-900 border border-slate-100 hover:shadow-xl transition-all hover:-translate-y-1 shadow-md"
                >
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-4 ${f.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-black text-slate-900 mb-1.5">{f.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-normal">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 relative">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block mb-2">
              {lang === "en" ? "Easy 3 Steps" : "সহজ ৩টি ধাপ"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              {lang === "en" ? "How to Start Your Journey?" : "কীভাবে শুরু করবেন আপনার লুডো যাত্রা?"}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-white text-slate-900 border border-slate-100 text-center relative shadow-md">
              <div className="w-10 h-10 rounded-2xl bg-[#0070F3] text-white font-black flex items-center justify-center mx-auto mb-4 text-sm shadow-md">
                1
              </div>
              <h3 className="text-base font-black text-slate-900 mb-2">
                {lang === "en" ? "Account & Deposit" : "একাউন্ট ও ডিপোজিট"}
              </h3>
              <p className="text-xs text-slate-500 font-normal leading-relaxed">
                {lang === "en"
                  ? "Register with your phone number and deposit funds securely via bKash, Nagad, or Rocket."
                  : "মোবাইল নম্বর দিয়ে রেজিস্ট্রেশন করুন। বিকাশ বা নগদে সহজে খেলার ব্যালেন্স জমা দিন।"}
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white text-slate-900 border border-slate-100 text-center relative shadow-md">
              <div className="w-10 h-10 rounded-2xl bg-[#00D06C] text-white font-black flex items-center justify-center mx-auto mb-4 text-sm shadow-md">
                2
              </div>
              <h3 className="text-base font-black text-slate-900 mb-2">
                {lang === "en" ? "Join Match & Play" : "ম্যাচে যোগ দিন ও খেলুন"}
              </h3>
              <p className="text-xs text-slate-500 font-normal leading-relaxed">
                {lang === "en"
                  ? "Pick your preferred entry fee, copy the room code, and challenge your opponent in Ludo King."
                  : "পছন্দের এন্ট্রি ফি বেছে নিন। Ludo King অ্যাপে গিয়ে রুম কোড দিয়ে প্রতিপক্ষের বিরুদ্ধে খেলুন।"}
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white text-slate-900 border border-slate-100 text-center relative shadow-md">
              <div className="w-10 h-10 rounded-2xl bg-[#FFB703] text-white font-black flex items-center justify-center mx-auto mb-4 text-sm shadow-md">
                3
              </div>
              <h3 className="text-base font-black text-slate-900 mb-2">
                {lang === "en" ? "Upload Proof & Cashout" : "উইনিং স্ক্রিনশট ও ক্যাশআউট"}
              </h3>
              <p className="text-xs text-slate-500 font-normal leading-relaxed">
                {lang === "en"
                  ? "Upload victory screenshot and withdraw your winnings straight into your wallet within minutes."
                  : "জয়ের স্ক্রিনশট আপলোড করুন এবং তাৎক্ষণিকভাবে আপনার বিকাশ/নগদ একাউন্টে টাকা তুলে নিন।"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Video Tutorial Section */}
      <section id="video-tutorial" className="py-16 bg-[#070D1E] border-y border-cyan-500/20 relative">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-black text-cyan-400 uppercase tracking-widest block mb-2">
              {lang === "en" ? "Watch Video Guide" : "ভিডিও গাইড"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              {lang === "en" ? "How to Play & Win Cash on LudoStar BD" : "কীভাবে খেলবেন এবং জিতে নেবেন ক্যাশ টাকা"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              {lang === "en"
                ? "Watch our quick video tutorial to learn how to join matches, get Ludo King room codes, and cash out prizes."
                : "মাত্র ১ মিনিটের ভিডিও টিউটোরিয়াল দেখে সহজেই জেনে নিন কীভাবে ম্যাচে যোগ দেবেন, রুম কোড বসাবেন এবং টাকা তুলবেন।"}
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-center">
            {/* Video Player */}
            <div className="lg:col-span-7">
              <div className="relative rounded-3xl overflow-hidden bg-black border-2 border-cyan-500/40 shadow-2xl shadow-cyan-500/20 aspect-video">
                <iframe
                  className="w-full h-full"
                  src={getYoutubeEmbedUrl(homeVideoUrl)}
                  title="How to play LudoStar BD - Official Tutorial"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              <div className="flex items-center justify-between mt-3 px-1 text-xs">
                <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 fill-cyan-400" />
                  <span>অফিশিয়াল ভিডিও টিউটোরিয়াল</span>
                </span>
                <a
                  href={getYoutubeWatchUrl(homeVideoUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-white flex items-center gap-1 font-semibold hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>YouTube-এ ওপেন করুন</span>
                </a>
              </div>
            </div>

            {/* Quick Steps Highlights */}
            <div className="lg:col-span-5 space-y-3.5">
              <div className="p-4 rounded-2xl bg-[#0D1527] border border-cyan-500/20 hover:border-cyan-500/40 transition-all flex items-start gap-3 shadow-md">
                <span className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-400 font-black flex items-center justify-center text-xs flex-shrink-0">
                  ১
                </span>
                <div>
                  <h4 className="text-sm font-bold text-white">পছন্দের ম্যাচে জয়েন করুন</h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    আপনার সুবিধাজনক এন্ট্রি ফি (যেমন: 🪙৫০, 🪙১০০, 🪙২০০০ Coins) সিলেক্ট করে ম্যাচে অংশ নিন।
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0D1527] border border-cyan-500/20 hover:border-cyan-500/40 transition-all flex items-start gap-3 shadow-md">
                <span className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 font-black flex items-center justify-center text-xs flex-shrink-0">
                  ২
                </span>
                <div className="w-full">
                  <h4 className="text-sm font-bold text-white">Ludo King / World-এ কোড দিয়ে খেলুন</h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    ওয়েবসাইটে দেওয়া রুম কোডটি কপি করে অ্যাপে জয়েন করে খেলুন।
                  </p>
                  {/* Direct download links */}
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800">
                    <a
                      href="https://play.google.com/store/apps/details?id=com.ludo.king"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-[11px] font-bold text-emerald-300 transition-all"
                    >
                      <GooglePlayIcon className="w-3.5 h-3.5" />
                      <span>Ludo King</span>
                    </a>
                    <a
                      href="https://play.google.com/store/apps/details?id=com.tencent.ludosuperstar&pcampaignid=web_share"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-[11px] font-bold text-cyan-300 transition-all"
                    >
                      <GooglePlayIcon className="w-3.5 h-3.5" />
                      <span>Ludo World</span>
                    </a>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0D1527] border border-cyan-500/20 hover:border-cyan-500/40 transition-all flex items-start gap-3 shadow-md">
                <span className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center text-xs flex-shrink-0">
                  ৩
                </span>
                <div>
                  <h4 className="text-sm font-bold text-white">উইনিং স্ক্রিনশট ও ইনস্ট্যান্ট ক্যাশআউট</h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    বিজয়ী হলে স্ক্রিনশট আপলোড করুন এবং জিতে নেওয়া টাকা সরাসরি বিকাশ ও নগদে উইথড্র করে নিন।
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/dashboard"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs text-center flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 active:scale-95 transition-all"
                >
                  <Gamepad2 className="w-4 h-4" />
                  <span>এখনই ম্যাচ খেলা শুরু করুন</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Download APK Section - commented out as requested */}
      {/*
      <section id="download" className="py-12 px-4">
        <div className="max-w-4xl mx-auto p-8 rounded-3xl bg-gradient-to-br from-[#1C2541] to-[#0B132B] border border-slate-800 text-center relative overflow-hidden shadow-2xl">
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
              {lang === "en" ? "Download Mobile App" : "মোবাইল অ্যাপ ডাউনলোড করুন"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto mb-6">
              {lang === "en"
                ? "Download our official Android APK for ultra-low latency, real-time push notifications and smooth gaming."
                : "দ্রুততম নোটিফিকেশন ও স্মুথ পারফরম্যান্সের জন্য আমাদের অফিশিয়াল Android APK ডাউনলোড করুন।"}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="/LudoEarn.apk"
                download
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#00D06C] hover:bg-emerald-500 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
              >
                <Download className="w-5 h-5" />
                <span>{lang === "en" ? "Download Android APK (v2.4)" : "Android APK ডাউনলোড (v2.4)"}</span>
              </a>

              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-black text-sm active:scale-95 transition-all shadow-sm"
              >
                <span>{lang === "en" ? "Play in Browser" : "আইফোনে / ব্রাউজারে খেলুন"}</span>
                <ArrowRight className="w-4 h-4 text-[#0070F3]" />
              </Link>
            </div>
          </div>
        </div>
      </section>
      */}

      {/* FAQ Section */}
      <section id="faq" className="py-16 max-w-3xl mx-auto px-4">
        <div className="text-center mb-10">
          <span className="text-xs font-black text-[#00D2D3] uppercase tracking-widest block mb-2">
            {lang === "en" ? "Questions & Answers" : "প্রশ্নোত্তর"}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            {lang === "en" ? "Frequently Asked Questions" : "সচরাচর জিজ্ঞাসিত প্রশ্নসমূহ"}
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-2xl bg-white border border-slate-100 overflow-hidden shadow-sm transition-all"
            >
              <button
                onClick={() => toggleFaq(i)}
                className="w-full flex items-center justify-between p-4 text-left font-black text-sm text-slate-900"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    openFaq === i ? "rotate-180 text-[#0070F3]" : ""
                  }`}
                />
              </button>
              {openFaq === i && (
                <div className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 font-normal">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-[#030712] border-t border-cyan-500/15 pt-10 pb-8 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-8 text-xs">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-black/40 border border-amber-400/40 p-0.5 flex items-center justify-center overflow-hidden shadow-md shadow-amber-500/10">
                <Image src="/newlogo.png" alt="LudoStar BD" width={32} height={32} className="object-contain w-full h-full" />
              </div>
              <span className="font-extrabold text-sm text-white">LudoStar <span className="text-amber-400">BD</span></span>
            </div>
            <p className="text-slate-400 leading-relaxed mb-3">
              {lang === "en"
                ? "Bangladesh's fastest and most trusted online Ludo tournament & earning platform."
                : "বাংলাদেশের বিশ্বস্ত ও দ্রুততম অনলাইন লুডো টুর্নামেন্ট ও আর্নিং প্ল্যাটফর্ম।"}
            </p>
            <div className="p-2.5 rounded-xl bg-[#0B152B] border border-[#182A52] space-y-1 text-[11px]">
              <div className="text-cyan-400 font-bold">
                {lang === "en" ? "Deposit & Withdrawal Hotline:" : "ডিপোজিট ও উইথড্র (বিকাশ, নগদ, রকেট):"}
              </div>
              <div className="font-mono text-emerald-400 font-bold text-xs">01342968557</div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3 uppercase tracking-wider">
              {lang === "en" ? "Quick Links" : "দ্রুত লিংক"}
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li><Link href="/dashboard" className="hover:text-cyan-400">{lang === "en" ? "Dashboard" : "গেমিং ড্যাশবোর্ড"}</Link></li>
              <li><Link href="/matches" className="hover:text-cyan-400">{lang === "en" ? "Match Arena" : "ম্যাচ এরিনা"}</Link></li>
              <li><Link href="/leaderboard" className="hover:text-cyan-400">{lang === "en" ? "Leaderboard" : "লিডারবোর্ড"}</Link></li>
              <li><Link href="/wallet" className="hover:text-cyan-400">{lang === "en" ? "Wallet & Cashout" : "ওয়ালেট ও উইথড্র"}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3 uppercase tracking-wider">
              {lang === "en" ? "Help & Rules" : "সহায়তা ও নিয়ম"}
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li><Link href="/rules" className="hover:text-cyan-400">{lang === "en" ? "Rules" : "খেলার নিয়মাবলী"}</Link></li>
              <li><a href="https://t.me/mr_rolex42" target="_blank" rel="noreferrer" className="hover:text-cyan-400">Telegram: @mr_rolex42</a></li>
              <li><a href="https://wa.me/8801342968557" target="_blank" rel="noreferrer" className="hover:text-cyan-400">WhatsApp: 01342968557</a></li>
              <li><a href="tel:01321063123" className="hover:text-cyan-400">{lang === "en" ? "Helpline" : "হেল্পলাইন"}: 01321063123</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-3 uppercase tracking-wider">
              {lang === "en" ? "Connect" : "যোগাযোগ ও সোশ্যাল"}
            </h4>
            <div className="flex flex-wrap gap-2 mb-3">
              <a
                href="https://www.facebook.com/share/1Eco5f183E/"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-400 hover:bg-slate-850 transition-colors"
                title="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://t.me/mr_rolex42"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 hover:bg-slate-850 transition-colors"
                title="Telegram"
              >
                <Smartphone className="w-4 h-4" />
              </a>
            </div>
            <p className="text-[11px] text-slate-400">
              © {new Date().getFullYear()} LudoStar BD. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
