"use client";

import React from "react";
import AppShell from "@/components/layout/AppShell";
import { BookOpen, ShieldAlert, CheckCircle2, XCircle, PlayCircle } from "lucide-react";

export default function RulesPage() {
  return (
    <AppShell title="খেলার নিয়মাবলী">
      <div className="p-3.5 space-y-4">
        {/* Intro Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0B152B] via-[#101E3D] to-[#070D1E] border border-cyan-500/25 shadow-lg shadow-cyan-950/20">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">LudoEarn অফিসিয়াল নিয়মাবলী</h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            ম্যাচ খেলার পূর্বে সকল নিয়ম সতর্কতার সাথে পড়ুন। নিয়ম মেনে খেললে যেকোনো বিরোধে সাপোর্ট থেকে সর্বোচ্চ সহায়তা পাবেন।
          </p>
        </div>

        {/* 1. Room Code Rules */}
        <div className="p-4 rounded-2xl bg-[#0B152B] border border-[#182A52] space-y-2.5 text-xs text-slate-300">
          <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>১. রুম কোড ও ম্যাচে প্রবেশ</span>
          </h3>
          <ul className="list-disc list-inside space-y-1.5 pl-1 leading-relaxed text-slate-300">
            <li>ম্যাচ জয়েন করার পর প্রদর্শিত রুম কোডটি কপি করে ৩ মিনিটের মধ্যে Ludo King অ্যাপে প্রবেশ করুন।</li>
            <li>Ludo King-এ <strong>Play with Friends</strong> নির্বাচন করে <strong>Join</strong> ট্যাবে গিয়ে কোডটি পেস্ট করুন।</li>
            <li>যদি প্রতিপক্ষ ৩ মিনিটের মধ্যে না আসে, তবে সাপোর্ট এ যোগাযোগ করে ম্যাচ ক্যানসেল করে টাকা রিফান্ড নিতে পারবেন।</li>
          </ul>
        </div>

        {/* 2. Screenshot Proof Rules */}
        <div className="p-4 rounded-2xl bg-[#0B152B] border border-[#182A52] space-y-2.5 text-xs text-slate-300">
          <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>২. উইন স্ক্রিনশট ও প্রমাণ</span>
          </h3>
          <ul className="list-disc list-inside space-y-1.5 pl-1 leading-relaxed text-slate-300">
            <li>ম্যাচ শেষ হওয়ার সাথে সাথেই স্পষ্ট ফুল স্ক্রিনশট তুলতে হবে।</li>
            <li>স্ক্রিনশটে বিজয়ী ও পরাজিত খেলোয়াড়ের নাম এবং স্কোর স্পষ্টভাবে দেখা যেতে হবে।</li>
            <li>ক্রপ করা বা এডিট করা স্ক্রিনশট গ্রহণ করা হবে না।</li>
            <li>ম্যাচ শেষ হওয়ার সর্বোচ্চ ৫ মিনিটের মধ্যে ফলাফল জমা দিতে হবে।</li>
          </ul>
        </div>

        {/* 3. Anti-Cheat & Penalties */}
        <div className="p-4 rounded-2xl bg-red-950/30 border border-red-500/30 space-y-2.5 text-xs text-red-200">
          <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>৩. প্রতারণা ও শাস্তিমূলক ব্যবস্থা</span>
          </h3>
          <ul className="list-disc list-inside space-y-1.5 pl-1 leading-relaxed">
            <li>হেরে গিয়ে মিথ্যা "আমি জিতেছি" দাবি করলে বা অন্যের পুরোনো স্ক্রিনশট দিলে <strong>একাউন্ট স্থায়ীভাবে ব্যান</strong> করা হবে এবং সম্পূর্ণ ব্যালেন্স বাজেয়াপ্ত হবে।</li>
            <li>ইচ্ছাকৃতভাবে গেম ছেড়ে দিলে বা ডিসকানেক্ট হলে প্রতিপক্ষকে বিজয়ী ঘোষণা করা হবে।</li>
            <li>যেকোনো বিরোধ নিষ্পত্তিতে LudoEarn অ্যাডমিন টিমের সিদ্ধান্তই চূড়ান্ত বলে গণ্য হবে।</li>
          </ul>
        </div>

        {/* Video Tutorial Card */}
        <div className="p-4 rounded-2xl bg-[#0B152B] border border-[#182A52] text-center">
          <PlayCircle className="w-10 h-10 text-cyan-400 mx-auto mb-2 opacity-80" />
          <h4 className="text-sm font-bold text-white mb-1">কীভাবে খেলবেন ভিডিও গাইড</h4>
          <p className="text-xs text-slate-400 mb-3">
            সহজে বুঝতে ২ মিনিটের ভিডিও টিউটোরিয়ালটি দেখুন
          </p>
          <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
            <iframe
              src="https://www.youtube.com/embed/dQw4w9WgXcQ?controls=0"
              title="Ludo Tutorial"
              className="w-full h-full border-0 pointer-events-none opacity-40"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 p-4">
              <span className="text-xs font-bold text-cyan-400 mb-1">ভিডিও টিউটোরিয়াল</span>
              <span className="text-[11px] text-slate-300 text-center">
                Ludo King রুম কোড তৈরি ও স্ক্রিনশট আপলোড পদ্ধতি
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
