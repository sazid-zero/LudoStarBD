import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken, AUTH_COOKIE_NAME, sanitizeUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, phone, password, referCode } = body;

    if (!firstName || !phone || !password) {
      return NextResponse.json({ error: "সবগুলো প্রয়োজনীয় ফিল্ড পূরণ করুন।" }, { status: 400 });
    }

    const cleanPhone = phone.trim().replace(/[-+\s]/g, "");
    if (!/^01[3-9]\d{8}$/.test(cleanPhone)) {
      return NextResponse.json({ error: "সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { phone: cleanPhone } });
    if (existing) {
      return NextResponse.json({ error: "এই মোবাইল নম্বর দিয়ে ইতিমধ্যেই একাউন্ট খোলা আছে। লগইন করুন।" }, { status: 409 });
    }

    let referredBy: string | null = null;
    let initialBonus = 10;

    if (referCode?.trim()) {
      const referrer = await prisma.user.findUnique({ where: { referCode: referCode.trim() } });
      if (referrer) {
        referredBy = referrer.referCode;
        initialBonus = 20;
        await prisma.user.update({ where: { id: referrer.id }, data: { winBalance: { increment: 10 } } });
        await prisma.transaction.create({
          data: {
            userId: referrer.id,
            userName: `${referrer.firstName} ${referrer.lastName}`,
            userPhone: referrer.phone,
            type: "REFERRAL_BONUS",
            amount: 10,
            status: "APPROVED",
            note: `রেফারেল বোনাস (${firstName} যোগ দিয়েছেন)`,
          },
        });
      }
    }

    const generatedReferCode = `${cleanPhone.slice(-4)}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    const newUser = await prisma.user.create({
      data: {
        phone: cleanPhone,
        passwordHash: hashPassword(password),
        firstName: firstName.trim(),
        lastName: (lastName || "").trim(),
        role: "USER",
        mainBalance: initialBonus,
        winBalance: 0,
        referCode: generatedReferCode,
        referredBy,
        isBanned: false,
      },
    });

    await prisma.transaction.create({
      data: {
        userId: newUser.id,
        userName: `${newUser.firstName} ${newUser.lastName}`,
        userPhone: newUser.phone,
        type: "REFERRAL_BONUS",
        amount: initialBonus,
        status: "APPROVED",
        note: referredBy ? "স্বাগতম বোনাস (রেফারেল কোড সহ)" : "নতুন একাউন্ট স্বাগতম বোনাস",
      },
    });

    const userForToken = {
      id: newUser.id,
      phone: newUser.phone,
      passwordHash: newUser.passwordHash,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role as "USER" | "ADMIN",
      mainBalance: Number(newUser.mainBalance),
      winBalance: Number(newUser.winBalance),
      referCode: newUser.referCode,
      referredBy: newUser.referredBy ?? null,
      avatar: newUser.avatar ?? null,
      isBanned: newUser.isBanned,
      createdAt: newUser.createdAt.toISOString(),
      updatedAt: newUser.updatedAt.toISOString(),
    };

    const token = signToken({ userId: newUser.id, role: newUser.role as any, phone: newUser.phone });
    const response = NextResponse.json({ success: true, message: "একাউন্ট সফলভাবে তৈরি হয়েছে!", user: sanitizeUser(userForToken) });
    response.cookies.set({ name: AUTH_COOKIE_NAME, value: token, httpOnly: true, path: "/", sameSite: "lax", maxAge: 30 * 24 * 60 * 60 });
    return response;
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "রেজিস্ট্রেশন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।" }, { status: 500 });
  }
}
