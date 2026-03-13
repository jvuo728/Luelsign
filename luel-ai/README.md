This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- Docker Desktop (for local PostgreSQL database)

### Local Database Setup

1. **Start the PostgreSQL database:**
   ```bash
   docker compose up -d
   ```

2. **Verify the database is running:**
   ```bash
   docker compose ps
   ```

3. **View database logs (optional):**
   ```bash
   docker compose logs -f postgres
   ```

4. **Create `.env` file** (copy from `.env.example` if it exists, or create with these values):
   ```env
   DATABASE_URL=postgresql://luel_user:luel_password@localhost:5432/luel_esign
   ```

The database will automatically initialize with the schema from `Luel-esign.sql` on first startup.

**Useful commands:**
- Stop database: `docker compose down`
- Reset database (⚠️ deletes all data): `docker compose down -v && docker compose up -d`

### Development Server

Run the development server:

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
