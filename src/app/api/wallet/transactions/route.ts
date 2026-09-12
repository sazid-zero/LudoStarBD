import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "অননুমোদিত এক্সেস" }, { status: 401 });
    }

    const [user, transactions] = await Promise.all([
      prisma.user.findUnique({
        where: { id: sessionUser.id },
      }),
      prisma.transaction.findMany({
        where: { userId: sessionUser.id },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "ইউজার পাওয়া যায়নি।" }, { status: 404 });
    }

    return NextResponse.json({
      transactions,
      mainBalance: user.mainBalance,
      winBalance: user.winBalance,
      totalBalance: user.mainBalance + user.winBalance,
    });
  } catch (error) {
    console.error("Transactions error:", error);
    return NextResponse.json({ error: "ট্রানজেকশন লোড করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
