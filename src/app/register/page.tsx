"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Phone, User, Gift, ArrowRight } from "lucide-react";
import { useToast } from "@/components/common/ToastContext";
import { useUser } from "@/components/common/UserContext";

function RegisterForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const { setUser, refreshUser } = useUser();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [referCode, setReferCode] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      showToast("নামের প্রথম অংশ দিন", "error");
      return;
    }
    if (!phone || phone.length < 11) {
      showToast("সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন", "error");
      return;
    }
    if (!password || password.length < 6) {
      showToast("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          password,
          referCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "রেজিস্ট্রেশন ব্যর্থ হয়েছে");
      }

      showToast("একাউন্ট তৈরি সফল হয়েছে! স্বাগতম বোনাস যোগ হয়েছে।", "success");
      try {
        sessionStorage.setItem("show_login_notice", "true");
      } catch {}

      if (data.user) {
        setUser(data.user);
      }
      await refreshUser();

      window.location.href = "/dashboard";
    } catch (err: any) {
      showToast(err.message || "সমস্যা হয়েছে", "error");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B132B] flex flex-col justify-center max-w-md mx-auto px-5 py-8">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-black/40 border border-amber-400/40 p-1 mx-auto mb-2.5 shadow-xl flex items-center justify-center overflow-hidden">
          <Image src="/newlogo.png" alt="LudoStar BD" width={48} height={48} className="object-contain w-full h-full rounded-xl" />
        </div>
        <h1 className="text-xl font-black text-white tracking-tight">
          নতুন একাউন্ট তৈরি করুন
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          এক মিনিটেই যোগ দিন এবং শুরু করুন লুডো খেলা
        </p>
      </div>

      {/* Bonus Banner */}
      <div className="mb-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
        <Gift className="w-5 h-5 text-[#00D06C] flex-shrink-0" />
        <span className="text-xs text-emerald-200 font-medium">
          রেজিস্ট্রেশন করলেই পাচ্ছেন <strong className="text-[#00D06C] font-black">🪙১০ Coins ফ্রি সাইন-আপ বোনাস</strong>!
        </span>
      </div>

      {/* Form Card (Crisp White) */}
      <div className="bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 text-slate-900">
        <form onSubmit={handleRegister} className="space-y-3.5">
          {/* First & Last Name */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-black text-slate-700 uppercase block mb-1">
                নামের প্রথম অংশ
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="রাকিব"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0070F3] focus:ring-2 focus:ring-[#0070F3]/20 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-black text-slate-700 uppercase block mb-1">
                শেষ অংশ
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="হাসান"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0070F3] focus:ring-2 focus:ring-[#0070F3]/20 transition-all"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="text-[11px] font-black text-slate-700 uppercase block mb-1">
              মোবাইল নম্বর
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0070F3] focus:ring-2 focus:ring-[#0070F3]/20 font-mono transition-all"
                required
              />
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">এই নম্বর দিয়েই লগইন করবেন</span>
          </div>

          {/* Password */}
          <div>
            <label className="text-[11px] font-black text-slate-700 uppercase block mb-1">
              পাসওয়ার্ড
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="কমপক্ষে ৬ অক্ষর"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0070F3] focus:ring-2 focus:ring-[#0070F3]/20 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#0070F3] hover:bg-blue-600 text-white font-black text-sm shadow-md shadow-blue-500/25 active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            <span>{loading ? "একাউন্ট তৈরি হচ্ছে..." : "একাউন্ট খুলুন"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Switch to Login */}
      <div className="text-center mt-5">
        <p className="text-xs text-slate-400">
          ইতিমধ্যেই একাউন্ট আছে?{" "}
          <Link href="/login" className="font-bold text-[#00D2D3] hover:underline">
            লগইন করুন
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return <RegisterForm />;
}
