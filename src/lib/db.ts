import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { User, Match, Transaction, Notice, AppNotification } from "./types";

// On Vercel / serverless functions, the root filesystem is read-only.
// We use /tmp which is writable in serverless runtimes.
const isServerless = process.env.VERCEL === "1" || process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined || process.env.NODE_ENV === "production" && !process.env.LOCAL_DEV;
const DATA_DIR = isServerless ? path.join("/tmp", ".data") : path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "db.json");

interface DatabaseSchema {
  users: User[];
  matches: Match[];
  transactions: Transaction[];
  notices: Notice[];
  notifications?: AppNotification[];
}

let inMemoryDb: DatabaseSchema | null = null;

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn("Could not create DATA_DIR on disk:", err);
  }
}

function getInitialData(): DatabaseSchema {
  const adminPasswordHash = bcrypt.hashSync("admin123", 10);
  const userPasswordHash = bcrypt.hashSync("user123456", 10);

  const adminUser: User = {
    id: "admin-user-01",
    phone: "01700000000",
    passwordHash: adminPasswordHash,
    firstName: "এডমিন",
    lastName: "ম্যানেজার",
    role: "ADMIN",
    mainBalance: 50000,
    winBalance: 25000,
    referCode: "ADMIN77",
    isBanned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const toasinAdminUser: User = {
    id: "admin-toasin-01",
    phone: "01321063123",
    passwordHash: bcrypt.hashSync("421500", 10),
    firstName: "Toasin",
    lastName: "",
    role: "ADMIN",
    mainBalance: 50000,
    winBalance: 25000,
    referCode: "TOASIN",
    isBanned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const demoUser: User = {
    id: "user-01",
    phone: "01711111111",
    passwordHash: userPasswordHash,
    firstName: "রাকিব",
    lastName: "হাসান",
    role: "USER",
    mainBalance: 350,
    winBalance: 420,
    referCode: "RAKIB10",
    isBanned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const topPlayer1: User = {
    id: "user-02",
    phone: "01822222222",
    passwordHash: userPasswordHash,
    firstName: "তানভীর",
    lastName: "আহমেদ",
    role: "USER",
    mainBalance: 1200,
    winBalance: 4850,
    referCode: "TANVIR55",
    isBanned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const topPlayer2: User = {
    id: "user-03",
    phone: "01933333333",
    passwordHash: userPasswordHash,
    firstName: "সোহেল",
    lastName: "রানা",
    role: "USER",
    mainBalance: 800,
    winBalance: 3200,
    referCode: "SOHEL99",
    isBanned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const topPlayer3: User = {
    id: "user-04",
    phone: "01644444444",
    passwordHash: userPasswordHash,
    firstName: "মিজানুর",
    lastName: "রহমান",
    role: "USER",
    mainBalance: 450,
    winBalance: 2750,
    referCode: "MIZAN33",
    isBanned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const initialMatches: Match[] = [
    {
      id: "match-open-01",
      matchNo: 2045,
      title: "১ বনাম ১ ক্লাসিক ম্যাচ #2045",
      entryFee: 30,
      prize: 54,
      matchType: "1v1 Classic",
      status: "WAITING",
      creatorId: null,
      creatorPhone: null,
      creatorName: null,
      opponentId: null,
      opponentPhone: null,
      opponentName: null,
      roomCode: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "match-101",
      matchNo: 2041,
      title: "১ বনাম ১ ক্লাসিক ম্যাচ #2041",
      entryFee: 50,
      prize: 90,
      matchType: "1v1 Classic",
      status: "WAITING",
      creatorId: "user-02",
      creatorPhone: "01822222222",
      creatorName: "তানভীর আহমেদ",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "match-102",
      matchNo: 2042,
      title: "১ বনাম ১ ক্লাসিক ম্যাচ #2042",
      entryFee: 100,
      prize: 180,
      matchType: "1v1 Classic",
      status: "RUNNING",
      roomCode: "04821943",
      creatorId: "user-03",
      creatorPhone: "01933333333",
      creatorName: "সোহেল রানা",
      opponentId: "user-01",
      opponentPhone: "01711111111",
      opponentName: "রাকিব হাসান",
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "match-103",
      matchNo: 2043,
      title: "১ বনাম ১ ক্লাসিক ম্যাচ #2043",
      entryFee: 20,
      prize: 36,
      matchType: "1v1 Classic",
      status: "WAITING",
      creatorId: "user-04",
      creatorPhone: "01644444444",
      creatorName: "মিজানুর রহমান",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "match-104",
      matchNo: 2044,
      title: "১ বনাম ১ কুইক লুডো #2044",
      entryFee: 200,
      prize: 360,
      matchType: "Quick Ludo",
      status: "WAITING",
      creatorId: "user-02",
      creatorPhone: "01822222222",
      creatorName: "তানভীর আহমেদ",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "match-105",
      matchNo: 2040,
      title: "১ বনাম ১ ক্লাসিক ম্যাচ #2040",
      entryFee: 100,
      prize: 180,
      matchType: "1v1 Classic",
      status: "COMPLETED",
      roomCode: "02914856",
      creatorId: "user-01",
      creatorPhone: "01711111111",
      creatorName: "রাকিব হাসান",
      opponentId: "user-03",
      opponentPhone: "01933333333",
      opponentName: "সোহেল রানা",
      winnerId: "user-01",
      winnerName: "রাকিব হাসান",
      creatorResult: "WON",
      opponentResult: "LOST",
      createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    }
  ];

  const initialTransactions: Transaction[] = [
    {
      id: "trx-01",
      userId: "user-01",
      userName: "রাকিব হাসান",
      userPhone: "01711111111",
      type: "DEPOSIT",
      amount: 300,
      status: "APPROVED",
      mfsProvider: "BKASH",
      accountNumber: "01711111111",
      trxId: "BLM987123A",
      note: "bKash Deposit Approved",
      createdAt: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 190).toISOString(),
    },
    {
      id: "trx-02",
      userId: "user-01",
      userName: "রাকিব হাসান",
      userPhone: "01711111111",
      type: "MATCH_WIN",
      amount: 180,
      status: "APPROVED",
      note: "Match #2040 Won",
      createdAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    }
  ];

  const initialNotices: Notice[] = [
    {
      id: "notice-01",
      text: "📣 স্বাগতম LudoEarn-এ! বিকাশ, নগদ ও রকেটে দ্রুততম ক্যাশইন ও ক্যাশআউট। খেলা শেষে উইন স্ক্রিনশট অবশ্যই ৫ মিনিটের মধ্যে আপলোড করুন। প্রতারকদের একাউন্ট স্থায়ীভাবে ব্যান করা হবে।",
      isActive: true,
      createdAt: new Date().toISOString(),
    }
  ];

  return {
    users: [adminUser, toasinAdminUser, demoUser, topPlayer1, topPlayer2, topPlayer3],
    matches: initialMatches,
    transactions: initialTransactions,
    notices: initialNotices,
  };
}

export function readDb(): DatabaseSchema {
  if (inMemoryDb) {
    return inMemoryDb;
  }

  ensureDataDir();

  // Try to read existing local .data/db.json first as pre-seed if in serverless and /tmp is not yet initialized
  const seedCandidates = [
    DB_FILE,
    path.join(process.cwd(), ".data", "db.json"),
  ];

  for (const filePath of seedCandidates) {
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(content);
        if (!parsed.notifications) parsed.notifications = [];
        inMemoryDb = parsed;
        // Also persist to DB_FILE (/tmp) if different
        if (filePath !== DB_FILE) {
          try {
            fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), "utf-8");
          } catch {
            // safe to ignore
          }
        }
        return parsed;
      }
    } catch (err) {
      console.warn("Could not read from file path:", filePath, err);
    }
  }

  const initialData = getInitialData();
  inMemoryDb = initialData;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not write initial db to DB_FILE:", err);
  }
  return initialData;
}

