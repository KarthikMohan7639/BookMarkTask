# 📌 Smart Bookmarks

A modern, real-time bookmark management app built with **Next.js**, **Supabase**, and **Vercel**. Save, organize, and sync your bookmarks instantly across all your devices.

## ✨ Features

✅ **Google OAuth Authentication** - Seamless sign-in with Google (no passwords)  
✅ **Add Bookmarks** - URL + title with automatic metadata extraction  
✅ **Private Bookmarks** - Your bookmarks stay private with database-level security (Supabase RLS)  
✅ **Real-Time Sync** - Bookmarks update instantly across all tabs using Supabase Realtime  
✅ **Delete with Confirmation** - Safe deletion with modal confirmation and rollback  
✅ **Beautiful UI** - Dark mode, responsive design, smooth animations  
✅ **Bonus: Auto-Metadata** - Page titles fetch automatically when you paste a URL  

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- A Supabase project (free tier works great)
- A Google OAuth application

### 1. Clone & Install
```bash
git clone https://github.com/KarthikMohan7639/BookMarkTaskForJules.git
cd BookMarkTaskForJules
npm install
```

### 2. Set Up Supabase Database
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or use existing one
3. Copy `supabase_schema.sql` into **SQL Editor**
4. Run it to create the bookmarks table with RLS policies

### 3. Configure Environment Variables
Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get these from Supabase project settings → API.

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🌐 Deploy on Vercel

### Step 1: Push to GitHub
Ensure your code is pushed to GitHub:
```bash
git push origin main
```

### Step 2: Connect to Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Select your GitHub repository
3. Click **Import**

### Step 3: Add Environment Variables
In Vercel deployment settings, add:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 4: Deploy
Click **Deploy** and wait for completion (~2-3 minutes).

Your live URL will be: `https://your-project-name.vercel.app`

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 16 (TypeScript, Tailwind CSS)
- **Backend**: Next.js Server Actions
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Google OAuth)
- **Real-Time**: Supabase Realtime subscriptions
- **Hosting**: Vercel

### Security
- **RLS Policies**: Users can only access their own bookmarks
- **SSRF Protection**: Metadata fetching validates URLs
- **XSS Prevention**: URL protocol validation
- **Auth Verification**: Server-side checks on all operations

## 📚 Project Structure

```
src/
├── app/
│   ├── page.tsx              # Login page with Google OAuth
│   ├── dashboard/
│   │   └── page.tsx          # Main dashboard (server component)
│   ├── actions/
│   │   └── bookmarks.ts      # Server actions (add/delete bookmarks)
│   ├── actions.ts            # Metadata fetching
│   └── auth/
│       └── callback/
│           └── route.ts      # OAuth callback handler
├── components/
│   └── BookmarkManager.tsx   # Main UI component (real-time sync)
└── utils/
    └── supabase/
        ├── client.ts         # Browser Supabase client
        ├── server.ts         # Server Supabase client
        └── middleware.ts     # Auth middleware
```

## 💡 Bonus Feature: Auto-Metadata Extraction

When you paste a URL and move to the title field:
1. The app fetches the webpage
2. Extracts the page title (from og:title or title tag)
3. Auto-fills the title field
4. You can edit or accept it

**Why?** Saves time and reduces friction. No need to manually type titles!

**Security**: 
- User must be authenticated
- SSRF protection (blocks localhost/private IPs)
- Results cached for performance
- Graceful fallback if fetch fails

## 🧪 Testing Checklist

- [ ] Sign in with Google works
- [ ] Can add bookmark with URL
- [ ] Title auto-fetches when you blur from URL field
- [ ] Can edit auto-fetched title
- [ ] Bookmark appears in list
- [ ] Open app in 2 tabs
- [ ] Add bookmark in tab 1
- [ ] Bookmark appears instantly in tab 2 (real-time sync)
- [ ] Delete bookmark shows confirmation modal
- [ ] Delete works and UI updates
- [ ] Sign out works
- [ ] Dark mode toggle (system preference)
- [ ] Responsive on mobile

## 📖 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Deployment Guide](https://vercel.com/docs)

## 🔗 Live Demo

**Coming soon!** After deploying to Vercel, your live URL will be displayed here.

## 🤝 Contributing

Feel free to fork, improve, and submit PRs!

## 📄 License

MIT - Feel free to use this project for personal or commercial purposes.
//edit
