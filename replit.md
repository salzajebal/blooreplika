# Overview

This is a Korean luxury e-commerce platform (라이크잇 - LIKE IT) built as a full-stack web application. The platform allows users to browse and purchase luxury brand products including bags, clothing, shoes, wallets, jewelry, and accessories from 77+ luxury brands. It includes an admin panel for product management, member system, order processing, and real-time brand product crawling.

The design follows pliki6.com's clean, minimal, white-dominant aesthetic with "LIKE IT" branding in Playfair Display font.

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
- Magazines: Admin-managed magazine/gallery articles with categories, images, and overlay text
- Content Sections: Dynamic homepage sections with banner images, product filtering, and tab-based benefits page. Monthly benefit sections support rich contentBlocks JSON (banner, text, buttons, coupon, divider block types) with pliki6.com-style rendering including scroll-reveal animations and admin visual block editor
- Labs Blocks: Admin-managed content blocks for Labs/branding page (hero, text, image, image_text types)
- Quick Menu Items: Admin-managed circular icon shortcuts on homepage (name, image upload, link URL, sort order, active toggle). Images stored in uploads/quickmenu/. Falls back to default hardcoded items when DB is empty.
- Reviews: Customer purchase reviews with star ratings, photo attachments, product association. List-style display matching rixxrixx.com design with thumbnails, masked usernames, time-ago display. ReviewWriteForm component shared between Reviews page (no product selection) and ProductDetail page (with product context).
- Category structure: Fully separated categories — clothing, bags, wallets, shoes, sunglasses, belts, jewelry, watches, golf, accessories. `runCategoryMigrations()` ensures all required categories exist in DB on server start. Previously merged sunglasses/belts into accessories — now split into own categories. /products/sunglasses, /products/belts, /products/jewelry are independent pages. Nav shows 쥬얼리/잡화→/products/jewelry, 선글라스→/products/sunglasses, 벨트→/products/belts.
- **f0 쥬얼리/잡화 caId 구조 (확인 완료)**: f0 = 쥬얼리/잡화 부모; f0a0=목걸이(897), f0d0=귀걸이(1381), f0b0=팔찌, f0c0=반지(440); 잡화: f090=백참/브로치(375), f030=스카프/머플러(1707), f070=모자(731), f0e0=키홀더(170), f050=만년필/볼펜(19), f080=장갑(13), f0f0=우산(4), f0g0=담요/쿠션(20), f0h0=기타(90). 이전에 잘못 사용되던 c0a0xx 코드는 GENDER_PREFIX에 f0→여성 추가, 마이그레이션에서 c0a0xx/f0a0xx → 올바른 f0xx로 정정.
- **Mega-menu navigation (bagstyle.site style)**: Full desktop hover dropdown menus for 13 nav items. 신상품 → month list; 브랜드 → 4-column brand grid; 성별 → 3-level (남성/여성 > category > subcategory); 의류/가방/지갑/신발 → combined M+W subcategory list; 시계 → brand list; 골프 → 2-level hover (section > subcats); 쥬얼리/잡화 → combined jewelry+선글라스+벨트 single dropdown (JewelryMergedDropdown); 당일배송/할인상품/베스트상품 → quick category links. 선글라스와 벨트는 별도 nav 항목에서 제거되어 쥬얼리/잡화 드롭다운 내 섹션으로 통합됨. Mobile accordion menus mirror desktop structure. BAGS_MEN/WOMEN/JEWELRY_MEN/WOMEN all fully populated with complete subcategory lists (ca_ids). `subname` URL parameter filters by subcategory name across both genders. `cat` URL parameter (`filterCategory`) is secondary category filter for special pages. **Subcategory migration now uses UPSERT** (ON CONFLICT DO UPDATE) so subcategory names get corrected on server restart.

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

**Payment:**
- Two payment methods supported: card payment (카드결제) and bank transfer (계좌이체/무통장입금)
- Card payment uses 건흥페이먼츠 (GH Payments) MARU SDK
  - SDK loaded from `https://api.ghpayments.kr/js/clientsideV2.js`
  - Client: `GHPaymentButton` component in `client/src/components/checkout/CardPaymentForm.tsx`
  - Public key in `VITE_GH_PAYMENT_PUBLIC_KEY` env var, merchant code in `GH_PAYMENT_CODE`
  - Flow: Select card → Submit order (creates pending order) → SDK popup opens → Payment result callback → Server `/api/orders/payment-confirm` verifies and updates order
  - Webhook: `POST /api/payments/webhook` for server-to-server confirmation
  - Amount verification and idempotency checks on both endpoints
- Cart page has individual "구매하기" buttons per item + "전체 구매하기" for bulk checkout
- Card payment success shows card info (card number, auth number, date); bank transfer shows deposit account info
- Payment failure shows prominent red error UI with retry/change-payment options

**Pricing Data:**
- Simulated real-time pricing with time-based fluctuation algorithm
- Future integration point for real metals API (metals-api.com or similar)
- Base prices in KRW per 3.75g (1돈 - traditional Korean gold measurement)

**Product Options:**
- Products store size/color/extras in `options` text field as JSON: `{ colors: string[], sizes: string[], extras: { label, values }[] }`
- ProductDetail uses horizontal swipeable carousel for product images (touch swipe + arrow buttons + dot indicators)
- ProductDetail and Order pages parse options and render dropdowns (not text inputs)
- Admin can manually set sizes/colors per product (comma-separated input)
- Admin bulk auto-detect API (`/api/admin/update-product-options`) scans product names for known colors and size patterns
- ProductDetail passes selected options to Order page via URL query param `option=컬러:블랙 / 사이즈:XL`
- Daum Postcode API integrated for Korean address search on Order and Signup pages
- Orders require member login (401 if no valid member token)

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