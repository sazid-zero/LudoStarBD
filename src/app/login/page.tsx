"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, Phone, ArrowRight, ShieldCheck } from "lucide-react";
import { useToast } from "@/components/common/ToastContext";
import { useUser } from "@/components/common/UserContext";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const { showToast } = useToast();
  const { setUser, refreshUser } = useUser();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    let isMounted = true;
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store", credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.user && isMounted) {
          const userRole = data.user.role;
          if (redirectParam && redirectParam.startsWith("/")) {
            if (redirectParam.startsWith("/admin") && userRole !== "ADMIN") {
              window.location.href = "/dashboard";
            } else {
              window.location.href = redirectParam;
            }
          } else if (userRole === "ADMIN") {
            window.location.href = "/admin";
          } else {
            window.location.href = "/dashboard";
          }
        }
      } catch {}
    };
    checkAuth();
    return () => {
      isMounted = false;
    };
  }, [redirectParam]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) {
      showToast("মোবাইল নম্বর ও পাসওয়ার্ড দিন", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "লগইন ব্যর্থ হয়েছে");
      }

      if (data.user) {
        setUser(data.user);
      }
      await refreshUser();

      const userRole = data.user?.role;
      try {
        if (userRole !== "ADMIN") {
          sessionStorage.setItem("show_login_notice", "true");
        } else {
          sessionStorage.removeItem("show_login_notice");
          sessionStorage.setItem("ludoearn_notice_seen_v2", "true");
        }
      } catch {}

      let targetUrl = "/dashboard";

      if (redirectParam && redirectParam.startsWith("/")) {
        if (redirectParam.startsWith("/admin") && userRole !== "ADMIN") {
          targetUrl = "/dashboard";
        } else {
          targetUrl = redirectParam;
        }
      } else if (userRole === "ADMIN") {
        targetUrl = "/admin";
      }

      window.location.href = targetUrl;
    } catch (err: any) {
      showToast(err.message || "সমস্যা হয়েছে", "error");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B132B] flex flex-col justify-center max-w-md mx-auto px-5 py-8">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 p-1 mx-auto mb-3 shadow-xl flex items-center justify-center overflow-hidden">
          <Image src="/logo.png" alt="LudoEarn" width={56} height={56} className="object-contain w-full h-full rounded-xl" />
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          LUDO <span className="text-[#00D2D3]">EARN</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-medium">
          বাংলাদেশের বিশ্বস্ত লুডো আর্নিং প্ল্যাটফর্ম
        </p>
      </div>

      {/* Form Card (Crisp White with Soft Shadow) */}
      <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 text-slate-900">
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Phone */}
          <div>
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1.5">
              মোবাইল নম্বর
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0070F3] focus:ring-2 focus:ring-[#0070F3]/20 font-mono transition-all"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1.5">
              পাসওয়ার্ড
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-11 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0070F3] focus:ring-2 focus:ring-[#0070F3]/20 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember me & Quick Links */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-100 border-slate-300 text-[#0070F3] focus:ring-0"
              />
              <span>আমাকে মনে রাখুন</span>
            </label>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#0070F3] hover:bg-blue-600 text-white font-black text-sm shadow-md shadow-blue-500/25 active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span>{loading ? "লগইন হচ্ছে..." : "লগইন করুন"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Logins */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <span className="text-[11px] text-slate-500 font-semibold block text-center mb-2">
            দ্রুত ডেমো লগইন:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setPhone("01711111111");
                setPassword("user123456");
              }}
              className="py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 text-center transition-colors"
            >
              প্লেয়ার একাউন্ট
            </button>
            <button
              type="button"
              onClick={() => {
                setPhone("01700000000");
                setPassword("admin123");
              }}
              className="py-2 px-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-xs font-bold text-[#FFB703] border border-amber-200 text-center transition-colors"
            >
              এডমিন একাউন্ট
            </button>
          </div>
        </div>
      </div>

      {/* Switch to Signup */}
      <div className="text-center mt-6">
        <p className="text-xs text-slate-400">
          নতুন একাউন্ট খুলতে চান?{" "}
          <Link href="/register" className="font-bold text-[#00D2D3] hover:underline">
            এখানে রেজিস্ট্রেশন করুন
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">লোড হচ্ছে...</div>}>
      <LoginForm />
    </Suspense>
  );
}
