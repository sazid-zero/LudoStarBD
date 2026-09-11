import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      // Unauthenticated: return global announcements only
      const globalNotifs = db.getNotifications("ALL");
      return NextResponse.json({
        notifications: globalNotifs,
        unreadCount: 0,
      });
    }

    const notifs = db.getNotifications(user.id);
    const unreadCount = notifs.filter((n) => !n.isRead).length;

    return NextResponse.json({
      notifications: notifs,
      unreadCount,
    });
  } catch (error) {
    console.error("Notifications fetch error:", error);
    return NextResponse.json({ error: "নোটিফিকেশন লোড করা সম্ভব হয়নি।" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    const body = await request.json();
    const { action, id, notificationId, title, message, link } = body;
    const targetId = id || notificationId;

    // Action 1: Mark notification as read
    if (action === "MARK_READ" || action === "MARK_ALL_READ") {
      if (!user) {
        return NextResponse.json({ error: "অননুমোদিত।" }, { status: 401 });
      }

      if (action === "MARK_READ" && targetId) {
        db.markNotificationAsRead(targetId, user.id);
      } else {
        db.markAllNotificationsAsRead(user.id);
      }

      return NextResponse.json({ success: true, message: "পঠিত হিসেবে চিহ্নিত করা হয়েছে।" });
    }

    // Action 2: Admin broadcast notification
    if (action === "BROADCAST") {
      if (!user || user.role !== "ADMIN") {
        return NextResponse.json({ error: "শুধুমাত্র এডমিন নোটিফিকেশন পাঠাতে পারবেন।" }, { status: 403 });
      }

      if (!title || !message) {
        return NextResponse.json({ error: "শিরোনাম এবং বার্তা লিখুন।" }, { status: 400 });
      }

      const cleanTitle = title.trim();
      const cleanMessage = message.trim();

      const newNotif = db.createNotification({
        id: `notif-${Date.now()}-all`,
        userId: "ALL",
        title: cleanTitle,
        message: cleanMessage,
        type: "ANNOUNCEMENT",
        link: link?.trim() || null,
        isRead: false,
        readByUsers: [],
        createdAt: new Date().toISOString(),
      });

      // Also sync with dashboard ticker
      db.updateNotice(cleanMessage);

      return NextResponse.json({
        success: true,
        message: "সকল ইউজারের কাছে নোটিফিকেশন সম্প্রচার করা হয়েছে!",
        notification: newNotif,
      });
    }

    return NextResponse.json({ error: "সঠিক অ্যাকশন নির্বাচন করুন।" }, { status: 400 });
  } catch (error) {
    console.error("Notification mutation error:", error);
    return NextResponse.json({ error: "নোটিফিকেশন প্রসেস করা যায়নি।" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত এক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "নোটিফিকেশন আইডি প্রয়োজন।" }, { status: 400 });
    }

    const ok = db.deleteNotification(id);
    if (ok) {
      return NextResponse.json({ success: true, message: "নোটিফিকেশন মুছে ফেলা হয়েছে।" });
    }
    return NextResponse.json({ error: "নোটিফিকেশন পাওয়া যায়নি।" }, { status: 404 });
  } catch (error) {
    console.error("Delete notification error:", error);
    return NextResponse.json({ error: "নোটিফিকেশন মুছে ফেলা সম্ভব হয়নি।" }, { status: 500 });
  }
}
