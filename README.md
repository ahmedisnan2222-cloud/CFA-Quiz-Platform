# CFA-Style Quiz Platform

A timed quiz platform for a CFA-style class. Instructors upload questions in
Aiken format, set an open/close window and duration, and get a report with
confidence-calibration stats once students submit. Students self-register,
answer each question with a High/Medium/Low confidence level, and see an
immediate results breakdown.

## Stack

- Next.js 16 (App Router) + TypeScript
- Prisma 7 + PostgreSQL (via the `pg` driver adapter)
- NextAuth (Auth.js) v5, Credentials provider, JWT sessions
- Tailwind CSS
- Vitest for the Aiken parser tests

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env` and set:
   - `DATABASE_URL` — a Postgres connection string (see options below)
   - `NEXTAUTH_SECRET` — any long random string
   - `NEXTAUTH_URL` — `http://localhost:3000` for local dev
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` — used only by the seed
     script below, to create your instructor account

   For a local Postgres without installing anything, Prisma can run one for
   you:

   ```bash
   npx prisma dev
   ```

   This prints a `DATABASE_URL` you can paste into `.env`.

3. Apply the schema and generate the Prisma client:

   ```bash
   npx prisma migrate deploy   # or: npx prisma db push (quick local iteration)
   npx prisma generate
   ```

4. Create your instructor account:

   ```bash
   npm run seed:admin
   ```

5. Run the app:

   ```bash
   npm run dev
   ```

   Log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` at `/login` to reach
   `/admin/quizzes`. Students self-register at `/signup`.

## Running tests

```bash
npm run test
```

Covers `lib/aiken.ts`, the Aiken-format parser used for quiz uploads.

## Aiken format

```
What is the capital of France?
A) London
B) Paris
C) Berlin
ANSWER: B

Which of the following is a GIPS requirement?
A) Fair representation
B) Guaranteed returns
C) Ignoring fees
ANSWER: A
```

Questions are separated by a blank line. Each needs at least 2 lettered
options and an `ANSWER: X` line matching one of them. Paste the text directly
or upload a `.txt` file on the "New quiz" page — you'll see a preview before
confirming.

## Deploying (free tier, low traffic)

**Recommended: Vercel + Neon**

1. Create a free [Neon](https://neon.tech) Postgres project and copy its
   connection string into `DATABASE_URL`.
2. Push this repo to GitHub and import it into [Vercel](https://vercel.com)
   (Hobby/free tier is enough for a single class).
3. Set the environment variables from `.env` in the Vercel project settings
   (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` set to your deployed
   domain, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`).
4. Run `npx prisma migrate deploy` against the Neon database (locally, with
   `DATABASE_URL` pointed at Neon), then run `npm run seed:admin` the same
   way to create your instructor account.
5. Deploy. Vercel's free tier and Neon's free tier (0.5GB storage,
   autosuspend when idle) comfortably cover a single class's traffic.

**Alternatives**

- **Supabase** instead of Neon — same idea, only worth it if you also want
  Supabase's table-editor UI; this project only needs plain Postgres via
  Prisma.
- **Render** instead of Vercel — has a free web service tier, but it spins
  down after inactivity (a cold start of a few seconds on the first request
  after idle, fine for a classroom quiz) and its free Postgres expires after
  90 days, so pair it with Neon for the database.
- **Railway** — good developer experience but no longer has a long-term free
  tier (trial credit only); treat as a paid fallback.

## Notes

- Students can retake quizzes; every attempt is stored, and the admin report
  lists all of them.
- The instructor account is only created via `npm run seed:admin` — there's
  no public admin signup.
- `middleware.ts` gates `/admin/*` to the `ADMIN` role and `/quizzes/*` to any
  signed-in user.
