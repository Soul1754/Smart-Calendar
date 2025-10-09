# Smart Calendar - Next.js Web Application

> Modern calendar management with AI assistance

## 🎯 Overview

This is a Next.js 15 application with App Router, TypeScript, and Tailwind CSS. It provides an AI-powered calendar interface that integrates with Google and Microsoft calendars.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running on `http://localhost:5001`

## 🌍 Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5001
NEXT_PUBLIC_AUTH_TOKEN_NAME=token
```

## 📁 Project Structure

```
web/
├── app/                      # Next.js App Router pages
│   ├── (auth)/              # Auth pages (login, signup)
│   ├── (dashboard)/         # Protected dashboard routes
│   ├── layout.tsx           # Root layout with providers
│   ├── page.tsx             # Landing page
│   └── globals.css          # Global styles + theme
├── components/
│   ├── ui/                  # Reusable UI primitives
│   ├── layout/              # Layout components
│   ├── calendar/            # Calendar components
│   ├── chat/                # Chatbot components
│   └── forms/               # Form components
├── lib/
│   ├── api/                 # API client & services
│   └── utils/               # Utility functions
├── providers/               # React Context providers
├── hooks/                   # Custom React hooks
└── middleware.ts            # Route protection
```

## 🎨 Theme

Uses the **Modern Minimal** palette with automatic dark/light mode:

- **Light**: Clean white backgrounds with blue accents
- **Dark**: Slate backgrounds with sky blue accents
- Toggle available in navbar

## 🔐 Authentication

- JWT-based authentication
- Token stored in `localStorage` (header: `x-auth-token`)
- Auto-refresh on app load
- Protected routes redirect to login

## 📡 API Integration

All API calls centralized in `lib/api/`:

```typescript
import { authAPI, calendarAPI, chatbotAPI } from "@/lib/api";

// Authentication
await authAPI.login({ email, password });
await authAPI.register({ name, email, password });
const { user } = await authAPI.getCurrentUser();

// Calendar
const { events } = await calendarAPI.getAllEvents();
await calendarAPI.createGoogleEvent(eventData);

// Chatbot
const response = await chatbotAPI.sendMessage("Schedule a meeting");
```

## 🛠️ Available Scripts

```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
```

## 📦 Key Dependencies

- **next** - React framework
- **typescript** - Type safety
- **tailwindcss** - Styling
- **@tanstack/react-query** - Server state
- **zod** - Validation
- **gsap** - Animations
- **react-big-calendar** - Calendar UI
- **next-themes** - Theme management
- **axios** - HTTP client
- **sonner** - Toast notifications

## 🎯 Features

### ✅ Implemented

- Landing page with GSAP animations
- Theme toggle (light/dark)
- Typed API client with interceptors
- Authentication context
- Responsive UI components
- Modern Minimal theme

### 🔄 In Progress

- Auth pages (login/signup)
- Calendar view with 12am-12am grid
- Chatbot widget
- Meeting management
- Profile page

## 🏗️ Architecture

### App Router

Using Next.js 15 App Router for:

- File-based routing
- Server components by default
- Built-in loading/error states
- Better SEO

### State Management

- **TanStack Query** for server state (caching, revalidation)
- **React Context** for app state (auth, theme, chat model)
- **Local Storage** for token persistence

### Styling

- **Tailwind CSS 4** with custom theme system
- **CSS Custom Properties** for theme colors
- **CVA** for component variants
- **Responsive** design throughout

## 🔒 Security

- JWT token authentication
- HTTPS in production
- CORS handled by backend
- XSS protection via React
- Input validation with Zod

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### API Connection Failed

- Verify backend is running on port 5001
- Check `.env.local` file exists
- Inspect browser console for CORS errors

### Theme Not Loading

- Check `suppressHydrationWarning` on `<html>` tag
- Clear browser cache
- Verify `next-themes` provider is in layout

### GSAP Animations Not Working

- Ensure component has `"use client"` directive
- Check console for ScrollTrigger errors
- Verify GSAP plugins are registered

## 📝 Development Guidelines

### Code Style

- Use TypeScript for all new files
- Follow Prettier configuration
- Use functional components with hooks
- Prefer named exports

### Component Structure

```typescript
"use client"; // If client-side only

import { ... } from "...";

interface Props {
  // Define props
}

export function ComponentName({ ... }: Props) {
  // Component logic
  return (
    // JSX
  );
}
```

### API Calls

- Always use TanStack Query for data fetching
- Define Zod schemas for validation
- Handle loading and error states
- Use optimistic updates where appropriate

### Styling

- Use Tailwind utility classes
- Define reusable components in `components/ui`
- Use theme colors (primary, accent, etc.)
- Ensure dark mode compatibility

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📦 Build & Deploy

```bash
# Build for production
npm run build

# Preview production build locally
npm start

# Deploy to Vercel
vercel --prod
```

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes
3. Test thoroughly (all themes, responsive, a11y)
4. Commit: `git commit -m "feat: add feature"`
5. Push: `git push origin feature/your-feature`
6. Create Pull Request

## 📄 License

MIT

## 🔗 Links

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [TanStack Query](https://tanstack.com/query)
- [GSAP](https://gsap.com)

---

**Built with ❤️ using Next.js**
