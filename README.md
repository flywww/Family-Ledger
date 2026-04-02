This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Monthly Refresh Cron

Production monthly refresh depends on Vercel Cron invoking `/api/cron/monthly-refresh`.

Required environment variables:

- `CRON_SECRET`: shared secret used by the cron route authorization check
- `APP_TIME_ZONE`: local month boundary and cron health timezone. Default is `Asia/Taipei`
- `MONTHLY_REFRESH_DAILY_LIMIT`: optional per-run asset processing cap

Current production schedule:

- `vercel.json` runs the cron route once per day at `0 18 * * *`
- In `Asia/Taipei`, that corresponds to local `02:00`
- On Vercel Hobby, cron execution should be treated as daily and approximate rather than exact, so the app backfills missed months instead of relying on a single exact run

Validation checklist:

1. Confirm the project is deployed to production and the cron definition appears in Vercel.
2. Confirm `CRON_SECRET` is configured in the production environment.
3. Trigger the route manually:

```bash
curl -i -X GET https://YOUR_DOMAIN/api/cron/monthly-refresh \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "x-cron-trigger: manual_test"
```

4. Check Vercel Runtime Logs for `monthly-refresh-cron-start`, `monthly-refresh-cron`, or `monthly-refresh-cron-rejected`.
5. Check the Settings page for the latest cron health state and run logs.
