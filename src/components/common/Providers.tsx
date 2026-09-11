"use client";

import React from "react";
import { LanguageProvider } from "./LanguageContext";
import { UserProvider } from "./UserContext";
import { ToastProvider } from "./ToastContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <LanguageProvider>
        <UserProvider>
          {children}
        </UserProvider>
      </LanguageProvider>
    </ToastProvider>
  );
}
