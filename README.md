# Wissen-Haus Youth Empowerment Foundation

Web platform for Wissen-Haus — a Nigerian NGO bridging the skills gap by equipping young people with practical career guidance, mentorship, and global exposure.

## Tech Stack

- **Framework**: Next.js 15 (App Router) with React 19
- **Database**: Neon (serverless PostgreSQL)
- **Auth**: JWT via `jose` + `bcryptjs`
- **Payments**: Stripe + Paystack
- **Email**: Resend
- **Deployment**: Vercel

## Features

- Career assessment tool
- Community hub (threads, opportunities — jobs, internships, scholarships, competitions)
- Course platform with progress tracking and certificates
- Admin dashboard (users, submissions, stats)
- Contact, volunteer, and partner intake forms
- Donation flow (Stripe + Paystack)
- Policy research library
- Automated opportunity refresh via cron

## Getting Started

```bash
npm install
cp .env.local.example .env.local
# fill in your credentials
npm run dev
```

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWTs (min 32 chars) |
| `FOUNDER_EMAIL` | Receives contact/volunteer/partner submissions |
| `CRON_SECRET` | Authorises the `/api/cron/opportunities` endpoint |

Additional variables for Stripe, Paystack, and Resend are required for payments and email — see your provider dashboards.

## Database Setup

Run the schema migration against your Neon database:

```bash
node scripts/migrate.mjs
```

## Project Structure

```
app/               # Next.js App Router pages and API routes
components/        # Shared React components
lib/               # DB client, auth helpers, course data, email
public/img/        # Static images
scripts/           # One-off database migration scripts
```

## Deployment

Pushes to `main` trigger a CI validation check via GitHub Actions, then deploy to Vercel automatically.
