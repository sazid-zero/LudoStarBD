# PipraPay Self-Hosting Setup on Render.com

Because Render does not offer native PHP runtimes, this directory contains the production-ready **Docker + Apache** setup designed specifically to run PipraPay on **Render's Free Tier**.

---

## 📁 Files Included

| File | Purpose |
| :--- | :--- |
| `Dockerfile` | PHP 8.2 + Apache with `pdo_mysql`, `mysqli`, `bcmath`, `curl`, `mbstring` and Composer. |
| `apache.conf` | Virtual host with `mod_rewrite` enabled for clean API routing & webhooks. |
| `run.sh` | Entrypoint script that automatically binds Render's dynamic `$PORT` (10000) to Apache. |
| `render.yaml` | One-click Render Blueprint definition set to Singapore region (closest to BD). |

---

## 🚀 Step-by-Step Deployment Guide

### Step 1: Add Your PipraPay Code
Copy all the files and folders of your PipraPay script (the `app`, `public`, `vendor`, `.env.example`, etc.) into this folder (or copy these 4 files into your existing PipraPay repository).

### Step 2: Set Up a Free MySQL Database
PipraPay requires a MySQL database. Since Render's free tier only has PostgreSQL, you can use any of these **100% free cloud MySQL providers**:
- **TiDB Cloud (Serverless MySQL):** [https://tidbcloud.com](https://tidbcloud.com) (5GB free, instant MySQL connection)
- **Aiven Free MySQL:** [https://aiven.io](https://aiven.io) (Free managed MySQL)
- **Clever Cloud:** [https://www.clever-cloud.com](https://www.clever-cloud.com) (Free MySQL add-on)

Import PipraPay's `database.sql` into this MySQL database via phpMyAdmin or MySQL Workbench.

### Step 3: Deploy on Render
1. Push your PipraPay repository (including these 4 files) to **GitHub**.
2. Go to [dashboard.render.com](https://dashboard.render.com) → Click **New +** → **Web Service**.
3. Select your GitHub repository.
4. Render will automatically detect the `Dockerfile`:
   - **Environment:** Docker
   - **Region:** Singapore (or Frankfurt)
   - **Plan:** Free
5. Under **Environment Variables**, add your MySQL credentials:
   - `DB_HOST` = your cloud MySQL host
   - `DB_PORT` = 3306 (or 4000 for TiDB)
   - `DB_DATABASE` = your database name
   - `DB_USERNAME` = your database user
   - `DB_PASSWORD` = your database password
   - `APP_URL` = `https://your-piprapay-app.onrender.com`
6. Click **Create Web Service**. Render will build the Docker container and deploy your dashboard!

---

### Step 4: Connect with LudoEarn
Once your Render web service is live (e.g. `https://my-piprapay.onrender.com`):
1. Log into your PipraPay dashboard at `https://my-piprapay.onrender.com`.
2. Generate your API key.
3. Open `LudoEarn/.env` and update:
   ```env
   PIPRAPAY_API_KEY="your_piprapay_live_key"
   PIPRAPAY_BASE_URL="https://my-piprapay.onrender.com/api"
   ```
