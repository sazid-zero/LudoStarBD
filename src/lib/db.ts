/**
 * Prisma-backed database layer for LudoStar BD.
 * Exposes the same interface as the old JSON db.ts so all API routes
 * work without any changes — just swap the import.
 */

import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { User, Match, Transaction, Notice, AppNotification, MatchPlayer } from "./types";

// ─── Helpers ────────────────────────────────────────────────────────────────

function toUser(u: any): User {
  return {
    id: u.id,
    phone: u.phone,
    passwordHash: u.passwordHash,
    firstName: u.firstName,
    lastName: u.lastName,
    role: u.role as "USER" | "ADMIN",
    mainBalance: Number(u.mainBalance),
    winBalance: Number(u.winBalance),
    referCode: u.referCode,
    referredBy: u.referredBy ?? null,
    avatar: u.avatar ?? null,
    isBanned: u.isBanned,
    createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : u.createdAt,
    updatedAt: u.updatedAt instanceof Date ? u.updatedAt.toISOString() : u.updatedAt,
  };
}

function toMatch(m: any): Match {
  return {
    id: m.id,
    matchNo: m.matchNo,
    title: m.title,
    entryFee: Number(m.entryFee),
    prize: Number(m.prize),
    matchType: m.matchType,
    status: m.status as any,
    maxPlayers: m.maxPlayers ?? 2,
    players: (m.players as MatchPlayer[]) || [],
    roomCode: m.roomCode ?? null,
    creatorId: m.creatorId ?? null,
    creatorPhone: m.creatorPhone ?? null,
    creatorName: m.creatorName ?? null,
    opponentId: m.opponentId ?? null,
    opponentPhone: m.opponentPhone ?? null,
    opponentName: m.opponentName ?? null,
    winnerId: m.winnerId ?? null,
    winnerName: m.winnerName ?? null,
    creatorResult: m.creatorResult ?? null,
    opponentResult: m.opponentResult ?? null,
    creatorProofUrl: m.creatorProofUrl ?? null,
    opponentProofUrl: m.opponentProofUrl ?? null,
    disputeReason: m.disputeReason ?? null,
    adminNotes: m.adminNotes ?? null,
    createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt,
    updatedAt: m.updatedAt instanceof Date ? m.updatedAt.toISOString() : m.updatedAt,
  };
}

function toTransaction(t: any): Transaction {
  return {
    id: t.id,
    userId: t.userId,
    userName: t.userName ?? undefined,
    userPhone: t.userPhone ?? undefined,
    type: t.type as any,
    amount: Number(t.amount),
    status: t.status as any,
    mfsProvider: t.mfsProvider ?? null,
    accountType: t.accountType ?? null,
    accountNumber: t.accountNumber ?? null,
    trxId: t.trxId ?? null,
    adminTrxId: t.adminTrxId ?? null,
    note: t.note ?? null,
    createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
    updatedAt: t.updatedAt instanceof Date ? t.updatedAt.toISOString() : t.updatedAt,
  };
}

function toNotification(n: any): AppNotification {
  return {
    id: n.id,
    userId: n.userId,
    title: n.title,
    message: n.message,
    type: n.type as any,
    link: n.link ?? null,
    isRead: n.isRead,
    readByUsers: n.readByUsers || [],
    createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : n.createdAt,
  };
}

// ─── DB Object ───────────────────────────────────────────────────────────────

