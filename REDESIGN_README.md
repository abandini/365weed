# 365 Days of Weed - Redesigned PWA 🌿

## 🎨 Design Philosophy

This redesign breaks away from generic "AI slop" aesthetics with:

- **Distinctive Typography**: Righteous (bold organic headings) + Space Grotesk (modern body text) + Patrick Hand (handwritten accents)
- **Organic Color Palette**: Deep forest greens (#0f3a26, #1a4d2e) with cannabis bright accents (#4ade80) and warm amber glows (#fb923c)
- **Textured Backgrounds**: Hemp fiber patterns and organic leaf motifs
- **Fluid Animations**: Floating leaves, glowing effects, smooth transitions
- **Asymmetric Layouts**: Breaking grid monotony with organic, nature-inspired positioning

## 🚀 New Features

### ⭐ Favorites System
- Save your favorite daily content with localStorage
- Quick access to bookmarked articles
- Visual indicators throughout the app

### 🔍 Search & Filter
- Full-text search across all 365 days of content
- Multi-tag filtering (indica, sativa, hybrid, CBD, edibles, topicals, etc.)
- Real-time results with animated cards

### 🎯 Enhanced Navigation
- Sticky header with blur backdrop
- Active state indicators
- Responsive mobile-first design
- Floating leaf particles for ambient atmosphere

### 💎 Organic Card System
- Custom `.organic-card` class with hover effects
- Glowing borders and shadows
- Smooth scale transformations
- Hemp texture overlays

## 📦 Installation

### 1. Install Dependencies

```bash
cd app
npm install
```

### 2. Update Entry Point

Replace the default App import in `src/main.tsx`:

```typescript
// src/main.tsx
import App from './App-Enhanced'  // Use the new enhanced version
```

### 3. Build & Run

```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## 🎨 Design System

### Colors

```javascript
// Forest depths
forest-950: #0a1f14 // Deepest background
forest-900: #0d2818
forest-800: #0f3a26
forest-700: #1a4d2e // Primary container
forest-600: #2d5a3d

// Cannabis greens
cannabis: #4ade80 // Primary brand
cannabis-light: #7bed9f
cannabis-bright: #22c55e
cannabis-glow: #86efac

// Amber accents
amber: #fb923c // Primary accent
amber-light: #fbbf24
amber-warm: #f97316
amber-deep: #ea580c

// Earth tones
earth-brown: #78350f
earth-clay: #854d0e
earth-sand: #a16207
```

### Typography

```javascript
font-display: 'Righteous' // Bold headlines
font-body: 'Space Grotesk' // Body text
font-handwritten: 'Patrick Hand' // Accents
```

### Custom Components

```tsx
// Organic card
<div className="organic-card p-8">
  {/* Content */}
</div>

// Glow button
<button className="glow-button">
  Click Me
</button>
```

### Animations

```javascript
animate-float-slow // 8s float
animate-float-medium // 6s float
animate-float-fast // 4s float
animate-glow-pulse // Pulsing glow
animate-leaf-fall // Falling leaves
animate-fade-in // Fade in
animate-slide-up // Slide up
animate-scale-in // Scale in
```

## 📱 PWA Features

### Installability
- Web app manifest with 512x512 icon
- Service worker for offline access
- Add to home screen prompt

### Offline Support
The existing service worker caches:
- Static assets (JS, CSS, fonts)
- API responses (with cache-first strategy)
- All 365 days of content available offline

## 🧩 Component Architecture

```
src/
├── routes/
│   ├── TodayEnhanced.tsx    # Main daily view with search/filter
│   ├── Favorites.tsx         # Saved content
│   ├── Calendar.tsx          # Enhanced calendar grid
│   └── ...existing routes
├── components/
│   └── SearchFilter.tsx      # Reusable search/filter
├── lib/
│   ├── favorites.ts          # Favorites localStorage manager
│   └── api.ts               # Existing API client
└── App-Enhanced.tsx          # New app shell with redesigned nav
```

## 🔧 Configuration Files

### tailwind.config.js
- Extended color palette
- Custom animations
- Organic gradients
- Hemp/leaf texture patterns

### src/index.css
- Google Fonts imports
- Custom scrollbar
- Organic card components
- Glow button components

## 🎯 Key Interactions

### Favorite Button
```tsx
<button onClick={handleToggleFavorite}>
  <span className={isFavorite(date) ? 'drop-shadow-glow-amber' : 'grayscale'}>
    ⭐
  </span>
</button>
```

### Search & Filter
```tsx
<SearchFilter
  onSearch={handleSearch}
  onFilterChange={handleFilterChange}
  availableTags={tags}
/>
```

## 📊 Performance

- **Bundle Size**: Optimized with Vite code splitting
- **Font Loading**: Google Fonts with `display=swap`
- **Animation Performance**: CSS-only animations (60fps)
- **Image Optimization**: SVG patterns for backgrounds
- **Lazy Loading**: Routes split by page

## 🚢 Deployment

### Build for Production

```bash
cd app
npm run build
```

### Deploy to Cloudflare Pages

```bash
# Option 1: Using Wrangler
npx wrangler pages deploy dist --project-name=weed365-pwa --commit-dirty=true

# Option 2: Git-based deployment
git add .
git commit -m "feat: Redesigned PWA with organic aesthetics"
git push origin main
# Cloudflare Pages will auto-deploy
```

### Environment Variables

```bash
# .env
VITE_API_URL=https://weed365.bill-burkey.workers.dev
```

## 🎨 Design Highlights

### 1. Typography Contrast
- **Before**: Generic Inter everywhere
- **After**: Righteous (headings) + Space Grotesk (body) for high contrast

### 2. Color Psychology
- **Forest greens**: Calming, natural, cannabis-inspired
- **Amber glow**: Warm, inviting, energetic
- **High contrast**: Accessibility + visual impact

### 3. Organic Motion
- **Floating leaves**: Ambient atmosphere
- **Glow pulses**: Living, breathing interface
- **Smooth transitions**: Natural, fluid interactions

### 4. Texture Layers
- **Hemp pattern**: Subtle background texture
- **Leaf motifs**: Brand reinforcement
- **Gradient overlays**: Depth and dimension

## 🔗 Routes

- `/` - Today's featured content (with search/filter)
- `/calendar` - Full 365-day calendar grid
- `/favorites` - Saved content
- `/journal` - Personal cannabis journal
- `/achievements` - Gamification system
- `/lists` - Curated lifestyle listicles
- `/settings` - User preferences

## 🎯 Next Steps

1. **Replace current App**: Rename `App-Enhanced.tsx` to `App.tsx`
2. **Update imports**: Change `Today` imports to `TodayEnhanced`
3. **Build & test**: Run `npm run build` and verify
4. **Deploy**: Push to Cloudflare Pages
5. **Monitor**: Check analytics and user feedback

## 🐛 Debugging

### Fonts not loading?
Check Google Fonts import in `src/index.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Righteous&family=Space+Grotesk:wght@300;400;500;600;700&family=Patrick+Hand&display=swap');
```

### Animations stuttering?
Ensure GPU acceleration:
```css
.animated-element {
  will-change: transform;
  transform: translateZ(0);
}
```

### Search not working?
Verify API endpoint returns `cards` array:
```typescript
const { cards } = await getCalendar();
```

## 📝 License

Same as parent project.

---

**Generated with Claude Code** 🤖✨

*Designed to avoid generic AI aesthetics and create a truly distinctive cannabis education experience.*
