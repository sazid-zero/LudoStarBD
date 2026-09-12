import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ─── SMS parsing helpers ──────────────────────────────────────────────────────

interface ParsedSms {
  provider: "BKASH" | "NAGAD" | "ROCKET";
  trxId: string;
  amount: number;
  senderPhone: string | null;
}

function parseSms(text: string): ParsedSms | null {
  const clean = text.replace(/\s+/g, " ").trim();

  // ── bKash ──
  // Broad match: find amount (Tk/BDT) and TrxID anywhere in string
  if (/bkash/i.test(clean)) {
    const amountM = clean.match(/(?:Tk|BDT)\s*([\d,]+(?:\.\d+)?)/i);
    const trxM = clean.match(/TrxID\s+([A-Z0-9]+)/i);
    const phoneM = clean.match(/(01\d{9})/);
    if (amountM && trxM) {
      const amount = parseFloat(amountM[1].replace(/,/g, ""));
      if (amount > 0) {
        return {
          provider: "BKASH",
          trxId: trxM[1].toUpperCase(),
          amount,
          senderPhone: phoneM ? phoneM[1] : null,
        };
      }
    }
  }

  // ── Nagad ──
  if (/nagad|নগদ/i.test(clean)) {
    const amountM = clean.match(/([\d,]+(?:\.\d+)?)\s*(?:BDT|Tk|টাকা)/i);
    const trxM = clean.match(/(?:TrxID|Ref|রেফ)\s*[:\s]+([A-Z0-9]+)/i);
    const phoneM = clean.match(/(01\d{9})/);
    if (amountM && trxM) {
      const amount = parseFloat(amountM[1].replace(/,/g, ""));
      if (amount > 0) {
        return {
          provider: "NAGAD",
          trxId: trxM[1].toUpperCase(),
          amount,
          senderPhone: phoneM ? phoneM[1] : null,
        };
      }
    }
  }

  // ── Rocket (DBBL) ──
  if (/rocket|dbbl/i.test(clean)) {
    const amountM = clean.match(/([\d,]+(?:\.\d+)?)\s*(?:BDT|Tk|টাকা)/i);
    const trxM = clean.match(/(?:TxnID|TrxID|Ref)\s*[:\s]+([A-Z0-9]+)/i);
    const phoneM = clean.match(/(01\d{9})/);
    if (amountM && trxM) {
      const amount = parseFloat(amountM[1].replace(/,/g, ""));
      if (amount > 0) {
        return {
          provider: "ROCKET",
          trxId: trxM[1].toUpperCase(),
          amount,
          senderPhone: phoneM ? phoneM[1] : null,
        };
      }
    }
  }

  return null;
}

// ─── POST /api/webhooks/sms ───────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    // 1. Validate webhook secret (falls back to default secret if not set in Vercel)
    const expectedSecret = process.env.SMS_WEBHOOK_SECRET || "ludoearn_sms_webhook_secret_2026";

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const authHeader = request.headers.get("x-webhook-secret") || "";
    const bodySecret = body?.secret || "";

    if (authHeader !== expectedSecret && bodySecret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // 2. Extract SMS text — supports multiple SMS forwarder app formats
    const smsText: string =
      body?.message || // SMS Forwarder / generic
      body?.body ||    // some apps
      body?.text ||    // Automate
      body?.sms ||
      "";

    if (!smsText || typeof smsText !== "string") {
      return NextResponse.json({ error: "No SMS body found in payload." }, { status: 400 });
    }

    // 3. Parse the SMS
    const parsed = parseSms(smsText);
    if (!parsed) {
      return NextResponse.json({
        received: true,
        matched: false,
        reason: "SMS not a recognizable payment message.",
      });
    }

    const { provider, trxId, amount, senderPhone } = parsed;

    // 4. Find a pending deposit transaction with this TrxID
    const pendingTx = await prisma.transaction.findFirst({
      where: {
        trxId: { equals: trxId, mode: "insensitive" },
        type: "DEPOSIT",
        status: "PENDING",
      },
      include: { user: true },
    });

    if (pendingTx) {
      // ✅ Match found — auto-approve atomically
      await prisma.$transaction([
        prisma.transaction.update({
          where: { id: pendingTx.id },
          data: {
            status: "APPROVED",
            note: `SMS-auto-approved. Provider: ${provider}. TrxID: ${trxId}.`,
          },
        }),
        prisma.user.update({
          where: { id: pendingTx.userId },
          data: { mainBalance: { increment: pendingTx.amount } },
        }),
        prisma.receivedSms.upsert({
          where: { trxId },
          create: {
            trxId,
            mfsProvider: provider,
            amount,
            senderPhone,
            rawMessage: smsText,
            isClaimed: true,
            claimedBy: pendingTx.userId,
            claimedAt: new Date(),
          },
          update: {
            isClaimed: true,
            claimedBy: pendingTx.userId,
            claimedAt: new Date(),
          },
        }),
        prisma.notification.create({
          data: {
            userId: pendingTx.userId,
            title: `✅ ডিপোজিট অনুমোদিত — ৳${pendingTx.amount}`,
            message: `আপনার ৳${pendingTx.amount} ${provider} ডিপোজিট (TrxID: ${trxId}) স্বয়ংক্রিয়ভাবে যাচাই হয়েছে এবং আপনার ব্যালেন্সে যোগ হয়েছে।`,
            type: "DEPOSIT",
            link: "/wallet",
          },
        }),
      ]);

      console.log(`[SMS Webhook] ✅ Auto-approved ৳${pendingTx.amount} for user ${pendingTx.userId} — TrxID: ${trxId}`);

      return NextResponse.json({
        received: true,
        matched: true,
        autoApproved: true,
        trxId,
        amount: pendingTx.amount,
        userId: pendingTx.userId,
      });
    }

    // 5. No match — store in ReceivedSms for future claim (idempotent)
    const alreadyStored = await prisma.receivedSms.findUnique({ where: { trxId } });
    if (!alreadyStored) {
      await prisma.receivedSms.create({
        data: { trxId, mfsProvider: provider, amount, senderPhone, rawMessage: smsText },
      });
    }

    console.log(`[SMS Webhook] 📥 Stored unmatched SMS — TrxID: ${trxId}, Provider: ${provider}, Amount: ${amount}`);

    return NextResponse.json({
      received: true,
      matched: false,
      stored: !alreadyStored,
      trxId,
      reason: "No pending deposit found. SMS stored for future matching.",
    });
  } catch (error: any) {
    console.error("[SMS Webhook] Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
