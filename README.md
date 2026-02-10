# Mini Library

A small library management app: books, **Borrow** (checkout) / **Return** (checkin), overdue tracking, auth with Google, roles, and AI-powered “Find a book” suggestions.

---

## Live app

**URL:** [https://mini-library.vercel.app](https://mini-library.vercel.app)

*(Replace with your deployed URL after you deploy—e.g. from Vercel dashboard or `vercel` CLI.)*

---

## Getting started (local)

### 1. Install

```bash
npm install
```

### 2. Database

```bash
npx prisma generate
npx prisma migrate deploy
```

For a fresh DB with sample books:

```bash
npx prisma db seed
```

### 3. Environment variables

Copy `.env.example` to `.env` and set:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | SQLite path, e.g. `file:./dev.db` |
| `NEXTAUTH_URL` | App URL (e.g. `http://localhost:3000` locally) |
| `NEXTAUTH_SECRET` | Random string (e.g. `openssl rand -base64 32`) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `NEXTAUTH_ADMIN_EMAILS` | Comma-separated emails that get Admin role |
| `OPENAI_API_KEY` | Optional; for “Find a book” AI and description generation |

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Troubleshooting: “Sign-in error: Callback” / “attempt to write a readonly database”

If Google sign-in fails with **Callback** and the terminal shows `attempt to write a readonly database` or `SQLITE_READONLY_DBMOVED`, the SQLite file (e.g. `dev.db`) or its folder is not writable. Fix it:

1. **Stop the dev server** (Ctrl+C).
2. **Make the database and project folder writable** (from the project root):
   ```bash
   chmod 644 dev.db 2>/dev/null || true
   chmod 755 .
   ```
3. **Restart the dev server:** `npm run dev`.

If it still fails, ensure no other app has `dev.db` open (e.g. DB browser), and that the project is not on a read-only or synced volume. As a last resort, remove `dev.db`, run `npx prisma migrate deploy` and `npx prisma db seed` again, then restart.

**Testing:** For the purpose of testing, all signed-in users have the Admin role so you can see and use full functionality (user management, add/edit/delete books, borrow/return, etc.).

---

## Borrow / Return

- **Borrow (checkout):** A book is checked out to a borrower (name, email, phone, due date). The book is then “Borrowed” until returned.
- **Return (checkin):** Recording that the book was returned. The book becomes “Available” again.
- **Overdue:** Loans past their due date are listed on the Overdue page with contact actions (email, call, text).

---

## Features

- **Books:** List (search, filter by status, sort), detail, add, edit, delete.
- **Borrow / Return:** Checkout and checkin from book detail or list; borrow modal for due date and contact info.
- **Overdue:** Page listing overdue loans with reminder actions.
- **Auth:** Sign in with Google; roles Admin, Librarian, Member. Mutate actions (add/edit/delete book, borrow/return) require Admin or Librarian.
- **My Loans:** For signed-in users, loans matched by email.
- **User management (Admin):** List users, change role, remove user (except self).
- **Find a book (AI):** Enter preferences; get suggestions from **available** books. If none match, see an AI-suggested book and add it (or your own) to the suggestion list.
- **Book suggestions:** When nothing on the shelf fits, suggest a book for the library; list of “suggested books to be added.”

---

## Deploy (e.g. Vercel)

### Option A: Vercel Dashboard

1. **Push** your repo to GitHub (if not already).
2. In [Vercel](https://vercel.com), **Import** the repo.
3. Set the **project name** to include `george-chartouny` (e.g. `george-chartouny-mini-library`) so the URL is `https://george-chartouny-mini-library.vercel.app` (or `https://george-chartouny-mini-library-<your-username>.vercel.app`).
4. In **Settings → Environment Variables**, add all variables from `.env.example` (see table above). For production:
   - `NEXTAUTH_URL` = your Vercel URL (e.g. `https://george-chartouny-mini-library.vercel.app`).
   - For **database:** Vercel serverless does not persist a local SQLite file. Use a hosted database (e.g. [Turso](https://turso.tech) for SQLite, or Postgres/Neon) and set `DATABASE_URL` accordingly; you may need to switch the Prisma datasource or adapter for that provider.
5. Deploy. The project uses `vercel.json` with build command `prisma generate && next build` (no DB seed during build).

### Option B: Vercel CLI

From the project root (logged in with `npx vercel login` if needed):

```bash
npx vercel deploy --prod
```

When prompted for **project name**, enter `george-chartouny-mini-library` to get that name in the URL. Set environment variables in the [Vercel dashboard](https://vercel.com/dashboard) (Settings → Environment Variables) and redeploy.

After deploy, set your **live URL** in this README (e.g. replace `https://mini-library.vercel.app` with your real Vercel URL).

---

## Demo credentials (if you deploy with auth)

Add to `NEXTAUTH_ADMIN_EMAILS` the Google account(s) that should be Admin. Those users sign in with Google and get full access. No fixed demo username/password—use your own Google account as admin.
