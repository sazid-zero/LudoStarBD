# LudoEarn 🎲

> বাংলাদেশের সেরা প্রতিযোগিতামূলক লুডো আর্নিং প্ল্যাটফর্ম | Modern Competitive Ludo Gaming & Tournament Web Platform

Inspired by **[ludobestclub.com](https://ludobestclub.com/)** and **[user.ludobestclub.com](https://user.ludobestclub.com/)**, modernized with an **Obsidian Carbon & Cyber Gold / Emerald / Cyan / Crimson** dark gaming aesthetic.

---

## 🚀 Features

- **Gaming Landing Page**: Conversion-focused landing page with APK download & Web Play CTAs, live counters, feature cards, and FAQ accordion.
- **Mobile-First Responsive WebApp**: Native app feel on mobile devices with desktop-framed responsive container.
- **Bangladeshi Mobile Auth**: Bangladeshi phone number validation (`01XXXXXXXXX`), bcrypt password encryption, and JWT session handling.
- **Ludo King Match Lobby**:
  - Live matches categorized by entry fee (৳20, ৳50, ৳100, ৳200, ৳500).
  - Ludo King room code integration with **1-click Copy Room Code**.
  - Match result declaration: "I Won" (with screenshot proof upload), "I Lost", "Dispute".
  - Automatic prize distribution to winner's wallet.
- **Bangladeshi MFS Wallet (bKash, Nagad, Rocket)**:
  - Dual wallet system: **খেলার ব্যালেন্স (Main Balance)** and **উত্তোলনযোগ্য ব্যালেন্স (Win Balance)**.
  - Deposit requests with TrxID submission & admin approval.
  - Withdrawal requests with minimum ৳100 threshold and status tracking.
  - Full filterable transaction ledger.
- **Leaderboard & Refer Program**:
  - Top 3 Podium (1st Gold, 2nd Silver, 3rd Bronze) and ranks.
  - Personal referral code, direct sharing to WhatsApp & Telegram.
  - ৳10 signup welcome bonus + referral rewards.
- **Admin Management Suite (`/admin`)**:
  - Overview metrics (users, deposits, withdrawals, matches).
  - Deposit approval queue (credits player balance).
  - Withdrawal payout queue (marks as paid with TrxID).
  - Match dispute resolver (declares winner or refunds).
  - User manager (balance adjustments, ban/unban).
  - Live platform marquee ticker announcement editor.

---

## 🛠 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + Custom Raw CSS design tokens
- **Database**: PostgreSQL schema with [Prisma](https://www.prisma.io/) + persistent local repository fallback
- **Authentication**: JWT (`jsonwebtoken`) & `bcryptjs`
- **Proof Uploads**: Cloudinary SDK integration (`/api/upload`) with local storage fallback
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 📦 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/Visible-Unknown/LudoeEarn.git
cd LudoeEarn
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your details:

```bash
cp .env.example .env
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production

```bash
npm run build
npm start
```

---

## 🔑 Demo Accounts

- **Player Account**:
  - Phone: `01711111111`
  - Password: `user123456`
- **Admin Account**:
  - Phone: `01700000000`
  - Password: `admin123`

---

## 📞 Official Contacts & Payment Information

- **ডিপোজিট ও উইথড্র (বিকাশ, নগদ, রকেট)**: `01342968557`
- **হোয়াটসঅ্যাপ (WhatsApp)**: [01342968557](https://wa.me/8801342968557)
- **টেলিগ্রাম (Telegram)**: [@mr_rolex42](https://t.me/mr_rolex42)
- **ফেসবুক পেজ (Facebook)**: [LudoEarn Community](https://www.facebook.com/share/1Eco5f183E/)
- **মোবাইল হেল্পলাইন (Mobile)**: [01321063123](tel:01321063123)
- **অফিশিয়াল ইমেইল (Email)**: [ya8913317@gmail.com](mailto:ya8913317@gmail.com)

---

## 📄 License

MIT License. Developed for educational and competitive gaming purposes.
