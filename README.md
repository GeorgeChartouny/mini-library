# Mini Library

A small library management app: books, **Borrow** (checkout) / **Return** (checkin), overdue tracking, auth with Google, roles, and AI-powered “Find a book” suggestions.

---

## Live app

**URL:** [https://mini-library-george-chartouny.vercel.app](https://mini-library-george-chartouny.vercel.app)

*For the purpose of testing, all signed-in users have the Admin role so they can see full functionalities.*

---

## Getting started (local)

### 1. Install

```bash
npm install
```

### 2. Database (PostgreSQL)

Create a PostgreSQL database (local or hosted, e.g. [Neon](https://neon.tech), [Supabase](https://supabase.com), [Railway](https://railway.app)), then:

```bash
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

### 3. Environment variables

Copy `.env.example` to `.env` and set:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (see .env.example) |
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

### Troubleshooting

- **“Sign-in error: Callback”** — Ensure `DATABASE_URL` is correct and the database is reachable. Run `npx prisma migrate deploy` to apply migrations.
- **Admin role:** Add your Google email to `NEXTAUTH_ADMIN_EMAILS` so that account gets Admin role on sign-in.

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

## Demo credentials (if you deploy with auth)

Add to `NEXTAUTH_ADMIN_EMAILS` the Google account(s) that should be Admin. Those users sign in with Google and get full access. No fixed demo username/password—use your own Google account as admin.
