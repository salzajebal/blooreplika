# Overview

This is a Korean gold exchange e-commerce platform (한국골드금거래소 - Korea Gold Exchange) built as a full-stack web application. The platform allows users to browse and purchase precious metals (gold, silver, platinum) and related products, view real-time precious metal prices, and includes an admin panel for product management.

The application serves as an online marketplace for gold bars, silver bars, jewelry, diamonds, and corporate gifts with real-time pricing updates based on international metal markets.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework & Tooling:**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server for fast HMR and optimized builds
- Wouter for lightweight client-side routing instead of React Router
- TanStack Query (React Query) for server state management and caching

**UI Component System:**
- Radix UI primitives for accessible, unstyled component foundations
- shadcn/ui component library with "new-york" style variant
- Tailwind CSS v4 (new @import syntax) for utility-first styling with custom gold-themed color palette
- Custom CSS variables for theming including luxury gold color scale (--color-gold-50 through --color-gold-900)

**State Management:**
- React Query handles server state with custom query client configuration
- Local component state via React hooks
- Form state managed through React Hook Form with Zod validation resolvers

**Internationalization:**
- Primary language: Korean (ko locale)
- Fonts: Noto Sans KR for Korean text, Inter for English/numbers, Playfair Display for decorative headings
- Date formatting using date-fns with Korean locale support

## Backend Architecture

**Runtime & Framework:**
- Node.js with Express.js for RESTful API server
- TypeScript with ES modules throughout the codebase
- HTTP server creation for potential WebSocket support

**API Design:**
- RESTful endpoints under `/api` prefix
- JSON request/response format with standardized success/error structure
- Automatic request logging middleware with timestamp and duration tracking
- Raw body preservation for webhook verification (e.g., Stripe)

**Build System:**
- esbuild for server bundling with selective dependency bundling
- Vite for client bundling with code splitting
- Production build creates single `dist/index.cjs` file for server
- Allowlist approach for commonly used dependencies to reduce cold start times

**Development Environment:**
- Vite middleware mode for HMR in development
- Replit-specific plugins for development banner and error overlay
- Custom meta images plugin for OpenGraph tag management

## Data Layer

**Database:**
- PostgreSQL as the primary database
- Neon Serverless PostgreSQL client with WebSocket support for serverless environments
- Connection pooling via Neon's Pool implementation

**ORM & Schema:**
- Drizzle ORM for type-safe database operations
- Schema-first approach with `shared/schema.ts` as single source of truth
- Drizzle Kit for schema migrations (push-based workflow)

**Data Models:**
- Users: Authentication and user management
- Products: Product catalog with categories, pricing, images, and flags (isBest, isNew)
- Categories: Product categorization with counts and descriptions
- Gold Prices: Real-time precious metal pricing (gold, silver, platinum)
- Members: Customer accounts with signup/login functionality
- Chat Conversations: Real-time 1:1 customer support chat sessions
- Chat Messages: Individual messages within chat conversations
- FAQs: Frequently asked questions organized by category

**Validation:**
- Zod schemas derived from Drizzle schemas using drizzle-zod
- Runtime validation on API inputs
- Type-safe insert/select operations

**Storage Interface:**
- Repository pattern implementation via `IStorage` interface
- `DatabaseStorage` class provides CRUD operations for all entities
- Centralized database access through storage layer abstraction

## External Dependencies

**Database:**
- Neon Serverless PostgreSQL (via `@neondatabase/serverless`)
- DATABASE_URL environment variable required for connection

**Fonts:**
- Google Fonts CDN for Noto Sans KR, Inter, and Playfair Display

**Asset Management:**
- Generated images stored in `attached_assets/generated_images/` directory
- Public static files served from `client/public/`
- Default product images fallback to Unsplash URLs

**Development Tools:**
- Replit-specific plugins for development experience:
  - `@replit/vite-plugin-cartographer` for code navigation
  - `@replit/vite-plugin-dev-banner` for development indicator
  - `@replit/vite-plugin-runtime-error-modal` for error overlay

**Pricing Data:**
- Simulated real-time pricing with time-based fluctuation algorithm
- Future integration point for real metals API (metals-api.com or similar)
- Base prices in KRW per 3.75g (1돈 - traditional Korean gold measurement)

**Deployment:**
- Replit deployment with automatic domain detection for OpenGraph images
- Environment-specific meta tag updates via custom Vite plugin
- Static file serving in production mode

## Mobile Responsive Design

**Responsive Layout System:**
- Mobile-first responsive breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Safe area insets for iOS devices (notch, home indicator)
- Dynamic viewport height (dvh) for better mobile browser compatibility
- Touch-optimized interaction targets with touch-manipulation

**Mobile-Optimized Components:**
- Header: Compact logo, hamburger menu for navigation, simplified top bar
- Hero: Responsive typography scaling, stacked layouts on mobile, optimized carousel controls
- ProductGrid: Responsive grid (2/3/4 columns), smaller badges and buttons on mobile
- PriceBoard: Single-column layout on mobile, compact pricing cards
- ChatWidget: Full-screen on mobile, responsive input fields
- HomePopup: Responsive sizing with proper padding

**Typography Scaling:**
- Text sizes scale from mobile to desktop using responsive Tailwind classes
- Korean text uses break-keep for proper word wrapping
- Line heights and spacing optimized for readability on small screens