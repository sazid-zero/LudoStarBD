import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত এক্সেস।" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "ALL";
    const mfs = searchParams.get("mfs") || "ALL";
    const search = (searchParams.get("search") || "").trim().toLowerCase();

    let allDeposits = db
      .getTransactions()
      .filter((t) => t.type === "DEPOSIT" || t.type === "MATCH_FEE");

    if (status !== "ALL") {
      allDeposits = allDeposits.filter((t) => t.status === status);
    }

    if (mfs !== "ALL") {
      allDeposits = allDeposits.filter((t) => t.mfsProvider === mfs);
    }

    if (search) {
      allDeposits = allDeposits.filter((t) => {
        const trxMatch = t.trxId?.toLowerCase().includes(search);
        const phoneMatch = t.userPhone?.toLowerCase().includes(search);
        const nameMatch = t.userName?.toLowerCase().includes(search);
        const accountMatch = t.accountNumber?.toLowerCase().includes(search);
        return trxMatch || phoneMatch || nameMatch || accountMatch;
      });
    }

    const pendingCount = db.getTransactions().filter((t) => (t.type === "DEPOSIT" || t.type === "MATCH_FEE") && t.status === "PENDING").length;
    const approvedTotal = db
      .getTransactions()
      .filter((t) => (t.type === "DEPOSIT" || t.type === "MATCH_FEE") && t.status === "APPROVED")
      .reduce((sum, t) => sum + t.amount, 0);

    return NextResponse.json({
      deposits: allDeposits,
      totalCount: allDeposits.length,
      pendingCount,
      approvedTotal,
    });
  } catch (error) {
    console.error("Admin deposits fetch error:", error);
    return NextResponse.json({ error: "ডিপোজিট তালিকা আনতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "অননুমোদিত এক্সেস।" }, { status: 403 });
    }

    const body = await request.json();
    const { transactionId, action, reason } = body; // action: "APPROVE" | "REJECT"

    if (!transactionId || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json({ error: "সঠিক ট্রানজেকশন ও অ্যাকশন প্রদান করুন।" }, { status: 400 });
    }

    const transaction = db.findTransactionById(transactionId);
    if (!transaction || (transaction.type !== "DEPOSIT" && transaction.type !== "MATCH_FEE")) {
      return NextResponse.json({ error: "ডিপোজিট/পেমেন্ট ট্রানজেকশন পাওয়া যায়নি।" }, { status: 404 });
    }

    if (transaction.status !== "PENDING") {
      return NextResponse.json({ error: "এই ট্রানজেকশনটি ইতিপূর্বেই নিষ্পত্তি করা হয়েছে।" }, { status: 400 });
    }

    if (action === "APPROVE") {
      // If regular deposit, credit user's main balance
      if (transaction.type === "DEPOSIT") {
        const targetUser = db.findUserById(transaction.userId);
        if (targetUser) {
          db.updateUser(targetUser.id, {
            mainBalance: targetUser.mainBalance + transaction.amount,
          });
        }
      }

      const updated = db.updateTransaction(transactionId, {
        status: "APPROVED",
        note: reason?.trim() || "এডমিন কর্তৃক পেমেন্ট সফলভাবে অনুমোদিত হয়েছে",
      });

      // Send in-app notification
      db.createNotification({
        userId: transaction.userId,
        title: "✅ ডিপোজিট সফলভাবে অনুমোদিত!",
        message: `আপনার ৳${transaction.amount} পেমেন্ট (${transaction.mfsProvider || "MFS"}) এডমিন কর্তৃক অনুমোদিত হয়েছে এবং ব্যালেন্সে যুক্ত করা হয়েছে।`,
        type: "SUCCESS",
        link: "/wallet",
      });

      return NextResponse.json({
        success: true,
        message: `৳${transaction.amount} পেমেন্ট সফলভাবে অনুমোদিত হয়েছে!`,
        transaction: updated,
      });
    } else {
      const rejectNote = reason?.trim() || "এডমিন কর্তৃক ডিপোজিট বাতিল করা হয়েছে (ভুল TrxID বা টাকা আসেনি)";
      const updated = db.updateTransaction(transactionId, {
        status: "REJECTED",
        note: rejectNote,
      });

      // Send in-app notification
      db.createNotification({
        userId: transaction.userId,
        title: "❌ ডিপোজিট রিকোয়েস্ট বাতিল",
        message: `আপনার ৳${transaction.amount} ডিপোজিট বাতিল করা হয়েছে। কারণ: ${rejectNote}`,
        type: "ALERT",
        link: "/wallet",
      });

      return NextResponse.json({
        success: true,
        message: "ডিপোজিট রিকোয়েস্ট বাতিল করা হয়েছে।",
        transaction: updated,
      });
    }
  } catch (error) {
    console.error("Admin deposit error:", error);
    return NextResponse.json({ error: "অ্যাকশন সম্পন্ন করতে সমস্যা হয়েছে।" }, { status: 500 });
  }
}
