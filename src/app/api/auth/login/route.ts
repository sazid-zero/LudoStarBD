import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, signToken, AUTH_COOKIE_NAME, sanitizeUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, password } = body;

    if (!phone || !password) {
      return NextResponse.json({ error: "মোবাইল নম্বর ও পাসওয়ার্ড প্রদান করুন।" }, { status: 400 });
    }

    const cleanPhone = phone.trim().replace(/[-+\s]/g, "");
    const u = await prisma.user.findUnique({ where: { phone: cleanPhone } });

    if (!u) {
      return NextResponse.json({ error: "ভুল মোবাইল নম্বর অথবা পাসওয়ার্ড।" }, { status: 401 });
    }

    if (u.isBanned) {
      return NextResponse.json({ error: "আপনার একাউন্টটি সাময়িকভাবে নিষিদ্ধ (Banned) করা হয়েছে। সাপোর্টে যোগাযোগ করুন।" }, { status: 403 });
    }

    if (!comparePassword(password, u.passwordHash)) {
      return NextResponse.json({ error: "ভুল মোবাইল নম্বর অথবা পাসওয়ার্ড।" }, { status: 401 });
    }

    const user = {
      id: u.id, phone: u.phone, passwordHash: u.passwordHash,
      firstName: u.firstName, lastName: u.lastName, role: u.role as "USER" | "ADMIN",
      mainBalance: Number(u.mainBalance), winBalance: Number(u.winBalance),
      referCode: u.referCode, referredBy: u.referredBy ?? null, avatar: u.avatar ?? null,
      isBanned: u.isBanned, createdAt: u.createdAt.toISOString(), updatedAt: u.updatedAt.toISOString(),
    };

    const token = signToken({ userId: u.id, role: u.role as any, phone: u.phone });
    const response = NextResponse.json({ success: true, message: "সফলভাবে লগইন হয়েছে!", user: sanitizeUser(user) });
    response.cookies.set({ name: AUTH_COOKIE_NAME, value: token, httpOnly: true, path: "/", sameSite: "lax", maxAge: 30 * 24 * 60 * 60 });
    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "লগইন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।" }, { status: 500 });
  }
}
