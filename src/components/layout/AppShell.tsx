"use client";

import React from "react";
import AppBar from "./AppBar";
import BottomNav from "./BottomNav";
import { useUser } from "../common/UserContext";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  showNav?: boolean;
}

export default function AppShell({
  children,
  title,
  showBack,
  showNav = true,
}: AppShellProps) {
  const { user } = useUser();
  const totalBalance = user ? (user.mainBalance || 0) + (user.winBalance || 0) : 0;

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col justify-between max-w-md mx-auto relative border-x border-slate-900/80 shadow-2xl">
      <AppBar title={title} showBack={showBack} userBalance={totalBalance} />

      <main className="flex-1 w-full pb-20 overflow-y-auto">
        {children}
      </main>

      {showNav && <BottomNav />}
    </div>
  );
}
