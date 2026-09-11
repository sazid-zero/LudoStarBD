import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, hashPassword } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত এক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim().toLowerCase();
    const role = searchParams.get("role") || "ALL";
    const status = searchParams.get("status") || "ALL";

    let allUsers = db.getUsers();

    if (role !== "ALL") {
      allUsers = allUsers.filter((u) => u.role === role);
    }

    if (status === "ACTIVE") {
      allUsers = allUsers.filter((u) => !u.isBanned);
    } else if (status === "BANNED") {
      allUsers = allUsers.filter((u) => u.isBanned);
    }

    if (search) {
      allUsers = allUsers.filter((u) => {
        const phoneMatch = u.phone?.toLowerCase().includes(search);
        const nameMatch = `${u.firstName} ${u.lastName}`.toLowerCase().includes(search);
        const referMatch = u.referCode?.toLowerCase().includes(search);
        return phoneMatch || nameMatch || referMatch;
      });
    }

    const sanitized = allUsers.map((u) => ({
      id: u.id,
      phone: u.phone,
      name: `${u.firstName} ${u.lastName}`,
      role: u.role,
      mainBalance: u.mainBalance,
      winBalance: u.winBalance,
      referCode: u.referCode,
      referredBy: u.referredBy,
      isBanned: u.isBanned,
      createdAt: u.createdAt,
    }));

    return NextResponse.json({
      users: sanitized,
      totalCount: sanitized.length,
      bannedCount: sanitized.filter((u) => u.isBanned).length,
    });
  } catch (error) {
    console.error("Admin users fetch error:", error);
    return NextResponse.json({ error: "ইউজার তালিকা আনতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত এক্সেস।" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, action, amount, balanceType, note, newPassword, newRole } = body;

    const targetUser = db.findUserById(userId);
    if (!targetUser) {
      return NextResponse.json({ error: "ইউজার পাওয়া যায়নি।" }, { status: 404 });
    }

    // Action 1: Toggle Ban
    if (action === "TOGGLE_BAN") {
      if (targetUser.role === "ADMIN") {
        return NextResponse.json({ error: "এডমিন একাউন্ট ব্যান করা যাবে না।" }, { status: 400 });
      }

      const updated = db.updateUser(userId, { isBanned: !targetUser.isBanned });
      return NextResponse.json({
        success: true,
        message: updated?.isBanned
          ? `${targetUser.firstName}-এর একাউন্ট সাময়িকভাবে নিষিদ্ধ (Banned) করা হয়েছে।`
          : `${targetUser.firstName}-এর একাউন্ট সফলভাবে সক্রিয় (Unbanned) করা হয়েছে।`,
        user: updated,
      });
    }

    // Action 2: Adjust Balance
    if (action === "ADJUST_BALANCE") {
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount === 0) {
        return NextResponse.json({ error: "সঠিক ব্যালেন্স পরিমাণ প্রদান করুন।" }, { status: 400 });
      }

      const updates: any = {};
      if (balanceType === "MAIN") {
        updates.mainBalance = Math.max(0, targetUser.mainBalance + numAmount);
      } else {
        updates.winBalance = Math.max(0, targetUser.winBalance + numAmount);
      }

      const updated = db.updateUser(userId, updates);

      // Record transaction
      db.createTransaction({
        id: `trx-${Date.now()}-adj`,
        userId: targetUser.id,
        userName: `${targetUser.firstName} ${targetUser.lastName}`,
        userPhone: targetUser.phone,
        type: numAmount >= 0 ? "DEPOSIT" : "WITHDRAW",
        amount: Math.abs(numAmount),
        status: "APPROVED",
        note:
          note?.trim() ||
          `এডমিন ব্যালেন্স সমন্বয় (${balanceType === "MAIN" ? "মেইন" : "উইনিং"} ${numAmount >= 0 ? "+" : ""}${numAmount})`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: `${targetUser.firstName}-এর ${balanceType === "MAIN" ? "মেইন" : "উইনিং"} ব্যালেন্স সফলভাবে সমন্বয় করা হয়েছে!`,
        user: updated,
      });
    }

    // Action 3: Change Role
    if (action === "CHANGE_ROLE") {
      if (!newRole || !["USER", "ADMIN"].includes(newRole)) {
        return NextResponse.json({ error: "সঠিক রোল নির্ধারণ করুন।" }, { status: 400 });
      }

      const updated = db.updateUser(userId, { role: newRole });
      return NextResponse.json({
        success: true,
        message: `${targetUser.firstName}-এর রোল "${newRole}" নির্ধারণ করা হয়েছে।`,
        user: updated,
      });
    }

    // Action 4: Reset Password
    if (action === "RESET_PASSWORD") {
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ error: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।" }, { status: 400 });
      }

      const passwordHash = hashPassword(newPassword.trim());
      db.updateUser(userId, { passwordHash });

      return NextResponse.json({
        success: true,
        message: `${targetUser.firstName}-এর পাসওয়ার্ড সফলভাবে রিসেট করা হয়েছে!`,
      });
    }

    return NextResponse.json({ error: "অবৈধ অ্যাকশন" }, { status: 400 });
  } catch (error) {
    console.error("Admin user action error:", error);
    return NextResponse.json({ error: "ইউজার অ্যাকশন সম্পন্ন করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
