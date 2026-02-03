# The Vision — News CMS (Next.js + Supabase + Vercel)

## 1) Setup
1. Create a Supabase project
2. Run SQL in `supabase/schema.sql`
3. Create Storage buckets:
   - `covers` (public)
   - `editor-images` (public)
   - `tts` (public)

> Add storage policies for public read + authenticated write, or use service-role for server uploads.

4. Enable Supabase Auth (Email/Password), then create an admin user.

## 2) Env
Copy `.env.example` -> `.env.local` and fill values.

## 3) Run
```bash
npm install
npm run dev
```

Open:
- Home: `/`
- Admin: `/admin`

## 4) TTS (Khmer male)
When you publish an article, the app auto-generates TTS (voice: onyx) and shows a sticky mini player on the post page.

## 5) Deploy to Vercel
- Push to GitHub
- Import on Vercel
- Set env vars
- Deploy
