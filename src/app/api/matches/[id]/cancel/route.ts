import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { MatchPlayer } from "@/lib/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "অননুমোদিত এক্সেস। লগইন করুন।" }, { status: 401 });
    }

    const { id } = await params;
    const match = await prisma.match.findUnique({
      where: { id },
    });

    if (!match) {
      return NextResponse.json({ error: "ম্যাচ পাওয়া যায়নি" }, { status: 404 });
    }

    if (match.status !== "WAITING") {
      return NextResponse.json(
        {
          error:
            match.status === "RUNNING"
              ? "ম্যাচ ইতিমধ্যে চলমান। চলমান ম্যাচ বাতিল করা যাবে না।"
              : "শুধুমাত্র WAITING অবস্থায় থাকা ম্যাচ বাতিল করা যাবে।",
        },
        { status: 400 }
      );
    }

    // Build unified players list
    let currentPlayers: MatchPlayer[] = (match.players as unknown as MatchPlayer[]) || [];
    if (currentPlayers.length === 0 && match.creatorId) {
      currentPlayers.push({
        userId: match.creatorId,
        name: match.creatorName || "হোস্ট",
        phone: match.creatorPhone || "",
        slot: 1,
        isHost: true,
        joinedAt: match.createdAt.toISOString(),
      });
      if (match.opponentId) {
        currentPlayers.push({
          userId: match.opponentId,
          name: match.opponentName || "খেলোয়াড় ২",
          phone: match.opponentPhone || "",
          slot: 2,
          isHost: false,
          joinedAt: match.updatedAt.toISOString(),
        });
      }
    }

    // Only host/creator can cancel, or admin
    const isHost =
      match.creatorId === user.id ||
      currentPlayers.find((p) => p.isHost)?.userId === user.id ||
      user.role === "ADMIN";

    if (!isHost) {
      return NextResponse.json(
        { error: "শুধুমাত্র ম্যাচ হোস্ট (তৈরি কারী) বা এডমিন ম্যাচ বাতিল করতে পারেন।" },
        { status: 403 }
      );
    }

    const dbOps: any[] = [];

    // Refund all joined players
    for (const player of currentPlayers) {
      dbOps.push(
        prisma.user.update({
          where: { id: player.userId },
          data: {
            mainBalance: { increment: match.entryFee },
          },
        })
      );

      dbOps.push(
        prisma.transaction.create({
          data: {
            userId: player.userId,
            userName: player.name,
            userPhone: player.phone,
            type: "DEPOSIT",
            amount: match.entryFee,
            status: "APPROVED",
            note: `ম্যাচ #${match.matchNo} বাতিল — এন্ট্রি ফি রিফান্ড`,
          },
        })
      );
    }

    dbOps.push(
      prisma.match.update({
        where: { id },
        data: {
          status: "CANCELLED",
          adminNotes: `হোস্ট কর্তৃক বাতিল — সকল ${currentPlayers.length} জন খেলোয়াড়ের এন্ট্রি ফি রিফান্ড করা হয়েছে`,
        },
      })
    );

    await prisma.$transaction(dbOps);

    // Send notifications
    for (const player of currentPlayers) {
      await prisma.notification.create({
        data: {
          userId: player.userId,
          title: `ম্যাচ #${match.matchNo} বাতিল ও রিফান্ড`,
          message: `হোস্ট ম্যাচটি বাতিল করেছেন। এন্ট্রি ফি ৳${match.entryFee} আপনার মেইন ব্যালেন্সে ফেরত দেওয়া হয়েছে।`,
          type: "ALERT",
          link: "/wallet",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `ম্যাচ #${match.matchNo} বাতিল করা হয়েছে। ${currentPlayers.length} জন খেলোয়াড়ের ৳${match.entryFee} করে এন্ট্রি ফি রিফান্ড হয়েছে।`,
      refundedCount: currentPlayers.length,
    });
  } catch (error) {
    console.error("Error cancelling match:", error);
    return NextResponse.json({ error: "ম্যাচ বাতিল করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