export const db = {
  // ── Users ──────────────────────────────────────────────────────────────────

  getUsers(): User[] {
    // Note: sync wrapper pattern — use async APIs in new code; this is for compat
    throw new Error("Use db.getUsersAsync() in API routes");
  },

  async getUsersAsync(filters?: { role?: string; isBanned?: boolean; search?: string }): Promise<User[]> {
    const where: any = {};
    if (filters?.role && filters.role !== "ALL") where.role = filters.role;
    if (filters?.isBanned !== undefined) where.isBanned = filters.isBanned;
    if (filters?.search) {
      where.OR = [
        { phone: { contains: filters.search, mode: "insensitive" } },
        { firstName: { contains: filters.search, mode: "insensitive" } },
        { lastName: { contains: filters.search, mode: "insensitive" } },
        { referCode: { contains: filters.search, mode: "insensitive" } },
      ];
    }
    const users = await prisma.user.findMany({ where, orderBy: { createdAt: "desc" } });
    return users.map(toUser);
  },

  async findUserByIdAsync(id: string): Promise<User | null> {
    const u = await prisma.user.findUnique({ where: { id } });
    return u ? toUser(u) : null;
  },

  async findUserByPhoneAsync(phone: string): Promise<User | null> {
    const u = await prisma.user.findUnique({ where: { phone } });
    return u ? toUser(u) : null;
  },

  async findUserByReferCodeAsync(referCode: string): Promise<User | null> {
    const u = await prisma.user.findUnique({ where: { referCode } });
    return u ? toUser(u) : null;
  },

  async createUserAsync(data: Omit<User, "updatedAt"> & { updatedAt?: string }): Promise<User> {
    const u = await prisma.user.create({
      data: {
        id: data.id,
        phone: data.phone,
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName || "",
        role: data.role as any,
        mainBalance: data.mainBalance,
        winBalance: data.winBalance,
        referCode: data.referCode,
        referredBy: data.referredBy ?? null,
        avatar: data.avatar ?? null,
        isBanned: data.isBanned,
      },
    });
    return toUser(u);
  },

  async updateUserAsync(id: string, updates: Partial<User>): Promise<User | null> {
    const u = await prisma.user.update({
      where: { id },
      data: {
        ...(updates.firstName !== undefined && { firstName: updates.firstName }),
        ...(updates.lastName !== undefined && { lastName: updates.lastName }),
        ...(updates.passwordHash !== undefined && { passwordHash: updates.passwordHash }),
        ...(updates.role !== undefined && { role: updates.role as any }),
        ...(updates.mainBalance !== undefined && { mainBalance: updates.mainBalance }),
        ...(updates.winBalance !== undefined && { winBalance: updates.winBalance }),
        ...(updates.isBanned !== undefined && { isBanned: updates.isBanned }),
        ...(updates.avatar !== undefined && { avatar: updates.avatar }),
        ...(updates.referredBy !== undefined && { referredBy: updates.referredBy }),
      },
    });
    return toUser(u);
  },

  // ── Matches ────────────────────────────────────────────────────────────────

  async getMatchesAsync(filters?: { status?: string; search?: string }): Promise<Match[]> {
    const where: any = {};
    if (filters?.status && filters.status !== "ALL") {
      where.status = filters.status;
    }
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      where.OR = [
        { title: { contains: s, mode: "insensitive" } },
        { creatorName: { contains: s, mode: "insensitive" } },
        { creatorPhone: { contains: s, mode: "insensitive" } },
        { opponentName: { contains: s, mode: "insensitive" } },
        { opponentPhone: { contains: s, mode: "insensitive" } },
        { roomCode: { contains: s, mode: "insensitive" } },
      ];
    }
    const matches = await prisma.match.findMany({ where, orderBy: { createdAt: "desc" } });
    return matches.map(toMatch);
  },

  async findMatchByIdAsync(id: string): Promise<Match | null> {
    const m = await prisma.match.findUnique({ where: { id } });
    return m ? toMatch(m) : null;
  },

  async createMatchAsync(data: Partial<Match> & { entryFee: number; prize: number }): Promise<Match> {
    const m = await prisma.match.create({
      data: {
        id: data.id || undefined,
        title: data.title || "১ বনাম ১ ক্লাসিক ম্যাচ",
        entryFee: data.entryFee,
        prize: data.prize,
        matchType: data.matchType || "1v1 Classic",
        status: (data.status as any) || "WAITING",
        maxPlayers: data.maxPlayers ?? 2,
        players: (data.players as any) || [],
        roomCode: data.roomCode ?? null,
        creatorId: data.creatorId ?? null,
        creatorPhone: data.creatorPhone ?? null,
        creatorName: data.creatorName ?? null,
        opponentId: data.opponentId ?? null,
        opponentPhone: data.opponentPhone ?? null,
        opponentName: data.opponentName ?? null,
      },
    });
    return toMatch(m);
  },

  async updateMatchAsync(id: string, updates: Partial<Match>): Promise<Match | undefined> {
    const { createdAt, updatedAt, id: _id, matchNo, ...rest } = updates as any;
    const m = await prisma.match.update({
      where: { id },
      data: {
        ...(rest.title !== undefined && { title: rest.title }),
        ...(rest.entryFee !== undefined && { entryFee: rest.entryFee }),
        ...(rest.prize !== undefined && { prize: rest.prize }),
        ...(rest.matchType !== undefined && { matchType: rest.matchType }),
        ...(rest.status !== undefined && { status: rest.status }),
        ...(rest.maxPlayers !== undefined && { maxPlayers: rest.maxPlayers }),
        ...(rest.players !== undefined && { players: rest.players }),
        ...(rest.roomCode !== undefined && { roomCode: rest.roomCode }),
        ...(rest.creatorId !== undefined && { creatorId: rest.creatorId }),
        ...(rest.creatorPhone !== undefined && { creatorPhone: rest.creatorPhone }),
        ...(rest.creatorName !== undefined && { creatorName: rest.creatorName }),
        ...(rest.opponentId !== undefined && { opponentId: rest.opponentId }),
        ...(rest.opponentPhone !== undefined && { opponentPhone: rest.opponentPhone }),
        ...(rest.opponentName !== undefined && { opponentName: rest.opponentName }),
        ...(rest.winnerId !== undefined && { winnerId: rest.winnerId }),
        ...(rest.winnerName !== undefined && { winnerName: rest.winnerName }),
        ...(rest.creatorResult !== undefined && { creatorResult: rest.creatorResult }),
        ...(rest.opponentResult !== undefined && { opponentResult: rest.opponentResult }),
        ...(rest.creatorProofUrl !== undefined && { creatorProofUrl: rest.creatorProofUrl }),
        ...(rest.opponentProofUrl !== undefined && { opponentProofUrl: rest.opponentProofUrl }),
        ...(rest.disputeReason !== undefined && { disputeReason: rest.disputeReason }),
        ...(rest.adminNotes !== undefined && { adminNotes: rest.adminNotes }),
      },
    });
    return toMatch(m);
  },

  async deleteMatchAsync(id: string): Promise<boolean> {
    try {
      await prisma.match.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  },

  // ── Transactions ───────────────────────────────────────────────────────────

  async getTransactionsAsync(filters?: { type?: string; status?: string; userId?: string; search?: string }): Promise<Transaction[]> {
    const where: any = {};
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.type && filters.type !== "ALL") where.type = filters.type;
    if (filters?.status && filters.status !== "ALL") where.status = filters.status;
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      where.OR = [
        { trxId: { contains: s, mode: "insensitive" } },
        { userPhone: { contains: s, mode: "insensitive" } },
        { userName: { contains: s, mode: "insensitive" } },
        { accountNumber: { contains: s, mode: "insensitive" } },
        { adminTrxId: { contains: s, mode: "insensitive" } },
      ];
    }
    const txs = await prisma.transaction.findMany({ where, orderBy: { createdAt: "desc" } });
    return txs.map(toTransaction);
  },

  async findTransactionByIdAsync(id: string): Promise<Transaction | null> {
    const t = await prisma.transaction.findUnique({ where: { id } });
    return t ? toTransaction(t) : null;
  },

  async findTransactionByTrxIdAsync(trxId: string): Promise<Transaction | null> {
    const t = await prisma.transaction.findFirst({ where: { trxId: { equals: trxId, mode: "insensitive" } } });
    return t ? toTransaction(t) : null;
  },

  async createTransactionAsync(data: Transaction): Promise<Transaction> {
    const t = await prisma.transaction.create({
      data: {
        id: data.id,
        userId: data.userId,
        userName: data.userName ?? null,
        userPhone: data.userPhone ?? null,
        type: data.type as any,
        amount: data.amount,
        status: data.status as any,
        mfsProvider: data.mfsProvider ? (data.mfsProvider as any) : null,
        accountType: data.accountType ?? null,
        accountNumber: data.accountNumber ?? null,
        trxId: data.trxId ?? null,
        adminTrxId: data.adminTrxId ?? null,
        note: data.note ?? null,
      },
    });
    return toTransaction(t);
  },

  async updateTransactionAsync(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined> {
    const t = await prisma.transaction.update({
      where: { id },
      data: {
        ...(updates.status !== undefined && { status: updates.status as any }),
        ...(updates.note !== undefined && { note: updates.note }),
        ...(updates.adminTrxId !== undefined && { adminTrxId: updates.adminTrxId }),
        ...(updates.trxId !== undefined && { trxId: updates.trxId }),
      },
    });
    return toTransaction(t);
  },

  // ── Notices ────────────────────────────────────────────────────────────────

  async getActiveNoticeAsync(): Promise<Notice | null> {
    const n = await prisma.notice.findFirst({ where: { isActive: true }, orderBy: { createdAt: "desc" } });
    if (!n) return null;
    return {
      id: n.id,
      text: n.text,
      isActive: n.isActive,
      createdAt: n.createdAt.toISOString(),
    };
  },

  async updateNoticeAsync(text: string): Promise<Notice> {
    // Upsert: update first active notice or create one
    const existing = await prisma.notice.findFirst({ where: { isActive: true } });
    let n;
    if (existing) {
      n = await prisma.notice.update({ where: { id: existing.id }, data: { text } });
    } else {
      n = await prisma.notice.create({ data: { text, isActive: true } });
    }
    return { id: n.id, text: n.text, isActive: n.isActive, createdAt: n.createdAt.toISOString() };
  },

  // ── Notifications ──────────────────────────────────────────────────────────

  async getNotificationsAsync(userId?: string): Promise<AppNotification[]> {
    let notifs;
    if (!userId || userId === "ALL") {
      notifs = await prisma.notification.findMany({ where: { userId: "ALL" }, orderBy: { createdAt: "desc" }, take: 100 });
    } else {
      notifs = await prisma.notification.findMany({
        where: { OR: [{ userId }, { userId: "ALL" }] },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
    }
    return notifs.map((n) => {
      const mapped = toNotification(n);
      // For "ALL" notifications, compute isRead per-user
      if (n.userId === "ALL" && userId && userId !== "ALL") {
        mapped.isRead = (n.readByUsers || []).includes(userId);
      }
      return mapped;
    });
  },

  async createNotificationAsync(data: Omit<AppNotification, "id" | "isRead" | "createdAt"> & Partial<Pick<AppNotification, "id" | "isRead" | "createdAt">>): Promise<AppNotification> {
    // For "ALL" broadcasts, don't use a FK userId — store as plain string
    const n = await prisma.notification.create({
      data: {
        id: data.id || undefined,
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        link: data.link ?? null,
        isRead: data.isRead ?? false,
        readByUsers: data.readByUsers || [],
      },
    });
    return toNotification(n);
  },

  async markNotificationAsReadAsync(id: string, userId?: string): Promise<void> {
    const n = await prisma.notification.findUnique({ where: { id } });
    if (!n) return;
    if (n.userId === "ALL" && userId) {
      const current = n.readByUsers || [];
      if (!current.includes(userId)) {
        await prisma.notification.update({ where: { id }, data: { readByUsers: [...current, userId] } });
      }
    } else {
      await prisma.notification.update({ where: { id }, data: { isRead: true } });
    }
  },

  async markAllNotificationsAsReadAsync(userId: string): Promise<void> {
    // Mark user-specific notifications
    await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
    // For "ALL" notifications, add userId to readByUsers
    const allNotifs = await prisma.notification.findMany({ where: { userId: "ALL" } });
    for (const n of allNotifs) {
      const current = n.readByUsers || [];
      if (!current.includes(userId)) {
        await prisma.notification.update({ where: { id: n.id }, data: { readByUsers: [...current, userId] } });
      }
    }
  },

  async deleteNotificationAsync(id: string): Promise<boolean> {
    try {
      await prisma.notification.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  },
};

// ─── Legacy sync stubs (kept so old imports don't crash immediately) ──────────
// These throw helpful errors pointing to the async version.
export function readDb(): never {
  throw new Error("readDb() is removed. Use prisma directly.");
}
