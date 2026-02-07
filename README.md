# Loople UI - Full Stack Application

This is a **full-stack** Next.js application with Supabase backend integration. The application provides real authentication, club management, and data persistence.

## Features

- 🎨 **Modern UI Design** - Built with Tailwind CSS and Radix UI components
- 📱 **Responsive Layout** - Works on desktop, tablet, and mobile
- 🏊‍♂️ **Swimming Club Interface** - Complete dashboard for club management
- 💬 **Messaging System** - Real-time messaging interface (UI only)
- 📊 **Analytics Dashboard** - Charts and data visualization
- 🔐 **Real Authentication** - Supabase Auth integration with real user management
- 🏢 **Multi-tenant UI** - Club switching interface

## Getting Started

First, install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── (dashboard)/       # Dashboard pages
│   ├── auth/              # Authentication pages
│   └── api/               # API routes (minimal)
├── components/            # React components
│   ├── ui/                # Base UI components
│   └── newsfeed/          # Feature-specific components
├── lib/                   # Utilities and mock data
└── public/                # Static assets
```

## Real Data Integration

The application integrates with Supabase for:

- **Authentication**: Real user authentication and session management
- **Clubs**: Multi-tenant club management with real data persistence
- **Members**: Real member management and role-based permissions
- **Events**: Event creation and management with real data
- **Posts**: Newsfeed with real content and interactions

## Deprecated Components

Some components still use mock data and are marked as deprecated:

- **Messaging System**: `MessageThread` and `ConversationsList` components use mock data
- **Mock Data Files**: `lib/mock-auth.ts`, `lib/mock-messages.ts` are deprecated

## UI Components

Built with modern React patterns:

- **Radix UI** - Accessible component primitives
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Beautiful icons
- **Framer Motion** - Smooth animations (via GSAP)

## Environment Setup

This project requires Supabase environment variables. Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Then fill in your Supabase credentials:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous/public key

You can find these values in your Supabase project dashboard under Settings → API.

## Development

After setting up your environment variables, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Pages

- **Dashboard** (`/`) - Main overview page
- **Messages** (`/messages`) - Chat interface
- **Events** (`/events`) - Event management
- **Members** (`/members`) - Member directory
- **Settings** (`/settings`) - User preferences
- **Login** (`/auth/login`) - Authentication form
- **Signup** (`/auth/signup`) - Registration form

## Customization

All mock data can be easily modified in:
- `lib/data.ts` - Application data
- `lib/mock-auth.ts` - Authentication state
- `lib/types.ts` - TypeScript definitions

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Hook Form](https://react-hook-form.com/)
