# 🚀 Quick Start: Connect Your Calendar

## Steps to See Events in Your Calendar

### 1️⃣ Clear Browser Cache First

Press `Cmd + Shift + R` to hard refresh and see the updated UI without console logs.

### 2️⃣ Go to Profile Page

- Click your **profile icon** in the top-right navbar (with your name)
- Or navigate directly to: `http://localhost:3000/profile`

### 3️⃣ Connect a Calendar

You'll see cards for:

#### Option A: Google Calendar

```
┌─────────────────────────────┐
│   Google Calendar           │
│                             │
│   Status: ❌ Not Connected  │
│                             │
│   [Connect Google]          │
└─────────────────────────────┘
```

#### Option B: Microsoft Calendar

```
┌─────────────────────────────┐
│   Microsoft Calendar        │
│                             │
│   Status: ❌ Not Connected  │
│                             │
│   [Connect Microsoft]       │
└─────────────────────────────┘
```

### 4️⃣ Click "Connect" Button

- You'll be redirected to Google/Microsoft OAuth page
- Sign in with your account
- Grant Smart Calendar permission to access your calendar

### 5️⃣ After Authorization

- You'll be redirected back to the app
- Status will change to: ✅ Connected
- You'll see your email address

### 6️⃣ Return to Calendar Page

- Click "Calendar" in the sidebar or navbar
- Or navigate to: `http://localhost:3000/calendar`

### 7️⃣ See Your Events! 🎉

Your calendar events will now appear in the week grid:

```
─────────────────────────────────────────────────
Sun 5 │ Mon 6 │ Tue 7 │ Wed 8 │ Thu 9 │ Fri 10 │ Sat 11
──────┼───────┼───────┼───────┼───────┼────────┼────────
12 AM │       │       │       │       │        │
 1 AM │       │       │       │       │        │
 2 AM │       │ Meeting│      │       │        │
 3 AM │       │       │       │       │        │
 9 AM │   ┌───────┐   │       │       │        │
10 AM │   │Meeting│   │       │       │        │
11 AM │   └───────┘   │       │       │        │
```

---

## If You Don't Have Any Events Yet

### Create a Test Event:

1. **Click any time slot** in the calendar grid
2. **Or click "Create" button** in the toolbar
3. Fill in the meeting details:
   - Title (required)
   - Date & Time
   - Duration
   - Description (optional)
   - Location (optional)
   - Attendees (optional)
4. Click **"Create Meeting"**
5. Event will be created in your connected calendar!

---

## Troubleshooting

### Still Seeing Console Logs?

- The code is updated (logs removed)
- Your browser is showing **cached JavaScript**
- Solution: **Hard refresh** with `Cmd + Shift + R`

### Empty Array is Normal

```javascript
Raw events from API: Array []
```

This means:

- ✅ API is working
- ✅ Backend is connected
- ❌ No calendar connected yet → Go to Profile page

### Calendar Not Connecting?

1. Make sure backend is running on port 5001
2. Check console for OAuth errors
3. Verify `.env.local` has Google/Microsoft credentials:
   ```
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_secret
   ```

### Events Not Showing?

1. Verify calendar is connected (check Profile page)
2. Click **Refresh button** (🔄) in calendar toolbar
3. Check date range (navigate to current week with "Today" button)
4. Verify events exist in that date range

---

## Quick Commands

### Start Backend (if not running):

```bash
cd backend
npm run dev
```

### Start Frontend (if not running):

```bash
cd web
npm run dev
```

### Check Backend Status:

```bash
curl http://localhost:5001/health
```

Should return: `OK` or health status

---

## What's Next?

After connecting your calendar:

1. ✅ View all your events in week/day view
2. ✅ Create new meetings by clicking time slots
3. ✅ Click events to see details
4. ✅ Navigate between weeks/days
5. ✅ Refresh to sync latest events
6. ✅ Toggle between Week and Day views

Enjoy your Smart Calendar! 🎉
