"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/common/ToastContext";
import {
  Shield,
  ArrowDownCircle,
  ArrowUpCircle,
  Swords,
  Users,
  Bell,
  Check,
  X,
  Plus,
  RefreshCw,
  Home,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Ban,
  DollarSign,
  Copy,
  ExternalLink,
  Search,
  Filter,
  Eye,
  Key,
  UserCheck,
  Sparkles,
  Award,
  ChevronRight,
  TrendingUp,
  Activity,
  Trash2,
} from "lucide-react";

function AdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab") as any;
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<
    "OVERVIEW" | "DEPOSITS" | "WITHDRAWALS" | "MATCHES" | "USERS" | "TICKER"
  >(() => {
    if (urlTab && ["OVERVIEW", "DEPOSITS", "WITHDRAWALS", "MATCHES", "USERS", "TICKER"].includes(urlTab)) {
      return urlTab;
    }
    return "OVERVIEW";
  });

  useEffect(() => {
    if (urlTab && ["OVERVIEW", "DEPOSITS", "WITHDRAWALS", "MATCHES", "USERS", "TICKER"].includes(urlTab)) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  // Overview stats & collections
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Tab 2: Deposits state
  const [depositsList, setDepositsList] = useState<any[]>([]);
  const [depositFilter, setDepositFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [depositSearch, setDepositSearch] = useState("");
  const [depositMfs, setDepositMfs] = useState("ALL");
  const [loadingDeposits, setLoadingDeposits] = useState(false);

  // Reject deposit modal
  const [rejectDepositId, setRejectDepositId] = useState<string | null>(null);
  const [rejectDepositReason, setRejectDepositReason] = useState("ভুল TrxID বা অ্যাকাউন্টে টাকা পাওয়া যায়নি");

  // Tab 3: Withdrawals state
  const [withdrawalsList, setWithdrawalsList] = useState<any[]>([]);
  const [withdrawFilter, setWithdrawFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [withdrawSearch, setWithdrawSearch] = useState("");
  const [withdrawMfs, setWithdrawMfs] = useState("ALL");
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);

  // Approve payout modal
  const [payoutTrxModalId, setPayoutTrxModalId] = useState<string | null>(null);
  const [payoutTrxNumber, setPayoutTrxNumber] = useState("");

  // Reject payout modal
  const [rejectWithdrawId, setRejectWithdrawId] = useState<string | null>(null);
  const [rejectWithdrawReason, setRejectWithdrawReason] = useState("প্রদত্ত নম্বর ভুল বা বিকাশ/নগদে ক্যাশআউট সমস্যা");

  // Tab 4: Matches state
  const [matchesList, setMatchesList] = useState<any[]>([]);
  const [matchFilter, setMatchFilter] = useState<
    "ALL" | "NO_ROOM_CODE" | "PROOFS" | "DISPUTED" | "WAITING" | "RUNNING" | "COMPLETED" | "CANCELLED"
  >("ALL");
  const [matchSearch, setMatchSearch] = useState("");
  const [loadingMatches, setLoadingMatches] = useState(false);

  // Room code map
  const [roomCodeMap, setRoomCodeMap] = useState<Record<string, string>>({});

  // Create match form
  const [showCreateMatch, setShowCreateMatch] = useState(false);
  const [newFee, setNewFee] = useState("50");
  const [newPrize, setNewPrize] = useState("90");
  const [newType, setNewType] = useState("1v1 Classic");
  const [newMatchTitle, setNewMatchTitle] = useState("");

  // Screenshot preview modal
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");

  // Tab 5: Users state
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("ALL");
  const [userStatusFilter, setUserStatusFilter] = useState("ALL");
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Balance adjustment modal
  const [adjustUserId, setAdjustUserId] = useState<string | null>(null);
  const [adjustTargetUser, setAdjustTargetUser] = useState<any>(null);
  const [adjustAmount, setAdjustAmount] = useState("100");
  const [adjustType, setAdjustType] = useState<"MAIN" | "WIN">("MAIN");
  const [adjustNote, setAdjustNote] = useState("অ্যাডমিন কর্তৃক ব্যালেন্স সমন্বয়");

  // Reset password modal
  const [resetPassUserId, setResetPassUserId] = useState<string | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState("");

  // Tab 6: Ticker & Broadcast state
  const [tickerText, setTickerText] = useState("");
  const [debouncedTickerPreview, setDebouncedTickerPreview] = useState("");
  const [savingTicker, setSavingTicker] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastType, setBroadcastType] = useState<"INFO" | "SUCCESS" | "ALERT" | "PROMO">("INFO");
  const [broadcastLink, setBroadcastLink] = useState("");
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [adminNotifications, setAdminNotifications] = useState<any[]>([]);
  const [loadingAdminNotifs, setLoadingAdminNotifs] = useState(false);

  // Guard refs to prevent typing flickering and unwanted resets
  const isEditingTickerRef = useRef(false);
  const tickerLoadedRef = useRef(false);

  // Debounce live ticker preview so typing never resets or flickers the CSS marquee animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTickerPreview(tickerText);
    }, 250);
    return () => clearTimeout(timer);
  }, [tickerText]);

  const [submittingRoomCodeId, setSubmittingRoomCodeId] = useState<string | null>(null);

  // Filter Refs to avoid stale closures during background polling
  const matchFilterRef = useRef(matchFilter);
  const matchSearchRef = useRef(matchSearch);
  const depositFilterRef = useRef(depositFilter);
  const depositMfsRef = useRef(depositMfs);
  const depositSearchRef = useRef(depositSearch);
  const withdrawFilterRef = useRef(withdrawFilter);
  const withdrawMfsRef = useRef(withdrawMfs);
  const withdrawSearchRef = useRef(withdrawSearch);
  const userSearchRef = useRef(userSearch);
  const userRoleFilterRef = useRef(userRoleFilter);
  const userStatusFilterRef = useRef(userStatusFilter);

  useEffect(() => { matchFilterRef.current = matchFilter; }, [matchFilter]);
  useEffect(() => { matchSearchRef.current = matchSearch; }, [matchSearch]);
  useEffect(() => { depositFilterRef.current = depositFilter; }, [depositFilter]);
  useEffect(() => { depositMfsRef.current = depositMfs; }, [depositMfs]);
  useEffect(() => { depositSearchRef.current = depositSearch; }, [depositSearch]);
  useEffect(() => { withdrawFilterRef.current = withdrawFilter; }, [withdrawFilter]);
  useEffect(() => { withdrawMfsRef.current = withdrawMfs; }, [withdrawMfs]);
  useEffect(() => { withdrawSearchRef.current = withdrawSearch; }, [withdrawSearch]);
  useEffect(() => { userSearchRef.current = userSearch; }, [userSearch]);
  useEffect(() => { userRoleFilterRef.current = userRoleFilter; }, [userRoleFilter]);
  useEffect(() => { userStatusFilterRef.current = userStatusFilter; }, [userStatusFilter]);

  // Copy helper
  const copyToClipboard = (text: string, label = "কপি করা হয়েছে!") => {
    navigator.clipboard.writeText(text);
    showToast(label, "success");
  };

  // Fetch Overview Data (silent mode avoids screen flickering)
  const fetchOverviewData = async (options?: boolean | any) => {
    const isSilent = typeof options === "boolean" ? options : false;
    if (!isSilent) setLoading(true);
    try {
      const res = await fetch("/api/admin/overview");
      if (res.status === 403 || res.status === 401) {
        showToast("অননুমোদিত এক্সেস। এডমিন একাউন্টে লগইন করুন (01700000000 / admin123)", "error");
        router.push("/login?redirect=/admin");
        return;
      }
      const d = await res.json();
      setData(d);
      // Only set tickerText initially or when tab is freshly opened - NEVER while admin is typing!
      if (!tickerLoadedRef.current && !isEditingTickerRef.current) {
        setTickerText(d.notice || "");
        setDebouncedTickerPreview(d.notice || "");
        tickerLoadedRef.current = true;
      }
    } catch (err) {
      console.error("Failed to load admin overview:", err);
      if (!isSilent) showToast("এডমিন ডেটা লোড করতে সমস্যা হয়েছে", "error");
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  // Fetch Deposits
  const fetchDeposits = async (options?: boolean | any) => {
    const isSilent = typeof options === "boolean" ? options : false;
    if (!isSilent) setLoadingDeposits(true);
    try {
      const params = new URLSearchParams();
      if (depositFilterRef.current) params.set("status", depositFilterRef.current);
      if (depositMfsRef.current) params.set("mfs", depositMfsRef.current);
      if (depositSearchRef.current) params.set("search", depositSearchRef.current);

      const res = await fetch(`/api/admin/deposits?${params.toString()}`);
      if (res.ok) {
        const d = await res.json();
        setDepositsList(d.deposits || []);
      }
    } catch (err) {
      console.error("Failed to fetch deposits:", err);
    } finally {
      if (!isSilent) setLoadingDeposits(false);
    }
  };

  // Fetch Withdrawals
  const fetchWithdrawals = async (options?: boolean | any) => {
    const isSilent = typeof options === "boolean" ? options : false;
    if (!isSilent) setLoadingWithdrawals(true);
    try {
      const params = new URLSearchParams();
      if (withdrawFilterRef.current) params.set("status", withdrawFilterRef.current);
      if (withdrawMfsRef.current) params.set("mfs", withdrawMfsRef.current);
      if (withdrawSearchRef.current) params.set("search", withdrawSearchRef.current);

      const res = await fetch(`/api/admin/withdrawals?${params.toString()}`);
      if (res.ok) {
        const d = await res.json();
        setWithdrawalsList(d.withdrawals || []);
      }
    } catch (err) {
      console.error("Failed to fetch withdrawals:", err);
    } finally {
      if (!isSilent) setLoadingWithdrawals(false);
    }
  };

  // Fetch Matches
  const fetchMatches = async (statusOverride?: string | any, options?: boolean | any) => {
    const activeStatus = typeof statusOverride === "string" ? statusOverride : matchFilterRef.current;
    const isSilent = typeof options === "boolean" ? options : false;
    if (!isSilent) setLoadingMatches(true);
    try {
      const params = new URLSearchParams();
      if (activeStatus) params.set("status", activeStatus);
      if (matchSearchRef.current) params.set("search", matchSearchRef.current);

      const res = await fetch(`/api/admin/matches?${params.toString()}`);
      if (res.ok) {
        const d = await res.json();
        setMatchesList(d.matches || []);
      }
    } catch (err) {
      console.error("Failed to fetch matches:", err);
    } finally {
      if (!isSilent) setLoadingMatches(false);
    }
  };

  // Fetch Users
  const fetchUsers = async (options?: boolean | any) => {
    const isSilent = typeof options === "boolean" ? options : false;
    if (!isSilent) setLoadingUsers(true);
    try {
      const params = new URLSearchParams();
      if (userSearchRef.current) params.set("search", userSearchRef.current);
      if (userRoleFilterRef.current) params.set("role", userRoleFilterRef.current);
      if (userStatusFilterRef.current) params.set("status", userStatusFilterRef.current);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (res.ok) {
        const d = await res.json();
        setUsersList(d.users || []);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      if (!isSilent) setLoadingUsers(false);
    }
  };

  // Fetch all notifications for admin history & control
  const fetchAdminNotifications = async (isSilent = false) => {
    try {
      if (!isSilent) setLoadingAdminNotifs(true);
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const d = await res.json();
        setAdminNotifications(d.notifications || []);
      }
    } catch {
      // ignore
    } finally {
      if (!isSilent) setLoadingAdminNotifs(false);
    }
  };

  // Delete notification
  const handleDeleteNotification = async (notifId: string) => {
    if (!confirm("আপনি কি নিশ্চিত এই নোটিফিকেশনটি মুছে ফেলতে চান?")) return;
    try {
      const res = await fetch(`/api/notifications?id=${encodeURIComponent(notifId)}`, {
        method: "DELETE",
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "মুছে ফেলা যায়নি");
      showToast(d.message || "নোটিফিকেশন সফলভাবে মুছে ফেলা হয়েছে!", "success");
      setAdminNotifications((prev) => prev.filter((n) => n.id !== notifId));
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  // Tab switch effect (explicit loader when user clicks a new tab)
  useEffect(() => {
    fetchOverviewData(false);
    if (activeTab === "DEPOSITS") fetchDeposits(false);
    if (activeTab === "WITHDRAWALS") fetchWithdrawals(false);
    if (activeTab === "MATCHES") fetchMatches(matchFilterRef.current, false);
    if (activeTab === "USERS") fetchUsers(false);
    if (activeTab === "TICKER") fetchAdminNotifications(false);
  }, [activeTab]);

  // Live background polling (silent, never flickers or unmounts DOM)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOverviewData(true);
      if (activeTab === "DEPOSITS") fetchDeposits(true);
      if (activeTab === "WITHDRAWALS") fetchWithdrawals(true);
      if (activeTab === "MATCHES") fetchMatches(matchFilterRef.current, true);
      if (activeTab === "USERS") fetchUsers(true);
      if (activeTab === "TICKER") fetchAdminNotifications(true);
    }, 6000);

    return () => clearInterval(interval);
  }, [activeTab]);

  // Handle Deposit Actions
  const handleApproveDeposit = async (transactionId: string) => {
    try {
      const res = await fetch("/api/admin/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId, action: "APPROVE" }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "ডিপোজিট অনুমোদন ব্যর্থ");
      showToast(resData.message, "success");
      fetchDeposits();
      fetchOverviewData();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleConfirmRejectDeposit = async () => {
    if (!rejectDepositId) return;
    try {
      const res = await fetch("/api/admin/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: rejectDepositId,
          action: "REJECT",
          reason: rejectDepositReason,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "বাতিলকরণ ব্যর্থ");
      showToast(resData.message, "success");
      setRejectDepositId(null);
      fetchDeposits();
      fetchOverviewData();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  // Handle Withdrawal Actions
  const handleConfirmApprovePayout = async () => {
    if (!payoutTrxModalId) return;
    try {
      const res = await fetch("/api/admin/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: payoutTrxModalId,
          action: "APPROVE",
          adminTrxId: payoutTrxNumber.trim() || undefined,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "অনুমোদন ব্যর্থ");
      showToast(resData.message, "success");
      setPayoutTrxModalId(null);
      setPayoutTrxNumber("");
      fetchWithdrawals();
      fetchOverviewData();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleConfirmRejectPayout = async () => {
    if (!rejectWithdrawId) return;
    try {
      const res = await fetch("/api/admin/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: rejectWithdrawId,
          action: "REJECT",
          reason: rejectWithdrawReason,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "বাতিলকরণ ব্যর্থ");
      showToast(resData.message, "success");
      setRejectWithdrawId(null);
      fetchWithdrawals();
      fetchOverviewData();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  // Handle Match Actions
  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const fee = Number(newFee);
      const pr = Number(newPrize) || Math.round(fee * 2 * 0.9);
      const res = await fetch("/api/admin/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE",
          entryFee: fee,
          prize: pr,
          matchType: newType,
          title: newMatchTitle || undefined,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "ম্যাচ তৈরি ব্যর্থ");
      showToast(resData.message, "success");
      setShowCreateMatch(false);
      setNewMatchTitle("");
      fetchMatches();
      fetchOverviewData();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleSetRoomCode = async (matchId: string, customCode?: string) => {
    const raw = customCode !== undefined ? customCode : roomCodeMap[matchId];
    const code = (raw || "").trim().replace(/\s+/g, "");
    if (!code || code.length < 4) {
      showToast("সঠিক Ludo King রুম কোড লিখুন (যেমন: 08421943)", "error");
      return;
    }
    setSubmittingRoomCodeId(matchId);
    try {
      const res = await fetch("/api/admin/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SET_ROOM_CODE",
          matchId,
          roomCode: code,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "রুম কোড সেভ করা যায়নি");
      showToast(resData.message || "রুম আইডি সফলভাবে পাঠানো হয়েছে!", "success");

      // Optimistic update in local state immediately
      setRoomCodeMap((prev) => ({ ...prev, [matchId]: code }));
      setMatchesList((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, roomCode: code } : m))
      );

      // Silent sync with server
      fetchMatches(matchFilterRef.current, true);
      fetchOverviewData(true);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSubmittingRoomCodeId(null);
    }
  };

  const handleResolveWinner = async (matchId: string, winnerId: string, winnerName: string) => {
    if (!confirm(`আপনি কি নিশ্চিত ${winnerName}-কে বিজয়ী হিসেবে ঘোষণা করবেন এবং পুরস্কার ক্রেডিট করবেন?`)) return;
    try {
      const res = await fetch("/api/admin/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RESOLVE_WINNER", matchId, winnerId }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error);
      showToast(resData.message, "success");
      fetchMatches();
      fetchOverviewData();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleCancelMatch = async (matchId: string) => {
    if (!confirm("ম্যাচটি বাতিল করে উভয় খেলোয়াড়ের এন্ট্রি ফি রিফান্ড করতে চান?")) return;
    try {
      const res = await fetch("/api/admin/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CANCEL_REFUND", matchId }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error);
      showToast(resData.message, "success");
      fetchMatches();
      fetchOverviewData();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm("আপনি কি নিশ্চিত এই ম্যাচটি স্থায়ীভাবে মুছে ফেলতে চান?")) return;
    try {
      const res = await fetch("/api/admin/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DELETE", matchId }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error);
      showToast(resData.message, "success");
      fetchMatches();
      fetchOverviewData();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  // Handle User Actions
  const handleToggleBan = async (userId: string, userName: string, isBanned: boolean) => {
    const actionText = isBanned ? "আনব্যান" : "ব্যান";
    if (!confirm(`আপনি কি নিশ্চিত ${userName}-কে ${actionText} করতে চান?`)) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "TOGGLE_BAN", userId }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error);
      showToast(resData.message, "success");
      fetchUsers();
      fetchOverviewData();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustUserId) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADJUST_BALANCE",
          userId: adjustUserId,
          amount: Number(adjustAmount),
          balanceType: adjustType,
          note: adjustNote,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error);
      showToast(resData.message, "success");
      setAdjustUserId(null);
      fetchUsers();
      fetchOverviewData();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassUserId || !newPasswordVal) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RESET_PASSWORD",
          userId: resetPassUserId,
          newPassword: newPasswordVal,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error);
      showToast(resData.message, "success");
      setResetPassUserId(null);
      setNewPasswordVal("");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  // Handle Ticker
  const handleUpdateTicker = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTicker(true);
    try {
      const res = await fetch("/api/admin/ticker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: tickerText }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error);
      showToast(resData.message || "নোটিশ সফলভাবে আপডেট ও প্লেয়ারদের কাছে পৌঁছে দেওয়া হয়েছে!", "success");
      isEditingTickerRef.current = false;
      tickerLoadedRef.current = true;
      setDebouncedTickerPreview(tickerText);
      fetchAdminNotifications(true);
      fetchOverviewData(true);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSavingTicker(false);
    }
  };

  // Handle Broadcast In-App Notification
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      showToast("টাইটেল ও বার্তা লিখুন", "error");
      return;
    }
    setSendingBroadcast(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "BROADCAST",
          title: broadcastTitle,
          message: broadcastMessage,
          type: broadcastType,
          link: broadcastLink || undefined,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "নোটিফিকেশন পাঠানো যায়নি");
      showToast(resData.message || "সকল ইউজারের কাছে নোটিফিকেশন পৌঁছে গেছে!", "success");
      setBroadcastTitle("");
      setBroadcastMessage("");
      setBroadcastLink("");
      setTickerText(broadcastMessage.trim());
      setDebouncedTickerPreview(broadcastMessage.trim());
      tickerLoadedRef.current = true;
      isEditingTickerRef.current = false;
      fetchAdminNotifications(true);
      fetchOverviewData(true);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSendingBroadcast(false);
    }
  };

  const tabs = [
    { id: "OVERVIEW", label: "ওভারভিউ", icon: Shield, badge: null, badgeColor: "" },
    {
      id: "DEPOSITS",
      label: "ডিপোজিট",
      icon: ArrowDownCircle,
      badge: data?.stats?.pendingDepositsCount || 0,
      badgeColor: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40",
    },
    {
      id: "WITHDRAWALS",
      label: "উইথড্র",
      icon: ArrowUpCircle,
      badge: data?.stats?.pendingWithdrawalsCount || 0,
      badgeColor: "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40",
    },
    {
      id: "MATCHES",
      label: "ম্যাচ ও রুম কোড",
      icon: Swords,
      badge:
        (data?.stats?.matchesAwaitingRoomCodeCount || 0) +
        (data?.stats?.matchesWithProofCount || 0) +
        (data?.stats?.disputedMatchesCount || 0),
      badgeColor:
        (data?.stats?.matchesWithProofCount || 0) > 0
          ? "bg-emerald-500 text-slate-950 border border-emerald-400 font-black animate-pulse"
          : (data?.stats?.matchesAwaitingRoomCodeCount || 0) > 0
          ? "bg-amber-500 text-slate-950 border border-amber-400 font-black animate-pulse"
          : "bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse",
    },
    { id: "USERS", label: "ইউজার", icon: Users, badge: null, badgeColor: "" },
    { id: "TICKER", label: "ঘোষণা ও নোটিশ", icon: Bell, badge: null, badgeColor: "" },
  ];

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col max-w-4xl mx-auto border-x border-[#1a2333] shadow-2xl relative font-sans">
      {/* Background Ambience Glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-48 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#070b14]/95 backdrop-blur-md border-b border-[#1a2333] p-3 sm:p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0d1527] to-[#121d33] border border-cyan-500/30 p-1 flex items-center justify-center shadow-lg shadow-cyan-500/10">
              <Image
                src="/newlogo.png"
                alt="LudoStar BD"
                width={36}
                height={36}
                className="object-contain w-full h-full"
              />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#070b14]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-white tracking-wide">
                LudoStar BD Admin Suite
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                PRO PANEL
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>সরাসরি সার্ভার ও পেমেন্ট কন্ট্রোল প্যানেল</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchOverviewData();
              if (activeTab === "DEPOSITS") fetchDeposits();
              if (activeTab === "WITHDRAWALS") fetchWithdrawals();
              if (activeTab === "MATCHES") fetchMatches();
              if (activeTab === "USERS") fetchUsers();
              showToast("ডেটা রিফ্রেশ করা হয়েছে", "info");
            }}
            className="p-2 rounded-xl bg-[#0d1527] border border-[#1a2333] text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition-all shadow-sm"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-cyan-400" : ""}`} />
          </button>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 text-cyan-300 hover:text-white hover:border-cyan-400 transition-all shadow-sm"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">অ্যাপে ফিরে যান</span>
          </Link>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="flex gap-1.5 overflow-x-auto p-2 sm:p-3 bg-[#0a0f1d] border-b border-[#1a2333] scrollbar-none sticky top-[65px] z-30">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all select-none ${
                isActive
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/25"
                  : "bg-[#0d1527] text-slate-400 hover:text-slate-200 border border-[#1a2333] hover:border-cyan-500/30"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-slate-950" : "text-cyan-400"}`} />
              <span>{t.label}</span>
              {t.badge !== null && t.badge > 0 && (
                <span
                  className={`ml-0.5 text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isActive ? "bg-slate-950 text-cyan-300" : t.badgeColor
                  }`}
                >
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Body */}
      <main className="p-3.5 sm:p-5 flex-1 space-y-5">
        {/* ======================= TAB 1: OVERVIEW ======================= */}
        {activeTab === "OVERVIEW" && (
          <div className="space-y-5">
            {/* KPI Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Users */}
              <div className="p-4 rounded-2xl bg-[#0d1527] border border-[#1a2333] relative overflow-hidden group hover:border-cyan-500/40 transition-all">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider">মোট ইউজার</span>
                  <Users className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-2xl font-black text-white font-mono">
                  {data?.stats?.totalUsers ?? 0}
                </div>
                <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>সক্রিয়: {data?.stats?.activeUsers ?? 0} জন</span>
                </div>
              </div>

              {/* Total Approved Deposits */}
              <div className="p-4 rounded-2xl bg-[#0d1527] border border-[#1a2333] relative overflow-hidden group hover:border-emerald-500/40 transition-all">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                    মোট ডিপোজিট
                  </span>
                  <ArrowDownCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-emerald-400 font-mono">
                  ৳{(data?.stats?.totalDepositAmount ?? 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">সফল ও অ্যাকাউন্টে জমা</div>
              </div>

              {/* Total Withdrawals Paid */}
              <div className="p-4 rounded-2xl bg-[#0d1527] border border-[#1a2333] relative overflow-hidden group hover:border-blue-500/40 transition-all">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                    উইথড্র প্রদান
                  </span>
                  <ArrowUpCircle className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-black text-blue-400 font-mono">
                  ৳{(data?.stats?.totalWithdrawAmount ?? 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">প্লেয়ারদের ক্যাশআউট পেইড</div>
              </div>

              {/* Platform Rake / Profit */}
              <div className="p-4 rounded-2xl bg-[#0d1527] border border-cyan-500/30 relative overflow-hidden shadow-lg shadow-cyan-500/5">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">
                    প্ল্যাটফর্ম কমিশন
                  </span>
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-2xl font-black text-cyan-300 font-mono">
                  ৳{(data?.stats?.totalPlatformRake ?? 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-cyan-400/80 mt-1">ম্যাচ হোস্ট ফি (১০% রেইক)</div>
              </div>
            </div>

            {/* Urgent Alert Banners if pending items exist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Pending Deposits Card */}
              <div
                onClick={() => {
                  setDepositFilter("PENDING");
                  setActiveTab("DEPOSITS");
                }}
                className="p-4 rounded-2xl bg-gradient-to-br from-[#0d1527] to-[#121c33] border border-amber-500/30 hover:border-amber-400 cursor-pointer transition-all flex items-center justify-between group shadow-md"
              >
                <div>
                  <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                    পেন্ডিং ডিপোজিট/পেমেন্ট
                  </div>
                  <div className="text-xl font-black text-white font-mono mt-0.5">
                    {data?.stats?.pendingDepositsCount ?? 0} টি
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                    মোট ৳{(data?.stats?.pendingDepositAmount ?? 0).toLocaleString()}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                  <ArrowDownCircle className="w-5 h-5" />
                </div>
              </div>

              {/* Room Code Awaiting Card */}
              <div
                onClick={() => {
                  setMatchFilter("NO_ROOM_CODE");
                  matchFilterRef.current = "NO_ROOM_CODE";
                  setActiveTab("MATCHES");
                  fetchMatches("NO_ROOM_CODE", false);
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group shadow-md ${
                  (data?.stats?.matchesAwaitingRoomCodeCount || 0) > 0
                    ? "bg-gradient-to-br from-amber-950/40 to-[#0d1527] border-amber-500/60 hover:border-amber-400 shadow-amber-500/10"
                    : "bg-[#0d1527] border-[#1a2333] hover:border-slate-700"
                }`}
              >
                <div>
                  <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                    রুম কোড দেওয়া বাকি
                  </div>
                  <div className="text-xl font-black text-white font-mono mt-0.5">
                    {data?.stats?.matchesAwaitingRoomCodeCount ?? 0} টি ম্যাচ
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {(data?.stats?.matchesAwaitingRoomCodeCount || 0) > 0
                      ? "খেলোয়াড়রা অপেক্ষায়"
                      : "সব ম্যাচ সুশৃঙ্খল"}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                  <Key className="w-5 h-5" />
                </div>
              </div>

              {/* Pending Withdrawals Card */}
              <div
                onClick={() => {
                  setWithdrawFilter("PENDING");
                  setActiveTab("WITHDRAWALS");
                }}
                className="p-4 rounded-2xl bg-gradient-to-br from-[#0d1527] to-[#121c33] border border-cyan-500/30 hover:border-cyan-400 cursor-pointer transition-all flex items-center justify-between group shadow-md"
              >
                <div>
                  <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                    পেন্ডিং উইথড্র
                  </div>
                  <div className="text-xl font-black text-white font-mono mt-0.5">
                    {data?.stats?.pendingWithdrawalsCount ?? 0} টি
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                    মোট ৳{(data?.stats?.pendingWithdrawAmount ?? 0).toLocaleString()}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                  <ArrowUpCircle className="w-5 h-5" />
                </div>
              </div>

              {/* Disputed / Proof Matches Card */}
              <div
                onClick={() => {
                  setMatchFilter("PROOFS");
                  matchFilterRef.current = "PROOFS";
                  setActiveTab("MATCHES");
                  fetchMatches("PROOFS", false);
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group shadow-md ${
                  ((data?.stats?.disputedMatchesCount || 0) + (data?.stats?.matchesWithProofCount || 0)) > 0
                    ? "bg-gradient-to-br from-red-950/40 to-[#0d1527] border-red-500/50 hover:border-red-400"
                    : "bg-[#0d1527] border-[#1a2333] hover:border-slate-700"
                }`}
              >
                <div>
                  <div className="text-[11px] font-bold text-red-400 uppercase tracking-wider">
                    উইনিং প্রুফ ও বিরোধ
                  </div>
                  <div className="text-xl font-black text-white font-mono mt-0.5">
                    {((data?.stats?.disputedMatchesCount || 0) + (data?.stats?.matchesWithProofCount || 0))} টি
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {((data?.stats?.disputedMatchesCount || 0) + (data?.stats?.matchesWithProofCount || 0)) > 0
                      ? "স্ক্রিনশট যাচাই প্রয়োজন"
                      : "সব ম্যাচ সুশৃঙ্খল"}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Direct Room Code & Payment Assignment Queue */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#0d1527] border border-amber-500/30 space-y-3.5 shadow-xl shadow-amber-500/5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>রুম কোড প্রদান ও পেমেন্ট ভেরিফিকেশন কিউ ({data?.matchesAwaitingRoomCode?.length || 0})</span>
                </h3>
                <button
                  onClick={() => {
                    setMatchFilter("NO_ROOM_CODE");
                    matchFilterRef.current = "NO_ROOM_CODE";
                    setActiveTab("MATCHES");
                    fetchMatches("NO_ROOM_CODE", false);
                  }}
                  className="text-[11px] text-cyan-400 hover:underline font-bold flex items-center gap-0.5"
                >
                  সব ম্যাচ দেখুন <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {!data?.matchesAwaitingRoomCode || data.matchesAwaitingRoomCode.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 bg-[#0a0f1d] rounded-xl border border-[#1a2333]">
                  🎉 চমৎকার! বর্তমানে কোনো ম্যাচে রুম কোড দেওয়া বাকি নেই। সব চলমান ম্যাচ চালু আছে।
                </div>
              ) : (
                <div className="space-y-3">
                  {data.matchesAwaitingRoomCode.map((m: any) => (
                    <div
                      key={m.id}
                      className="p-3.5 sm:p-4 rounded-xl bg-[#0a0f1d] border border-amber-500/40 space-y-3 shadow-md"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-white">{m.title}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                            {m.creatorId && m.opponentId ? "২/২ জন জয়েন (সিট পূর্ণ)" : "১/২ জন জয়েন"}
                          </span>
                        </div>
                        <div className="text-xs font-mono font-bold text-cyan-400">
                          ফি: ৳{m.entryFee} • প্রাইজ: ৳{m.prize} • মোড: {m.matchType}
                        </div>
                      </div>

                      {/* Players Info Box */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {/* Player 1 (Host) */}
                        <div className="p-2.5 rounded-lg bg-[#060a14] border border-[#1a2333] space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400 font-bold">হোস্ট (১ম প্লেয়ার):</span>
                            <span className="font-black text-white">{m.creatorName || "ইউজার"}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                            <span>ফোন: {m.creatorPhone || "—"}</span>
                            {m.creatorPhone && (
                              <button
                                onClick={() => copyToClipboard(m.creatorPhone, "হোস্ট নম্বর কপি হয়েছে")}
                                className="text-cyan-400 hover:text-cyan-300"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          {m.creatorTrxId && (
                            <div className="text-[10px] text-amber-400 font-mono flex items-center justify-between font-bold bg-amber-500/10 px-2 py-1 rounded">
                              <span>{m.creatorMfs || "MFS"} TrxID: {m.creatorTrxId}</span>
                              <button
                                onClick={() => copyToClipboard(m.creatorTrxId, "TrxID কপি হয়েছে")}
                                className="text-slate-300 hover:text-white"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Player 2 (Opponent) */}
                        <div className="p-2.5 rounded-lg bg-[#060a14] border border-[#1a2333] space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400 font-bold">প্রতিপক্ষ (২য় প্লেয়ার):</span>
                            <span className="font-black text-white">{m.opponentName || "অপেক্ষমান..."}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                            <span>ফোন: {m.opponentPhone || "—"}</span>
                            {m.opponentPhone && (
                              <button
                                onClick={() => copyToClipboard(m.opponentPhone, "প্রতিপক্ষ নম্বর কপি হয়েছে")}
                                className="text-cyan-400 hover:text-cyan-300"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          {m.opponentTrxId && (
                            <div className="text-[10px] text-amber-400 font-mono flex items-center justify-between font-bold bg-amber-500/10 px-2 py-1 rounded">
                              <span>{m.opponentMfs || "MFS"} TrxID: {m.opponentTrxId}</span>
                              <button
                                onClick={() => copyToClipboard(m.opponentTrxId, "TrxID কপি হয়েছে")}
                                className="text-slate-300 hover:text-white"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Direct Room Code Entry */}
                      <div className="flex flex-col sm:flex-row gap-2 items-stretch pt-1">
                        <input
                          type="text"
                          placeholder="Ludo King রুম কোড লিখুন (যেমন: 09283741)..."
                          value={roomCodeMap[m.id] !== undefined ? roomCodeMap[m.id] : (m.roomCode || "")}
                          onChange={(e) =>
                            setRoomCodeMap((prev) => ({ ...prev, [m.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleSetRoomCode(m.id);
                            }
                          }}
                          className="flex-1 bg-[#060a14] border border-amber-500/40 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                        />
                        <button
                          onClick={() => handleSetRoomCode(m.id)}
                          disabled={submittingRoomCodeId === m.id}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 disabled:opacity-60"
                        >
                          {submittingRoomCodeId === m.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Key className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {submittingRoomCodeId === m.id
                              ? "পাঠানো হচ্ছে..."
                              : "রুম কোড পাঠান ও ভেরিফাই করুন"}
                          </span>
                        </button>
                        <button
                          onClick={() => handleCancelMatch(m.id)}
                          className="px-3 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-xs font-bold"
                          title="ম্যাচ বাতিল ও রিফান্ড"
                        >
                          বাতিল
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Direct Winning Proof & Dispute Review Queue */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#0d1527] border border-cyan-500/40 space-y-3.5 shadow-xl shadow-cyan-500/5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-cyan-400" />
                  <span>উইনিং প্রুফ ও ফলাফল ভেরিফিকেশন কিউ ({data?.matchesWithProof?.length || 0})</span>
                </h3>
                <button
                  onClick={() => {
                    setMatchFilter("PROOFS");
                    matchFilterRef.current = "PROOFS";
                    setActiveTab("MATCHES");
                    fetchMatches("PROOFS", false);
                  }}
                  className="text-[11px] text-cyan-400 hover:underline font-bold flex items-center gap-0.5"
                >
                  সব প্রুফ ম্যাচ দেখুন <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {!data?.matchesWithProof || data.matchesWithProof.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 bg-[#0a0f1d] rounded-xl border border-[#1a2333]">
                  🎉 চমৎকার! বর্তমানে যাচাই করার মতো কোনো উইনিং প্রুফ বা বিরোধ পেন্ডিং নেই।
                </div>
              ) : (
                <div className="space-y-3">
                  {data.matchesWithProof.map((m: any) => (
                    <div
                      key={m.id}
                      className="p-3.5 sm:p-4 rounded-xl bg-[#0a0f1d] border border-cyan-500/40 space-y-3 shadow-md"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-white">{m.title}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                            {m.creatorProofUrl && m.opponentProofUrl ? "উভয়ের স্ক্রিনশট জমা" : "স্ক্রিনশট প্রুফ জমা পড়েছে"}
                          </span>
                        </div>
                        <div className="text-xs font-mono font-bold text-cyan-400">
                          ফি: ৳{m.entryFee} • প্রাইজ: ৳{m.prize} • রুম: {m.roomCode || "দেওয়া হয়নি"}
                        </div>
                      </div>

                      {/* Players & Submitted Proofs Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {/* Player 1 */}
                        <div className="p-2.5 rounded-lg bg-[#060a14] border border-[#1a2333] space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400 font-bold">খেলোয়াড় ১ (হোস্ট):</span>
                            <span className="font-black text-white">{m.creatorName || "ইউজার"}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">ফোন: {m.creatorPhone || "—"}</div>
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-400">দাবি:</span>
                            <span className={`font-bold px-1.5 py-0.5 rounded ${
                              m.creatorResult === "WON" ? "bg-emerald-500/20 text-emerald-400" : m.creatorResult === "LOST" ? "bg-red-500/20 text-red-400" : "text-slate-500"
                            }`}>
                              {m.creatorResult || "এখনো জমা দেয়নি"}
                            </span>
                          </div>
                          {m.creatorProofUrl ? (
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewImageUrl(m.creatorProofUrl);
                                setPreviewTitle(`${m.creatorName || "হোস্ট"}-এর উইনিং স্ক্রিনশট`);
                              }}
                              className="w-full mt-1 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-bold text-[11px] flex items-center justify-center gap-1 shadow-sm"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>উইনিং স্ক্রিনশট দেখুন</span>
                            </button>
                          ) : (
                            <div className="text-[10px] text-slate-500 italic text-center py-1">স্ক্রিনশট আপলোড করেনি</div>
                          )}
                        </div>

                        {/* Player 2 */}
                        <div className="p-2.5 rounded-lg bg-[#060a14] border border-[#1a2333] space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400 font-bold">খেলোয়াড় ২ (প্রতিপক্ষ):</span>
                            <span className="font-black text-white">{m.opponentName || "ইউজার"}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">ফোন: {m.opponentPhone || "—"}</div>
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-400">দাবি:</span>
                            <span className={`font-bold px-1.5 py-0.5 rounded ${
                              m.opponentResult === "WON" ? "bg-emerald-500/20 text-emerald-400" : m.opponentResult === "LOST" ? "bg-red-500/20 text-red-400" : "text-slate-500"
                            }`}>
                              {m.opponentResult || "এখনো জমা দেয়নি"}
                            </span>
                          </div>
                          {m.opponentProofUrl ? (
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewImageUrl(m.opponentProofUrl);
                                setPreviewTitle(`${m.opponentName || "প্রতিপক্ষ"}-এর উইনিং স্ক্রিনশট`);
                              }}
                              className="w-full mt-1 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-bold text-[11px] flex items-center justify-center gap-1 shadow-sm"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>উইনিং স্ক্রিনশট দেখুন</span>
                            </button>
                          ) : (
                            <div className="text-[10px] text-slate-500 italic text-center py-1">স্ক্রিনশট আপলোড করেনি</div>
                          )}
                        </div>
                      </div>

                      {/* Winner Declaration Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#1a2333]">
                        {m.creatorId && (
                          <button
                            type="button"
                            onClick={() => handleResolveWinner(m.id, m.creatorId, m.creatorName || "হোস্ট")}
                            className="flex-1 min-w-[140px] py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>{m.creatorName || "হোস্ট"} বিজয়ী (৳{m.prize})</span>
                          </button>
                        )}
                        {m.opponentId && (
                          <button
                            type="button"
                            onClick={() => handleResolveWinner(m.id, m.opponentId, m.opponentName || "প্রতিপক্ষ")}
                            className="flex-1 min-w-[140px] py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>{m.opponentName || "প্রতিপক্ষ"} বিজয়ী (৳{m.prize})</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleCancelMatch(m.id)}
                          className="px-3 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-xs font-bold"
                          title="ম্যাচ বাতিল ও রিফান্ড"
                        >
                          বাতিল ও রিফান্ড
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Pending Queues */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Quick Pending Deposits list */}
              <div className="p-4 rounded-2xl bg-[#0d1527] border border-[#1a2333] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <ArrowDownCircle className="w-4 h-4 text-emerald-400" />
                    <span>দ্রুত ডিপোজিট অনুমোদন ({data?.pendingDeposits?.length || 0})</span>
                  </h3>
                  <button
                    onClick={() => {
                      setDepositFilter("PENDING");
                      setActiveTab("DEPOSITS");
                    }}
                    className="text-[11px] text-cyan-400 hover:underline font-bold flex items-center gap-0.5"
                  >
                    সব দেখুন <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                {!data?.pendingDeposits || data.pendingDeposits.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    কোনো পেন্ডিং ডিপোজিট নেই।
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data.pendingDeposits.slice(0, 4).map((dep: any) => (
                      <div
                        key={dep.id}
                        className="p-3 rounded-xl bg-[#0a0f1d] border border-[#1a2333] flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-white truncate">
                            {dep.userName || "ইউজার"} ({dep.userPhone})
                          </div>
                          <div className="text-[10px] text-cyan-400 font-mono">
                            {dep.mfsProvider} • TrxID: {dep.trxId}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-black text-amber-400 font-mono">
                            ৳{dep.amount}
                          </span>
                          <button
                            onClick={() => handleApproveDeposit(dep.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow"
                          >
                            অনুমোদন
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Pending Withdrawals list */}
              <div className="p-4 rounded-2xl bg-[#0d1527] border border-[#1a2333] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <ArrowUpCircle className="w-4 h-4 text-cyan-400" />
                    <span>দ্রুত উইথড্র প্রদান ({data?.pendingWithdrawals?.length || 0})</span>
                  </h3>
                  <button
                    onClick={() => {
                      setWithdrawFilter("PENDING");
                      setActiveTab("WITHDRAWALS");
                    }}
                    className="text-[11px] text-cyan-400 hover:underline font-bold flex items-center gap-0.5"
                  >
                    সব দেখুন <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                {!data?.pendingWithdrawals || data.pendingWithdrawals.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    কোনো পেন্ডিং উইথড্র রিকোয়েস্ট নেই।
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data.pendingWithdrawals.slice(0, 4).map((w: any) => (
                      <div
                        key={w.id}
                        className="p-3 rounded-xl bg-[#0a0f1d] border border-[#1a2333] flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-white truncate">
                            {w.userName || "ইউজার"} ({w.accountNumber})
                          </div>
                          <div className="text-[10px] text-cyan-400 font-mono">
                            {w.mfsProvider} ({w.accountType || "Personal"})
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-black text-cyan-300 font-mono">
                            ৳{w.amount}
                          </span>
                          <button
                            onClick={() => {
                              setPayoutTrxModalId(w.id);
                              setPayoutTrxNumber(`PAY-${Date.now().toString().slice(-6)}`);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] shadow"
                          >
                            পেইড
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Audit Transactions */}
            <div className="p-4 rounded-2xl bg-[#0d1527] border border-[#1a2333] space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>সাম্প্রতিক লেনদেন লগ (সর্বশেষ ১০টি)</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#1a2333] text-slate-400 text-[11px]">
                      <th className="pb-2">ইউজার</th>
                      <th className="pb-2">ধরন</th>
                      <th className="pb-2">পরিমাণ</th>
                      <th className="pb-2">স্ট্যাটাস</th>
                      <th className="pb-2">নোট / TrxID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a2333]">
                    {data?.recentTransactions?.map((t: any) => (
                      <tr key={t.id} className="hover:bg-[#0a0f1d]/50">
                        <td className="py-2 font-medium text-slate-200">
                          {t.userName || "ইউজার"}{" "}
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {t.userPhone}
                          </span>
                        </td>
                        <td className="py-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              t.type === "DEPOSIT"
                                ? "bg-emerald-500/15 text-emerald-400"
                                : t.type === "WITHDRAW"
                                ? "bg-blue-500/15 text-blue-400"
                                : "bg-cyan-500/15 text-cyan-300"
                            }`}
                          >
                            {t.type}
                          </span>
                        </td>
                        <td className="py-2 font-black font-mono text-white">৳{t.amount}</td>
                        <td className="py-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              t.status === "APPROVED"
                                ? "text-emerald-400"
                                : t.status === "REJECTED"
                                ? "text-red-400"
                                : "text-amber-400"
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td className="py-2 text-[11px] text-slate-400 truncate max-w-xs font-mono">
                          {t.note || t.trxId || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB 2: DEPOSITS ======================= */}
        {activeTab === "DEPOSITS" && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="p-3.5 rounded-2xl bg-[#0d1527] border border-[#1a2333] flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="TrxID, ফোন নম্বর বা নাম দিয়ে খুঁজুন..."
                  value={depositSearch}
                  onChange={(e) => setDepositSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchDeposits()}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#0a0f1d] border border-[#1a2333] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Status Chips */}
              <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
                {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setDepositFilter(s);
                      depositFilterRef.current = s;
                      fetchDeposits(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      depositFilter === s
                        ? "bg-cyan-500 text-slate-950 shadow"
                        : "bg-[#0a0f1d] text-slate-400 hover:text-white border border-[#1a2333]"
                    }`}
                  >
                    {s === "ALL"
                      ? "সব"
                      : s === "PENDING"
                      ? "পেন্ডিং"
                      : s === "APPROVED"
                      ? "অনুমোদিত"
                      : "বাতিল"}
                  </button>
                ))}
              </div>

              <button
                onClick={fetchDeposits}
                className="px-3 py-1.5 rounded-lg bg-[#0a0f1d] border border-[#1a2333] hover:border-cyan-500/40 text-xs font-bold text-cyan-400 flex items-center justify-center gap-1"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>ফিল্টার</span>
              </button>
            </div>

            {/* Deposits List */}
            {loadingDeposits ? (
              <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                <span>ডিপোজিট তালিকা লোড হচ্ছে...</span>
              </div>
            ) : depositsList.length === 0 ? (
              <div className="p-12 text-center bg-[#0d1527] rounded-2xl border border-[#1a2333] text-slate-400 text-xs space-y-1">
                <p className="font-bold text-white">কোনো ডিপোজিট পাওয়া যায়নি</p>
                <p className="text-slate-500">ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।</p>
              </div>
            ) : (
              <div className="space-y-3">
                {depositsList.map((dep: any) => {
                  const isPending = dep.status === "PENDING";
                  const isApproved = dep.status === "APPROVED";
                  return (
                    <div
                      key={dep.id}
                      className={`p-4 rounded-2xl bg-[#0d1527] border transition-all space-y-3 ${
                        isPending
                          ? "border-amber-500/40 shadow-lg shadow-amber-500/5"
                          : isApproved
                          ? "border-emerald-500/20"
                          : "border-[#1a2333] opacity-80"
                      }`}
                    >
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-white">
                              {dep.userName || "অজ্ঞাত ইউজার"}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                isPending
                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                  : isApproved
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : "bg-red-500/20 text-red-400 border border-red-500/30"
                              }`}
                            >
                              {dep.status}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400 font-mono block mt-0.5">
                            মোবাইল: {dep.userPhone}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-xl font-black text-amber-400 font-mono block">
                            ৳{dep.amount}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(dep.createdAt).toLocaleTimeString("bn-BD", {
                              hour: "2-digit",
                              minute: "2-digit",
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Details Box */}
                      <div className="p-3 rounded-xl bg-[#0a0f1d] border border-[#1a2333] grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block">পেমেন্ট মেথড</span>
                          <span className="font-bold text-cyan-400 uppercase">
                            {dep.mfsProvider || "MFS"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">প্রেরক নম্বর</span>
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-slate-200 font-mono">
                              {dep.accountNumber || "—"}
                            </span>
                            {dep.accountNumber && (
                              <button
                                onClick={() => copyToClipboard(dep.accountNumber, "নম্বর কপি হয়েছে")}
                                className="text-slate-400 hover:text-cyan-400"
                                title="কপি করুন"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">TrxID</span>
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-emerald-400 font-mono tracking-wider select-all">
                              {dep.trxId || "—"}
                            </span>
                            {dep.trxId && (
                              <button
                                onClick={() => copyToClipboard(dep.trxId, "TrxID কপি হয়েছে")}
                                className="text-slate-400 hover:text-cyan-400"
                                title="কপি করুন"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {dep.note && (
                        <p className="text-[11px] text-slate-400 italic">নোট: {dep.note}</p>
                      )}

                      {/* Action buttons (only if pending) */}
                      {isPending && (
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => handleApproveDeposit(dep.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs shadow-lg shadow-emerald-500/20"
                          >
                            <Check className="w-4 h-4" />
                            <span>অনুমোদন ও ব্যালেন্স ক্রেডিট (৳{dep.amount})</span>
                          </button>
                          <button
                            onClick={() => {
                              setRejectDepositId(dep.id);
                              setRejectDepositReason("ভুল TrxID বা অ্যাকাউন্টে টাকা পাওয়া যায়নি");
                            }}
                            className="px-4 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 font-bold text-xs"
                          >
                            <X className="w-4 h-4" />
                            <span className="hidden sm:inline">বাতিল</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================= TAB 3: WITHDRAWALS ======================= */}
        {activeTab === "WITHDRAWALS" && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="p-3.5 rounded-2xl bg-[#0d1527] border border-[#1a2333] flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="নম্বর, নাম বা Payout TrxID দিয়ে খুঁজুন..."
                  value={withdrawSearch}
                  onChange={(e) => setWithdrawSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchWithdrawals()}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#0a0f1d] border border-[#1a2333] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Status Chips */}
              <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
                {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setWithdrawFilter(s);
                      withdrawFilterRef.current = s;
                      fetchWithdrawals(false);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      withdrawFilter === s
                        ? "bg-cyan-500 text-slate-950 shadow"
                        : "bg-[#0a0f1d] text-slate-400 hover:text-white border border-[#1a2333]"
                    }`}
                  >
                    {s === "ALL"
                      ? "সব"
                      : s === "PENDING"
                      ? "পেন্ডিং"
                      : s === "APPROVED"
                      ? "পেইড"
                      : "বাতিল"}
                  </button>
                ))}
              </div>

              <button
                onClick={fetchWithdrawals}
                className="px-3 py-1.5 rounded-lg bg-[#0a0f1d] border border-[#1a2333] hover:border-cyan-500/40 text-xs font-bold text-cyan-400 flex items-center justify-center gap-1"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>ফিল্টার</span>
              </button>
            </div>

            {/* Withdrawals List */}
            {loadingWithdrawals ? (
              <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                <span>উইথড্র তালিকা লোড হচ্ছে...</span>
              </div>
            ) : withdrawalsList.length === 0 ? (
              <div className="p-12 text-center bg-[#0d1527] rounded-2xl border border-[#1a2333] text-slate-400 text-xs space-y-1">
                <p className="font-bold text-white">কোনো উইথড্র রিকোয়েস্ট পাওয়া যায়নি</p>
                <p className="text-slate-500">ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।</p>
              </div>
            ) : (
              <div className="space-y-3">
                {withdrawalsList.map((w: any) => {
                  const isPending = w.status === "PENDING";
                  const isApproved = w.status === "APPROVED";
                  return (
                    <div
                      key={w.id}
                      className={`p-4 rounded-2xl bg-[#0d1527] border transition-all space-y-3 ${
                        isPending
                          ? "border-cyan-500/40 shadow-lg shadow-cyan-500/5"
                          : isApproved
                          ? "border-emerald-500/20"
                          : "border-[#1a2333] opacity-80"
                      }`}
                    >
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-white">
                              {w.userName || "ইউজার"}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                isPending
                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                  : isApproved
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : "bg-red-500/20 text-red-400 border border-red-500/30"
                              }`}
                            >
                              {isApproved ? "PAID" : w.status}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400 font-mono block mt-0.5">
                            ইউজার ফোন: {w.userPhone}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-xl font-black text-cyan-300 font-mono block">
                            ৳{w.amount}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(w.createdAt).toLocaleTimeString("bn-BD", {
                              hour: "2-digit",
                              minute: "2-digit",
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Details Box */}
                      <div className="p-3 rounded-xl bg-[#0a0f1d] border border-[#1a2333] grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block">MFS প্রদানকারী</span>
                          <span className="font-bold text-cyan-400 uppercase">
                            {w.mfsProvider} ({w.accountType || "Personal"})
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">ক্যাশআউট নম্বর</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white font-mono text-sm tracking-wider select-all">
                              {w.accountNumber || "—"}
                            </span>
                            {w.accountNumber && (
                              <button
                                onClick={() => copyToClipboard(w.accountNumber, "উইথড্র নম্বর কপি হয়েছে")}
                                className="text-cyan-400 hover:text-cyan-300"
                                title="কপি নম্বর"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Payout TrxID</span>
                          <span className="font-bold text-emerald-400 font-mono">
                            {w.adminTrxId || (isPending ? "প্রক্রিয়াধীন" : "—")}
                          </span>
                        </div>
                      </div>

                      {w.note && (
                        <p className="text-[11px] text-slate-400 italic">নোট: {w.note}</p>
                      )}

                      {/* Action buttons (only if pending) */}
                      {isPending && (
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => {
                              setPayoutTrxModalId(w.id);
                              setPayoutTrxNumber(`PAY-${Date.now().toString().slice(-6)}`);
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20"
                          >
                            <Check className="w-4 h-4" />
                            <span>টাকা পাঠিয়ে পেইড মার্ক করুন</span>
                          </button>
                          <button
                            onClick={() => {
                              setRejectWithdrawId(w.id);
                              setRejectWithdrawReason("প্রদত্ত নম্বর ভুল বা বিকাশ/নগদে ক্যাশআউট সমস্যা");
                            }}
                            className="px-4 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 font-bold text-xs"
                          >
                            <X className="w-4 h-4" />
                            <span>বাতিল ও রিফান্ড</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================= TAB 4: MATCHES ======================= */}
        {activeTab === "MATCHES" && (
          <div className="space-y-4">
            {/* Action & Filter header */}
            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
              <button
                onClick={() => setShowCreateMatch(!showCreateMatch)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>{showCreateMatch ? "ফর্ম বন্ধ করুন" : "নতুন অফিসিয়াল ম্যাচ খুলুন"}</span>
              </button>

              {/* Status filter chips */}
              <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
                {(["ALL", "NO_ROOM_CODE", "PROOFS", "DISPUTED", "RUNNING", "WAITING", "COMPLETED", "CANCELLED"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setMatchFilter(s);
                      matchFilterRef.current = s;
                      fetchMatches(s, false);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      matchFilter === s
                        ? s === "NO_ROOM_CODE"
                          ? "bg-amber-500 text-slate-950 font-black shadow shadow-amber-500/30"
                          : s === "PROOFS"
                          ? "bg-emerald-500 text-slate-950 font-black shadow shadow-emerald-500/30"
                          : s === "DISPUTED"
                          ? "bg-red-500 text-white font-black shadow shadow-red-500/30"
                          : "bg-cyan-500 text-slate-950 font-black shadow shadow-cyan-500/30"
                        : "bg-[#0d1527] text-slate-400 hover:text-white border border-[#1a2333]"
                    }`}
                  >
                    <span>
                      {s === "ALL"
                        ? "সব"
                        : s === "NO_ROOM_CODE"
                        ? "রুম কোড বাকি"
                        : s === "PROOFS"
                        ? "প্রুফ জমা পড়েছে"
                        : s === "DISPUTED"
                        ? "বিরোধাধীন"
                        : s === "RUNNING"
                        ? "চলমান"
                        : s === "WAITING"
                        ? "অপেক্ষমান"
                        : s === "COMPLETED"
                        ? "সমাপ্ত"
                        : "বাতিল"}
                    </span>
                    {s === "NO_ROOM_CODE" && (data?.stats?.matchesAwaitingRoomCodeCount || 0) > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                          matchFilter === s
                            ? "bg-slate-950 text-amber-300"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                        }`}
                      >
                        {data?.stats?.matchesAwaitingRoomCodeCount}
                      </span>
                    )}
                    {s === "PROOFS" && (data?.stats?.matchesWithProofCount || 0) > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                          matchFilter === s
                            ? "bg-slate-950 text-emerald-950 font-black"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse"
                        }`}
                      >
                        {data?.stats?.matchesWithProofCount}
                      </span>
                    )}
                    {s === "DISPUTED" && (data?.stats?.disputedMatchesCount || 0) > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                          matchFilter === s
                            ? "bg-slate-950 text-red-300"
                            : "bg-red-500/20 text-red-400 border border-red-500/40"
                        }`}
                      >
                        {data?.stats?.disputedMatchesCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Create Official Match Form (collapsable) */}
            {showCreateMatch && (
              <form
                onSubmit={handleCreateMatch}
                className="p-4 sm:p-5 rounded-2xl bg-[#0d1527] border border-cyan-500/40 shadow-xl space-y-3.5 animate-fadeIn"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>নতুন টুর্নামেন্ট / অফিসিয়াল ম্যাচ পোস্ট</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowCreateMatch(false)}
                    className="text-slate-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">ম্যাচ টাইটেল (ঐচ্ছিক)</label>
                    <input
                      type="text"
                      placeholder="যেমন: স্পেশাল মেগা ম্যাচ #2050"
                      value={newMatchTitle}
                      onChange={(e) => setNewMatchTitle(e.target.value)}
                      className="w-full bg-[#0a0f1d] border border-[#1a2333] rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">এন্ট্রি ফি (৳)</label>
                    <div className="flex gap-1.5 mb-1.5 overflow-x-auto pb-1 scrollbar-none">
                      {["50", "100", "500", "1000", "2000", "4000", "5000"].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => {
                            setNewFee(val);
                            setNewPrize(Math.round(Number(val) * 2 * 0.9).toString());
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-all ${
                            newFee === val
                              ? "bg-cyan-500 text-slate-950 border-cyan-400"
                              : "bg-[#0a0f1d] border-[#1a2333] text-slate-300 hover:border-slate-700"
                          }`}
                        >
                          ৳{val}
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      value={newFee}
                      onChange={(e) => {
                        setNewFee(e.target.value);
                        setNewPrize(Math.round(Number(e.target.value) * 2 * 0.9).toString());
                      }}
                      className="w-full bg-[#0a0f1d] border border-[#1a2333] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">পুরস্কার মানি (৳)</label>
                    <input
                      type="number"
                      value={newPrize}
                      onChange={(e) => setNewPrize(e.target.value)}
                      className="w-full bg-[#0a0f1d] border border-[#1a2333] rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono focus:outline-none focus:border-cyan-500"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="bg-[#0a0f1d] border border-[#1a2333] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="1v1 Classic">১ বনাম ১ ক্লাসিক</option>
                    <option value="Quick Ludo">কুইক লুডো</option>
                  </select>

                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold text-xs shadow-md"
                  >
                    ম্যাচ পাবলিশ করুন
                  </button>
                </div>
              </form>
            )}

            {/* Matches list */}
            {loadingMatches ? (
              <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                <span>ম্যাচ তালিকা লোড হচ্ছে...</span>
              </div>
            ) : matchesList.length === 0 ? (
              <div className="p-12 text-center bg-[#0d1527] rounded-2xl border border-[#1a2333] text-slate-400 text-xs">
                কোনো ম্যাচ পাওয়া যায়নি।
              </div>
            ) : (
              <div className="space-y-3">
                {matchesList.map((m: any) => {
                  const isDisputed = m.status === "DISPUTED";
                  const isCompleted = m.status === "COMPLETED";
                  return (
                    <div
                      key={m.id}
                      className={`p-4 rounded-2xl bg-[#0d1527] border space-y-3 transition-all ${
                        isDisputed
                          ? "border-red-500/60 bg-gradient-to-br from-red-950/20 to-[#0d1527] shadow-lg shadow-red-500/10"
                          : "border-[#1a2333]"
                      }`}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-white">
                              {m.title}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                isDisputed
                                  ? "bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse"
                                  : m.status === "RUNNING"
                                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                                  : isCompleted
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : "bg-slate-800 text-slate-300"
                              }`}
                            >
                              {m.status}
                            </span>

                            {/* Live Seat Count Badge */}
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                m.creatorId && m.opponentId
                                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                                  : m.creatorId
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                  : "bg-slate-800 text-slate-400 border border-slate-700"
                              }`}
                            >
                              {m.creatorId && m.opponentId
                                ? "২/২ জন জয়েন (সিট পূর্ণ)"
                                : m.creatorId
                                ? "১/২ জন জয়েন"
                                : "০/২ জন জয়েন (খালি)"}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            ফি: ৳{m.entryFee} • পুরস্কার: ৳{m.prize} • মোড: {m.matchType}
                          </span>
                        </div>

                        <button
                          onClick={() => handleDeleteMatch(m.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                          title="ম্যাচ ডিলিট"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Players comparison */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {/* Creator / Player 1 */}
                        <div className="p-3 rounded-xl bg-[#0a0f1d] border border-[#1a2333] space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-bold">খেলোয়াড় ১ (হোস্ট)</span>
                            {m.creatorResult && (
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                  m.creatorResult === "WON"
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : "bg-red-500/20 text-red-400"
                                }`}
                              >
                                দাবি: {m.creatorResult}
                              </span>
                            )}
                          </div>
                          <div className="font-bold text-white truncate text-sm">
                            {m.creatorName || <span className="text-slate-500 italic">খালি (কেউ জয়েন করেনি)</span>}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            মোবাইল: {m.creatorPhone || "—"}
                          </div>

                          {/* Direct TrxID Display */}
                          {m.creatorTrxId && (
                            <div className="p-2 rounded-lg bg-[#060a14] border border-amber-500/30 text-[10px] space-y-0.5">
                              <span className="text-amber-400 font-bold block">পেমেন্ট ({m.creatorMfs || "MFS"})</span>
                              <div className="text-slate-300 font-mono">প্রেরক: {m.creatorSenderPhone || m.creatorPhone}</div>
                              <div className="flex items-center justify-between text-emerald-400 font-mono font-bold">
                                <span>TrxID: {m.creatorTrxId}</span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(m.creatorTrxId, "TrxID কপি হয়েছে")}
                                  className="text-slate-400 hover:text-white"
                                  title="কপি করুন"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}

                          {m.creatorProofUrl && (
                            <button
                              onClick={() => {
                                setPreviewImageUrl(m.creatorProofUrl);
                                setPreviewTitle(`${m.creatorName || "হোস্ট"}-এর উইন প্রুফ`);
                              }}
                              className="mt-1 w-full py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 text-[11px] font-bold flex items-center justify-center gap-1 shadow-sm"
                            >
                              <Eye className="w-3.5 h-3.5 text-cyan-400" />
                              <span>উইনিং স্ক্রিনশট দেখুন</span>
                            </button>
                          )}
                        </div>

                        {/* Opponent / Player 2 */}
                        <div className="p-3 rounded-xl bg-[#0a0f1d] border border-[#1a2333] space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-bold">খেলোয়াড় ২ (প্রতিপক্ষ)</span>
                            {m.opponentResult && (
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                  m.opponentResult === "WON"
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : "bg-red-500/20 text-red-400"
                                }`}
                              >
                                দাবি: {m.opponentResult}
                              </span>
                            )}
                          </div>
                          <div className="font-bold text-white truncate text-sm">
                            {m.opponentName || <span className="text-slate-500 italic">খালি (অপেক্ষমান)</span>}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            মোবাইল: {m.opponentPhone || "—"}
                          </div>

                          {/* Direct TrxID Display */}
                          {m.opponentTrxId && (
                            <div className="p-2 rounded-lg bg-[#060a14] border border-amber-500/30 text-[10px] space-y-0.5">
                              <span className="text-amber-400 font-bold block">পেমেন্ট ({m.opponentMfs || "MFS"})</span>
                              <div className="text-slate-300 font-mono">প্রেরক: {m.opponentSenderPhone || m.opponentPhone}</div>
                              <div className="flex items-center justify-between text-emerald-400 font-mono font-bold">
                                <span>TrxID: {m.opponentTrxId}</span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(m.opponentTrxId, "TrxID কপি হয়েছে")}
                                  className="text-slate-400 hover:text-white"
                                  title="কপি করুন"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}

                          {m.opponentProofUrl && (
                            <button
                              onClick={() => {
                                setPreviewImageUrl(m.opponentProofUrl);
                                setPreviewTitle(`${m.opponentName || "প্রতিপক্ষ"}-এর উইন প্রুফ`);
                              }}
                              className="mt-1 w-full py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 text-[11px] font-bold flex items-center justify-center gap-1 shadow-sm"
                            >
                              <Eye className="w-3.5 h-3.5 text-cyan-400" />
                              <span>উইনিং স্ক্রিনশট দেখুন</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Room Code Assignment Section */}
                      <div className={`p-3 rounded-xl border ${
                        !m.roomCode
                          ? "bg-amber-950/20 border-amber-500/40"
                          : "bg-[#0a0f1d] border-emerald-500/30"
                      } space-y-2`}>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 font-bold">
                            <Key className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-white">Ludo King রুম আইডি নির্ধারণ:</span>
                          </div>
                          {!m.roomCode ? (
                            <span className="text-[10px] text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 animate-pulse">
                              ⚠️ রুম আইডি দেওয়া বাকি (খেলোয়াড়রা অপেক্ষা করছে)
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                              ✓ বর্তমান রুম আইডি: <strong className="font-mono text-white text-xs">{m.roomCode}</strong>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="৬-৮ ডিজিটের Ludo King রুম কোড লিখুন (যেমন: 08421943)..."
                            value={roomCodeMap[m.id] !== undefined ? roomCodeMap[m.id] : (m.roomCode || "")}
                            onChange={(e) =>
                              setRoomCodeMap((prev) => ({ ...prev, [m.id]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleSetRoomCode(m.id);
                              }
                            }}
                            className="flex-1 bg-[#070b14] border border-[#1a2333] rounded-lg px-3 py-2 text-xs text-white font-mono tracking-widest focus:outline-none focus:border-amber-500"
                          />
                          <button
                            onClick={() => handleSetRoomCode(m.id)}
                            disabled={submittingRoomCodeId === m.id}
                            className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 flex-shrink-0 flex items-center gap-1.5 disabled:opacity-60"
                          >
                            {submittingRoomCodeId === m.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Key className="w-3.5 h-3.5" />
                            )}
                            <span>
                              {submittingRoomCodeId === m.id
                                ? "সংরক্ষণ হচ্ছে..."
                                : m.roomCode
                                ? "রুম আইডি পরিবর্তন"
                                : "রুম আইডি পাঠান"}
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Winner Declaration & Reward Payout Section */}
                      {!isCompleted && m.status !== "CANCELLED" && (
                        <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#0c1630] to-[#080d1e] border border-cyan-500/40 space-y-2 text-xs shadow-md">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                              <Award className="w-4 h-4 text-amber-400" />
                              <span>উইনিং স্ক্রিনশট যাচাই ও পুরস্কার প্রদান:</span>
                            </div>
                            {(m.creatorProofUrl || m.opponentProofUrl) && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                                📸 স্ক্রিনশট জমা হয়েছে
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-400">
                            স্ক্রিনশট প্রুফ যাচাই করে বিজয়ী নির্ধারণ করুন। বিজয়ীর একাউন্টে অবিলম্বে ৳{m.prize} যোগ হবে।
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {m.creatorId && (
                              <button
                                onClick={() =>
                                  handleResolveWinner(m.id, m.creatorId, m.creatorName || "হোস্ট")
                                }
                                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                              >
                                <Award className="w-4 h-4" />
                                <span>{m.creatorName || "খেলোয়াড় ১"} বিজয়ী (পুরস্কার ৳{m.prize})</span>
                              </button>
                            )}

                            {m.opponentId && (
                              <button
                                onClick={() =>
                                  handleResolveWinner(m.id, m.opponentId, m.opponentName || "প্রতিপক্ষ")
                                }
                                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                              >
                                <Award className="w-4 h-4" />
                                <span>{m.opponentName || "খেলোয়াড় ২"} বিজয়ী (পুরস্কার ৳{m.prize})</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Completed Badge */}
                      {isCompleted && (
                        <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span>ম্যাচ সমাপ্ত! বিজয়ী: <strong className="text-white font-extrabold">{m.winnerName}</strong> (পুরস্কার ৳{m.prize} সফলভাবে প্রদান করা হয়েছে)</span>
                        </div>
                      )}

                      {/* Cancel Match Option */}
                      {!isCompleted && m.status !== "CANCELLED" && (
                        <button
                          onClick={() => handleCancelMatch(m.id)}
                          className="w-full py-1.5 rounded-lg bg-[#0a0f1d] hover:bg-red-500/10 border border-[#1a2333] hover:border-red-500/30 text-slate-400 hover:text-red-400 text-xs font-semibold"
                        >
                          ম্যাচ বাতিল ও এন্ট্রি ফি রিফান্ড করুন
                        </button>
                      )}

                      {m.adminNotes && (
                        <p className="text-[10px] text-cyan-400/80 italic font-mono">
                          এডমিন রেজোলিউশন: {m.adminNotes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================= TAB 5: USERS ======================= */}
        {activeTab === "USERS" && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="p-3.5 rounded-2xl bg-[#0d1527] border border-[#1a2333] flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="মোবাইল নম্বর, নাম বা রেফার কোড দিয়ে খুঁজুন..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#0a0f1d] border border-[#1a2333] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Status Chips */}
              <div className="flex gap-1">
                {(["ALL", "ACTIVE", "BANNED"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setUserStatusFilter(s);
                      setTimeout(fetchUsers, 50);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      userStatusFilter === s
                        ? "bg-cyan-500 text-slate-950 shadow"
                        : "bg-[#0a0f1d] text-slate-400 hover:text-white border border-[#1a2333]"
                    }`}
                  >
                    {s === "ALL" ? "সব" : s === "ACTIVE" ? "সক্রিয়" : "নিষিদ্ধ"}
                  </button>
                ))}
              </div>

              <button
                onClick={fetchUsers}
                className="px-3 py-1.5 rounded-lg bg-[#0a0f1d] border border-[#1a2333] hover:border-cyan-500/40 text-xs font-bold text-cyan-400 flex items-center justify-center gap-1"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>ফিল্টার</span>
              </button>
            </div>

            {/* Users List */}
            {loadingUsers ? (
              <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                <span>ইউজার তালিকা লোড হচ্ছে...</span>
              </div>
            ) : usersList.length === 0 ? (
              <div className="p-12 text-center bg-[#0d1527] rounded-2xl border border-[#1a2333] text-slate-400 text-xs">
                কোনো ইউজার পাওয়া যায়নি।
              </div>
            ) : (
              <div className="space-y-3">
                {usersList.map((u: any) => (
                  <div
                    key={u.id}
                    className={`p-4 rounded-2xl bg-[#0d1527] border transition-all space-y-3 ${
                      u.isBanned
                        ? "border-red-500/40 bg-red-950/10"
                        : u.role === "ADMIN"
                        ? "border-cyan-500/40"
                        : "border-[#1a2333]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-white">{u.name}</span>
                          {u.role === "ADMIN" && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                              ADMIN
                            </span>
                          )}
                          {u.isBanned && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-500/20 text-red-400 border border-red-500/30">
                              BANNED
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 font-mono block mt-0.5">
                          ফোন: {u.phone} • রেফার: {u.referCode}
                        </span>
                      </div>

                      {/* Balances */}
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <span className="text-[10px] text-slate-400 block">মেইন ব্যালেন্স</span>
                          <span className="text-sm font-black text-amber-400 font-mono">
                            ৳{u.mainBalance}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">উইনিং ব্যালেন্স</span>
                          <span className="text-sm font-black text-cyan-400 font-mono">
                            ৳{u.winBalance}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-wrap gap-2 pt-1 border-t border-[#1a2333]/80">
                      <button
                        onClick={() => {
                          setAdjustUserId(u.id);
                          setAdjustTargetUser(u);
                          setAdjustAmount("100");
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-1"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>ব্যালেন্স সমন্বয় (+/-)</span>
                      </button>

                      <button
                        onClick={() => {
                          setResetPassUserId(u.id);
                          setNewPasswordVal("");
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#0a0f1d] hover:bg-[#121c33] border border-[#1a2333] text-slate-300 text-xs font-semibold flex items-center gap-1"
                      >
                        <Key className="w-3.5 h-3.5 text-cyan-400" />
                        <span>পাসওয়ার্ড রিসেট</span>
                      </button>

                      {u.role !== "ADMIN" && (
                        <button
                          onClick={() => handleToggleBan(u.id, u.name, u.isBanned)}
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 ${
                            u.isBanned
                              ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                              : "bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400"
                          }`}
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>{u.isBanned ? "আনব্যান করুন" : "ব্যান করুন"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================= TAB 6: TICKER ======================= */}
        {activeTab === "TICKER" && (
          <div className="space-y-4">
            {/* Live Preview */}
            <div className="p-4 rounded-2xl bg-[#0d1527] border border-[#1a2333] space-y-2 shadow-xl">
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>লাইভ অ্যাপ টিকারে যেমন দেখাবে</span>
              </span>
              <div className="p-2.5 rounded-xl bg-[#0a0f1d] border border-cyan-500/30 flex items-center gap-2 overflow-hidden text-xs">
                <span className="px-2 py-0.5 rounded bg-cyan-500 text-slate-950 font-black text-[10px] flex-shrink-0">
                  NOTICE
                </span>
                <div className="flex-1 overflow-hidden whitespace-nowrap">
                  <div className="inline-block text-slate-200 font-medium animate-marquee">
                    {debouncedTickerPreview || "কোনো নোটিশ সেট করা নেই"}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Status Info Banner */}
            <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs flex items-center gap-2.5 shadow-sm">
              <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span className="leading-relaxed">
                <strong>সরাসরি সিনক্রোনাইজেশন:</strong> নোটিশ বা নোটিফিকেশন সেভ করা মাত্রই তা অ্যাপের হোমস্ক্রিন টিকার এবং সকল প্লেয়ারের বেল (Bell) আইকনে তাৎক্ষণিকভাবে পৌঁছে যাবে।
              </span>
            </div>

            {/* Editor Form */}
            <form
              onSubmit={handleUpdateTicker}
              className="p-4 sm:p-5 rounded-2xl bg-[#0d1527] border border-[#1a2333] space-y-4 shadow-xl"
            >
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                  প্ল্যাটফর্ম এনাউন্সমেন্ট নোটিশ এডিটর
                </h3>
                <p className="text-xs text-slate-400">
                  এই ঘোষণাপত্রটি প্রতিটি প্লেয়ারের হোমস্ক্রিন টিকার এবং ইন-অ্যাপ নোটিফিকেশনে সরাসরি প্রদর্শিত হবে।
                </p>
              </div>

              <textarea
                value={tickerText}
                onFocus={() => {
                  isEditingTickerRef.current = true;
                }}
                onChange={(e) => {
                  isEditingTickerRef.current = true;
                  setTickerText(e.target.value);
                }}
                rows={5}
                className="w-full bg-[#0a0f1d] border border-[#1a2333] rounded-xl p-3 text-xs text-white leading-relaxed focus:outline-none focus:border-cyan-500 placeholder:text-slate-600"
                placeholder="ঘোষণাপত্র লিখুন..."
                required
              />

              <button
                type="submit"
                disabled={savingTicker}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-50"
              >
                {savingTicker ? "আপডেট হচ্ছে..." : "নোটিশ সেভ ও প্রকাশ করুন"}
              </button>
            </form>

            {/* Broadcast In-App Notification to All Users */}
            <form
              onSubmit={handleSendBroadcast}
              className="p-4 sm:p-5 rounded-2xl bg-[#0d1527] border border-cyan-500/40 space-y-4 shadow-xl"
            >
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-cyan-400" />
                  <span>সকল ইউজারের কাছে পুশ/ইন-অ্যাপ নোটিফিকেশন ব্রডকাস্ট করুন</span>
                </h3>
                <p className="text-xs text-slate-400">
                  এটি পাঠালে প্রতিটি খেলোয়াড়ের অ্যাপের নোটিফিকেশন বেল আইকনে তাৎক্ষণিকভাবে বার্তাটি পৌঁছে যাবে।
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">নোটিফিকেশন টাইটেল</label>
                  <input
                    type="text"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="যেমন: 📢 বিশেষ অফার বা সার্ভার নোটিশ"
                    className="w-full bg-[#0a0f1d] border border-[#1a2333] rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">বিস্তারিত বার্তা</label>
                  <textarea
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    rows={3}
                    className="w-full bg-[#0a0f1d] border border-[#1a2333] rounded-xl p-3 text-xs text-white leading-relaxed focus:outline-none focus:border-cyan-500 placeholder:text-slate-600"
                    placeholder="নোটিফিকেশনের মূল বক্তব্য লিখুন..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">নোটিফিকেশন ধরন (Type)</label>
                    <select
                      value={broadcastType}
                      onChange={(e) => setBroadcastType(e.target.value as any)}
                      className="w-full bg-[#0a0f1d] border border-[#1a2333] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="INFO">তথ্যমূলক (INFO)</option>
                      <option value="SUCCESS">সাফল্য / জয় (SUCCESS)</option>
                      <option value="ALERT">সতর্কতা / সতর্কতা (ALERT)</option>
                      <option value="PROMO">অফার / টুর্নামেন্ট (PROMO)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">ক্লিকযোগ্য লিংক (ঐচ্ছিক)</label>
                    <input
                      type="text"
                      value={broadcastLink}
                      onChange={(e) => setBroadcastLink(e.target.value)}
                      placeholder="যেমন: /wallet অথবা /matches"
                      className="w-full bg-[#0a0f1d] border border-[#1a2333] rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={sendingBroadcast}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>{sendingBroadcast ? "পাঠানো হচ্ছে..." : "📢 সকল ইউজারকে নোটিফিকেশন পাঠান"}</span>
              </button>
            </form>

            {/* Notification History & Management */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#0d1527] border border-[#1a2333] space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#1a2333] pb-3">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    সম্প্রচারিত নোটিফিকেশন হিস্ট্রি ({adminNotifications.length})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => fetchAdminNotifications(false)}
                  className="p-1.5 rounded-lg bg-[#0a0f1d] border border-[#1a2333] text-slate-400 hover:text-cyan-300 transition-all text-xs flex items-center gap-1"
                  title="হিস্ট্রি রিফ্রেশ করুন"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingAdminNotifs ? "animate-spin text-cyan-400" : ""}`} />
                  <span className="text-[10px]">রিফ্রেশ</span>
                </button>
              </div>

              {adminNotifications.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  কোনো নোটিফিকেশন হিস্ট্রি পাওয়া যায়নি
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {adminNotifications.map((notif) => {
                    const badgeColor =
                      notif.type === "SUCCESS"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        : notif.type === "ALERT"
                        ? "bg-red-500/10 text-red-400 border-red-500/30"
                        : notif.type === "PROMO"
                        ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                        : "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";

                    return (
                      <div
                        key={notif.id}
                        className="p-3 rounded-xl bg-[#0a0f1d] border border-[#1a2333] flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${badgeColor}`}>
                              {notif.type || "ANNOUNCEMENT"}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              প্রাপক: {notif.userId === "ALL" ? "সকল ইউজার (ALL)" : notif.userId}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              • {new Date(notif.createdAt).toLocaleString("bn-BD", {
                                dateStyle: "short",
                                timeStyle: "short",
                              })}
                            </span>
                          </div>
                          <h4 className="font-bold text-white text-xs truncate">{notif.title}</h4>
                          <p className="text-slate-300 text-[11px] leading-relaxed break-words">{notif.message}</p>
                          {notif.link && (
                            <span className="inline-block text-[10px] text-cyan-400 font-mono">
                              লিংক: {notif.link}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteNotification(notif.id)}
                          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-all flex-shrink-0 mt-1"
                          title="এই নোটিফিকেশনটি মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ======================= MODALS ======================= */}

      {/* 1. Screenshot Preview Modal */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-lg w-full bg-[#0d1527] border border-cyan-500/40 rounded-2xl overflow-hidden shadow-2xl space-y-3 p-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-[#1a2333] pb-2">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>{previewTitle}</span>
              </h4>
              <button
                onClick={() => setPreviewImageUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative w-full max-h-[70vh] overflow-auto rounded-xl bg-black flex items-center justify-center p-2">
              <img
                src={previewImageUrl}
                alt="Match Proof"
                className="max-h-[65vh] w-auto object-contain rounded"
              />
            </div>

            <div className="flex justify-between items-center pt-1">
              <a
                href={previewImageUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>নতুন ট্যাবে বড় করে দেখুন</span>
              </a>
              <button
                onClick={() => setPreviewImageUrl(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Reject Deposit Modal */}
      {rejectDepositId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-[#0d1527] border border-red-500/40 rounded-2xl p-5 space-y-3.5 shadow-2xl">
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-red-400" />
              <span>ডিপোজিট রিকোয়েস্ট বাতিল করুন</span>
            </h4>
            <p className="text-xs text-slate-400">
              বাতিলের কারণ প্লেয়ারের ট্রানজেকশন নোটে যুক্ত হবে।
            </p>

            <textarea
              value={rejectDepositReason}
              onChange={(e) => setRejectDepositReason(e.target.value)}
              rows={3}
              className="w-full bg-[#0a0f1d] border border-[#1a2333] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
              placeholder="বাতিলের কারণ লিখুন..."
            />

            <div className="flex gap-2">
              <button
                onClick={handleConfirmRejectDeposit}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md"
              >
                নিশ্চিত বাতিল করুন
              </button>
              <button
                onClick={() => setRejectDepositId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
              >
                ফিরে যান
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Approve Payout (Withdrawal) Modal */}
      {payoutTrxModalId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-[#0d1527] border border-cyan-500/40 rounded-2xl p-5 space-y-3.5 shadow-2xl">
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>উইথড্র পেইড হিসেবে মার্ক করুন</span>
            </h4>
            <p className="text-xs text-slate-400">
              প্লেয়ারের বিকাশ/নগদে টাকা পাঠিয়ে ট্রানজেকশন আইডি প্রদান করুন:
            </p>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                Payout TrxID (বিকাশ/নগদ এসএমএস TrxID)
              </label>
              <input
                type="text"
                value={payoutTrxNumber}
                onChange={(e) => setPayoutTrxNumber(e.target.value)}
                placeholder="PAY-XXXXXX বা এসএমএস TrxID"
                className="w-full bg-[#0a0f1d] border border-[#1a2333] rounded-xl p-2.5 text-xs text-emerald-400 font-mono uppercase tracking-wider focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleConfirmApprovePayout}
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-md"
              >
                পেইড সম্পন্ন করুন
              </button>
              <button
                onClick={() => setPayoutTrxModalId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
              >
                বাতিল
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Reject Payout (Withdrawal) Modal */}
      {rejectWithdrawId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-[#0d1527] border border-red-500/40 rounded-2xl p-5 space-y-3.5 shadow-2xl">
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-red-400" />
              <span>উইথড্র বাতিল ও ব্যালেন্স রিফান্ড</span>
            </h4>
            <p className="text-xs text-slate-400">
              উইথড্র বাতিল করলে কর্তনকৃত টাকা তাৎক্ষণিকভাবে প্লেয়ারের উইনিং ব্যালেন্সে রিফান্ড হবে।
            </p>

            <textarea
              value={rejectWithdrawReason}
              onChange={(e) => setRejectWithdrawReason(e.target.value)}
              rows={3}
              className="w-full bg-[#0a0f1d] border border-[#1a2333] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
              placeholder="বাতিল ও রিফান্ডের কারণ..."
            />

            <div className="flex gap-2">
              <button
                onClick={handleConfirmRejectPayout}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md"
              >
                বাতিল ও রিফান্ড নিশ্চিত করুন
              </button>
              <button
                onClick={() => setRejectWithdrawId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
              >
                ফিরে যান
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. User Balance Adjustment Modal */}
      {adjustUserId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAdjustBalance}
            className="w-full max-w-sm bg-[#0d1527] border border-cyan-500/40 rounded-2xl p-5 space-y-3.5 shadow-2xl"
          >
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-amber-400" />
              <span>ব্যালেন্স সমন্বয়: {adjustTargetUser?.name || "ইউজার"}</span>
            </h3>

            <div>
              <label className="text-xs text-slate-400 block mb-1">ব্যালেন্স টাইপ</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType("MAIN")}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    adjustType === "MAIN"
                      ? "bg-amber-500 text-slate-950 border-amber-500 shadow"
                      : "bg-[#0a0f1d] border-[#1a2333] text-slate-400"
                  }`}
                >
                  মেইন ব্যালেন্স (খেলার)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType("WIN")}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    adjustType === "WIN"
                      ? "bg-cyan-500 text-slate-950 border-cyan-500 shadow"
                      : "bg-[#0a0f1d] border-[#1a2333] text-slate-400"
                  }`}
                >
                  উইনিং ব্যালেন্স (উত্তোলনের)
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">
                টাকার পরিমাণ (যোগ করতে ধনাত্মক 100, কর্তন করতে -100)
              </label>
              <input
                type="number"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                className="w-full bg-[#0a0f1d] border border-[#1a2333] rounded-xl p-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">লগ নোট / কারণ</label>
              <input
                type="text"
                value={adjustNote}
                onChange={(e) => setAdjustNote(e.target.value)}
                className="w-full bg-[#0a0f1d] border border-[#1a2333] rounded-xl p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold text-xs shadow-md"
              >
                ব্যালেন্স আপডেট করুন
              </button>
              <button
                type="button"
                onClick={() => setAdjustUserId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
              >
                বাতিল
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 6. User Password Reset Modal */}
      {resetPassUserId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleResetPassword}
            className="w-full max-w-sm bg-[#0d1527] border border-cyan-500/40 rounded-2xl p-5 space-y-3.5 shadow-2xl"
          >
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Key className="w-4 h-4 text-cyan-400" />
              <span>ইউজারের পাসওয়ার্ড রিসেট করুন</span>
            </h3>

            <div>
              <label className="text-xs text-slate-400 block mb-1">নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)</label>
              <input
                type="password"
                value={newPasswordVal}
                onChange={(e) => setNewPasswordVal(e.target.value)}
                placeholder="নতুন পাসওয়ার্ড দিন..."
                className="w-full bg-[#0a0f1d] border border-[#1a2333] rounded-xl p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md"
              >
                রিসেট সম্পন্ন করুন
              </button>
              <button
                type="button"
                onClick={() => setResetPassUserId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
              >
                বাতিল
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070b14] flex items-center justify-center text-slate-400 text-xs font-mono">এডমিন প্যানেল লোড হচ্ছে...</div>}>
      <AdminDashboard />
    </Suspense>
  );
}
