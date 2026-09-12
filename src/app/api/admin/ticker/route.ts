import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const notice = await prisma.notice.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      notice: notice?.text || "",
      isActive: notice?.isActive ?? true,
    });
  } catch (error) {
    console.error("Admin ticker get error:", error);
    return NextResponse.json({ error: "নোটিশ লোড করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত এক্সেস।" }, { status: 403 });
    }

    const body = await request.json();
    const { text } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "ঘোষণাপত্র টেক্সট দিন।" }, { status: 400 });
    }

    const cleanText = text.trim();

    const existingNotice = await prisma.notice.findFirst({
      where: { isActive: true },
    });

    let updated;
    if (existingNotice) {
      updated = await prisma.notice.update({
        where: { id: existingNotice.id },
        data: { text: cleanText },
      });
    } else {
      updated = await prisma.notice.create({
        data: { text: cleanText, isActive: true },
      });
    }

    // Also publish as in-app notification so all users see it in notification list
    await prisma.notification.create({
      data: {
        userId: "ALL",
        title: "📢 প্ল্যাটফর্ম নোটিশ ও ঘোষণা",
        message: cleanText,
        type: "ANNOUNCEMENT",
        link: "/dashboard",
        isRead: false,
        readByUsers: [],
      },
    });

    return NextResponse.json({
      success: true,
      message: "নোটিশ সফলভাবে আপডেট ও প্লেয়ারদের কাছে পৌঁছে দেওয়া হয়েছে!",
      notice: updated,
    });
  } catch (error) {
    console.error("Admin ticker error:", error);
    return NextResponse.json({ error: "নোটিশ আপডেট করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
