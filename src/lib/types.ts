export type Role = "USER" | "ADMIN";

export type MatchStatus = "WAITING" | "RUNNING" | "COMPLETED" | "DISPUTED" | "CANCELLED";

export type TransactionType = "DEPOSIT" | "WITHDRAW" | "MATCH_FEE" | "MATCH_WIN" | "REFERRAL_BONUS";

export type TransactionStatus = "PENDING" | "APPROVED" | "REJECTED";

export type MfsProvider = "BKASH" | "NAGAD" | "ROCKET" | "UPAY";

export interface User {
  id: string;
  phone: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: Role;
  mainBalance: number;
  winBalance: number;
  referCode: string;
  referredBy?: string | null;
  avatar?: string | null;
  isBanned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Match {
  id: string;
  matchNo: number;
  title: string;
  entryFee: number;
  prize: number;
  matchType: string;
  status: MatchStatus;
  roomCode?: string | null;
  creatorId?: string | null;
  creatorPhone?: string | null;
  creatorName?: string | null;
  creatorMfs?: string | null;
  creatorSenderPhone?: string | null;
  creatorTrxId?: string | null;
  opponentId?: string | null;
  opponentPhone?: string | null;
  opponentName?: string | null;
  opponentMfs?: string | null;
  opponentSenderPhone?: string | null;
  opponentTrxId?: string | null;
  winnerId?: string | null;
  winnerName?: string | null;
  creatorResult?: "WON" | "LOST" | "DISPUTE" | null;
  opponentResult?: "WON" | "LOST" | "DISPUTE" | null;
  creatorProofUrl?: string | null;
  opponentProofUrl?: string | null;
  disputeReason?: string | null;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  userName?: string;
  userPhone?: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  mfsProvider?: MfsProvider | null;
  accountType?: string | null;
  accountNumber?: string | null;
  trxId?: string | null;
  adminTrxId?: string | null;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Notice {
  id: string;
  text: string;
  isActive: boolean;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  phonePartial: string;
  totalEarnings: number;
  matchesWon: number;
  winRate: number;
  avatar?: string | null;
}

export interface AppNotification {
  id: string;
  userId: string; // specific user ID or "ALL"
  title: string;
  message: string;
  type:
    | "ROOM_CODE"
    | "DEPOSIT"
    | "WITHDRAW"
    | "WIN"
    | "ANNOUNCEMENT"
    | "SYSTEM"
    | "SUCCESS"
    | "ALERT"
    | "INFO"
    | "PROMO";
  link?: string | null;
  isRead: boolean;
  readByUsers?: string[];
  createdAt: string;
}

