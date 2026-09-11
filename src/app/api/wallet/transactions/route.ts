import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "অননুমোদিত এক্সেস" }, { status: 401 });
    }

    const transactions = db.getTransactionsByUserId(user.id);

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