export function writeDb(data: DatabaseSchema): void {
  inMemoryDb = data;
  try {
    ensureDataDir();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.warn("Warning: failed to persist DB to file system (operating in-memory):", err);
  }
}

export const db = {
  // Users
  getUsers(): User[] {
    return readDb().users;
  },

  findUserById(id: string): User | undefined {
    return readDb().users.find((u) => u.id === id);
  },

  findUserByPhone(phone: string): User | undefined {
    return readDb().users.find((u) => u.phone === phone);
  },

  findUserByReferCode(code: string): User | undefined {
    return readDb().users.find((u) => u.referCode.toLowerCase() === code.toLowerCase());
  },

  createUser(user: User): User {
    const data = readDb();
    data.users.push(user);
    writeDb(data);
    return user;
  },

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const data = readDb();
    const index = data.users.findIndex((u) => u.id === id);
    if (index === -1) return undefined;
    data.users[index] = { ...data.users[index], ...updates, updatedAt: new Date().toISOString() };
    writeDb(data);
    return data.users[index];
  },

  // Matches
  getMatches(): Match[] {
    return readDb().matches;
  },

  findMatchById(id: string): Match | undefined {
    return readDb().matches.find((m) => m.id === id);
  },

  createMatch(match: Match): Match {
    const data = readDb();
    data.matches.unshift(match);
    writeDb(data);
    return match;
  },

  updateMatch(id: string, updates: Partial<Match>): Match | undefined {
    const data = readDb();
    const index = data.matches.findIndex((m) => m.id === id);
    if (index === -1) return undefined;
    data.matches[index] = { ...data.matches[index], ...updates, updatedAt: new Date().toISOString() };
    writeDb(data);
    return data.matches[index];
  },

  deleteMatch(id: string): boolean {
    const data = readDb();
    const prevLength = data.matches.length;
    data.matches = data.matches.filter((m) => m.id !== id);
    if (data.matches.length !== prevLength) {
      writeDb(data);
      return true;
    }
    return false;
  },

  // Transactions
  getTransactions(): Transaction[] {
    return readDb().transactions;
  },

  getTransactionsByUserId(userId: string): Transaction[] {
    return readDb().transactions.filter((t) => t.userId === userId);
  },

  findTransactionById(id: string): Transaction | undefined {
    return readDb().transactions.find((t) => t.id === id);
  },

  createTransaction(transaction: Transaction): Transaction {
    const data = readDb();
    data.transactions.unshift(transaction);
    writeDb(data);
    return transaction;
  },

  updateTransaction(id: string, updates: Partial<Transaction>): Transaction | undefined {
    const data = readDb();
    const index = data.transactions.findIndex((t) => t.id === id);
    if (index === -1) return undefined;
    data.transactions[index] = { ...data.transactions[index], ...updates, updatedAt: new Date().toISOString() };
    writeDb(data);
    return data.transactions[index];
  },

  // Notices
  getActiveNotice(): Notice | undefined {
    return readDb().notices.find((n) => n.isActive);
  },

  updateNotice(text: string): Notice {
    const data = readDb();
    if (data.notices.length > 0) {
      data.notices[0].text = text;
      data.notices[0].isActive = true;
    } else {
      data.notices.push({
        id: "notice-01",
        text,
        isActive: true,
        createdAt: new Date().toISOString(),
      });
    }
    writeDb(data);
    return data.notices[0];
  },

  // Notifications
  getNotifications(userId?: string): AppNotification[] {
    const data = readDb();
    const list = data.notifications || [];
    if (!userId) return list;
    return list
      .filter((n) => n.userId === userId || n.userId === "ALL")
      .map((n) => {
        if (n.userId === "ALL") {
          const isRead = Boolean(n.readByUsers && n.readByUsers.includes(userId));
          return { ...n, isRead };
        }
        return n;
      });
  },

  createNotification(
    notification: Omit<AppNotification, "id" | "isRead" | "createdAt"> &
      Partial<Pick<AppNotification, "id" | "isRead" | "createdAt">>
  ): AppNotification {
    const data = readDb();
    if (!data.notifications) data.notifications = [];
    const completeNotification: AppNotification = {
      id: notification.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      link: notification.link || null,
      isRead: notification.isRead ?? false,
      readByUsers: notification.readByUsers || [],
      createdAt: notification.createdAt || new Date().toISOString(),
    };
    data.notifications.unshift(completeNotification);
    writeDb(data);
    return completeNotification;
  },

  markNotificationAsRead(id: string, userId?: string): void {
    const data = readDb();
    if (!data.notifications) return;
    const n = data.notifications.find((x) => x.id === id);
    if (n) {
      if (n.userId === "ALL" && userId) {
        if (!n.readByUsers) n.readByUsers = [];
        if (!n.readByUsers.includes(userId)) {
          n.readByUsers.push(userId);
        }
      } else {
        n.isRead = true;
      }
      writeDb(data);
    }
  },

  markAllNotificationsAsRead(userId: string): void {
    const data = readDb();
    if (!data.notifications) return;
    for (const n of data.notifications) {
      if (n.userId === userId) {
        n.isRead = true;
      } else if (n.userId === "ALL") {
        if (!n.readByUsers) n.readByUsers = [];
        if (!n.readByUsers.includes(userId)) {
          n.readByUsers.push(userId);
        }
      }
    }
    writeDb(data);
  },

  deleteNotification(id: string): boolean {
    const data = readDb();
    if (!data.notifications) return false;
    const initialLen = data.notifications.length;
    data.notifications = data.notifications.filter((n) => n.id !== id);
    if (data.notifications.length !== initialLen) {
      writeDb(data);
      return true;
    }
    return false;
  },
};

