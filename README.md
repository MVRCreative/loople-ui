# Loople UI - Frontend Only

This is a **UI-only** Next.js project showcasing the Loople application interface. All backend functionality has been removed and replaced with mock data for demonstration purposes.

## Features

- 🎨 **Modern UI Design** - Built with Tailwind CSS and Radix UI components
- 📱 **Responsive Layout** - Works on desktop, tablet, and mobile
- 🏊‍♂️ **Swimming Club Interface** - Complete dashboard for club management
- 💬 **Messaging System** - Real-time messaging interface (UI only)
- 📊 **Analytics Dashboard** - Charts and data visualization
- 🔐 **Authentication UI** - Login/signup forms (mock authentication)
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

## Mock Data

The application uses mock data located in `lib/data.ts` and `lib/mock-auth.ts`:

- **Users**: Mock user profiles and roles
- **Events**: Sample swimming events and competitions
- **Posts**: Newsfeed content and announcements
- **Authentication**: Mock login/logout functionality

## UI Components

Built with modern React patterns:

- **Radix UI** - Accessible component primitives
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Beautiful icons
- **Framer Motion** - Smooth animations (via GSAP)

## Development

This is a **frontend-only** project. No backend services are required:

- ✅ No database setup needed
- ✅ No authentication service required
- ✅ No API endpoints to configure
- ✅ No environment variables needed

Just run `npm run dev` and start exploring the UI!

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
