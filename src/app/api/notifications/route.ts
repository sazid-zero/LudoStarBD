import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      // Unauthenticated: return global announcements only
      const globalNotifs = await prisma.notification.findMany({
        where: { userId: "ALL" },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      return NextResponse.json({
        notifications: globalNotifs.map((n) => ({
          ...n,
          createdAt: n.createdAt.toISOString(),
        })),
        unreadCount: 0,
      });
    }

    const notifs = await prisma.notification.findMany({
      where: {
        OR: [{ userId: user.id }, { userId: "ALL" }],
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const mappedNotifs = notifs.map((n) => {
      const isRead =
        n.userId === "ALL" ? (n.readByUsers || []).includes(user.id) : n.isRead;
      return {
        ...n,
        isRead,
        createdAt: n.createdAt.toISOString(),
      };
    });

    const unreadCount = mappedNotifs.filter((n) => !n.isRead).length;

    return NextResponse.json({
      notifications: mappedNotifs,
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
        const notif = await prisma.notification.findUnique({
          where: { id: targetId },
        });
        if (notif) {
          if (notif.userId === "ALL") {
            const current = notif.readByUsers || [];
            if (!current.includes(user.id)) {
              await prisma.notification.update({
                where: { id: targetId },
                data: { readByUsers: [...current, user.id] },
              });
            }
          } else {
            await prisma.notification.update({
              where: { id: targetId },
              data: { isRead: true },
            });
          }
        }
      } else {
        // Mark all as read
        await prisma.notification.updateMany({
          where: { userId: user.id, isRead: false },
          data: { isRead: true },
        });

        const allNotifs = await prisma.notification.findMany({
          where: { userId: "ALL" },
        });
        for (const n of allNotifs) {
          const current = n.readByUsers || [];
          if (!current.includes(user.id)) {
            await prisma.notification.update({
              where: { id: n.id },
              data: { readByUsers: [...current, user.id] },
            });
          }
        }
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

      const newNotif = await prisma.notification.create({
        data: {
          userId: "ALL",
          title: cleanTitle,
          message: cleanMessage,
          type: "ANNOUNCEMENT",
          link: link?.trim() || null,
          isRead: false,
          readByUsers: [],
        },
      });

      // Also sync with dashboard ticker
      const existingNotice = await prisma.notice.findFirst({
        where: { isActive: true },
      });
      if (existingNotice) {
        await prisma.notice.update({
          where: { id: existingNotice.id },
          data: { text: cleanMessage },
        });
      } else {
        await prisma.notice.create({
          data: { text: cleanMessage, isActive: true },
        });
      }

      return NextResponse.json({
        success: true,
        message: "সকল ইউজারের কাছে নোটিফিকেশন সম্প্রচার করা হয়েছে!",
        notification: {
          ...newNotif,
          createdAt: newNotif.createdAt.toISOString(),
        },
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

    await prisma.notification.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "নোটিফিকেশন মুছে ফেলা হয়েছে।" });
  } catch (error) {
    console.error("Delete notification error:", error);
    return NextResponse.json({ error: "নোটিফিকেশন মুছে ফেলা সম্ভব হয়নি।" }, { status: 500 });
  }
}
