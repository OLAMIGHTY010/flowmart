# FlowMart Super App - UI/UX Design System Strategy

## 1. Design Philosophy
FlowMart's design must be **Premium, Dynamic, and Hyper-Local**. It shouldn't feel like a cluttered utility; it should feel like a high-end operating system for commerce.
- **Aesthetic:** Modern glassmorphism, deep contrast, vibrant accents, and micro-animations to make the interface feel alive.
- **Cognitive Load:** Despite having dozens of verticals, the interface must remain uncluttered. Unified search and the AI assistant handle discovery.

## 2. Design Tokens (Colors & Typography)
### 2.1. Color Palette
- **Primary Accent:** `hsl(250, 80%, 60%)` (Flow Purple) - Used for primary actions, wallet balance, and AI highlights.
- **Secondary Accent:** `hsl(140, 70%, 50%)` (Trust Green) - Used for verified badges, successful transactions, and "Open Now" statuses.
- **Backgrounds (Dark Mode Preferred):**
  - App Background: `hsl(220, 15%, 10%)` (Deep Slate)
  - Card Surface: `hsl(220, 15%, 15%)`
- **Text:**
  - Primary: `hsl(220, 10%, 95%)`
  - Secondary: `hsl(220, 10%, 65%)`

### 2.2. Typography
- **Primary Font:** `Inter` or `Outfit` (Clean, geometric, highly legible at small sizes).
- **Scale:**
  - H1: 32px / 700 weight (Welcome screens, Wallet Total)
  - H2: 24px / 600 weight (Section Headers)
  - Body: 14px / 400 weight (General text)
  - Small: 12px / 400 weight (Metadata, distance metrics)

## 3. Core UI Components
### 3.1. The "Super App" Navigation
Instead of a standard bottom bar, we use a dynamic floating island that adapts to the current context:
- Default: Home, Unified Search, Wallet, Profile.
- Active Order context: Replaces Home with "Live Tracking".

### 3.2. Hyperlocal Discovery Cards
Cards must highlight proximity:
- **Image:** High quality, slightly darkened gradient overlay.
- **Data points:** Store Name, Rating (★ 4.8), **Distance (e.g., "1.2 km - 15 mins")**, and a Verified Shield.

### 3.3. AI Chat Interface
A floating, translucent sheet that expands from the bottom:
- Supports rich UI rendering inside the chat (e.g., if AI recommends a product, it renders a swipeable carousel of product cards, not just text).

## 4. Micro-Interactions & Animation
- **Haptic Feedback:** Subtly triggers on adding items to cart, completing a payment, or switching verticals.
- **Skeleton Loaders:** Shimmering gradient skeletons during data fetches instead of spinning wheels.
- **Transitions:** Fluid shared-element transitions (e.g., clicking a food item expands the image seamlessly into the detail view).

## 5. Technical Implementation (React/Vite)
- We will build custom CSS modules or use a tightly controlled Tailwind config to enforce these tokens.
- Animations will be powered by `framer-motion` to ensure 60fps fluidity on mobile web and desktop.
