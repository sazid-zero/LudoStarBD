import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, signToken, AUTH_COOKIE_NAME, sanitizeUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, phone, password, referCode } = body;

    if (!firstName || !phone || !password) {
      return NextResponse.json(
        { error: "সবগুলো প্রয়োজনীয় ফিল্ড পূরণ করুন।" },
        { status: 400 }
      );
    }

    // Validate Bangladeshi phone number (11 digits, starts with 01)
    const cleanPhone = phone.trim().replace(/[-+\s]/g, "");
    if (!/^01[3-9]\d{8}$/.test(cleanPhone)) {
      return NextResponse.json(
        { error: "সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।" },
        { status: 400 }
      );
    }

    // Check if phone already registered
    const existing = db.findUserByPhone(cleanPhone);
    if (existing) {
      return NextResponse.json(
        { error: "এই মোবাইল নম্বর দিয়ে ইতিমধ্যেই একাউন্ট খোলা আছে। লগইন করুন।" },
        { status: 409 }
      );
    }

    // Handle referral code
    let referredBy: string | null = null;
    let initialBonus = 10; // ৳10 signup welcome bonus
    if (referCode && referCode.trim()) {
      const referrer = db.findUserByReferCode(referCode.trim());
      if (referrer) {
        referredBy = referrer.referCode;
        initialBonus = 20; // ৳20 bonus if used referral code!
        // Credit referrer with ৳10 bonus
        db.updateUser(referrer.id, {
          winBalance: referrer.winBalance + 10,
        });
        db.createTransaction({
          id: `trx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          userId: referrer.id,
          userName: `${referrer.firstName} ${referrer.lastName}`,
          userPhone: referrer.phone,
          type: "REFERRAL_BONUS",
          amount: 10,
          status: "APPROVED",
          note: `রেফারেল বোনাস (${firstName} যোগ দিয়েছেন)`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // Generate unique user referral code
    const generatedReferCode = `${cleanPhone.slice(-4)}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    const newUser = db.createUser({
      id: `user-${Date.now()}`,
      phone: cleanPhone,
      passwordHash: hashPassword(password),
      firstName: firstName.trim(),
      lastName: (lastName || "").trim(),
      role: "USER",
      mainBalance: initialBonus, // Welcome bonus given
      winBalance: 0,
      referCode: generatedReferCode,
      referredBy,
      isBanned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Record welcome bonus transaction
    db.createTransaction({
      id: `trx-${Date.now()}-welcome`,
      userId: newUser.id,
      userName: `${newUser.firstName} ${newUser.lastName}`,
      userPhone: newUser.phone,
      type: "REFERRAL_BONUS",
      amount: initialBonus,
      status: "APPROVED",
      note: referredBy ? "স্বাগতম বোনাস (রেফারেল কোড সহ)" : "নতুন একাউন্ট স্বাগতম বোনাস",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const token = signToken({
      userId: newUser.id,
      role: newUser.role,
      phone: newUser.phone,
    });

    const response = NextResponse.json({
      success: true,
      message: "একাউন্ট সফলভাবে তৈরি হয়েছে!",
      user: sanitizeUser(newUser),
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "রেজিস্ট্রেশন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।" },
      { status: 500 }
    );
  }
}
