# REWAPP - AI Coding Agent Instructions

## Project Overview
REWAPP is a multi-branch rewards system with QR check-ins, virtual roulette games, and coupon management. It features a **dual architecture** with both a modern SPA client and classic SSR fallback.

## Architecture Patterns

### 🏗️ Dual Application Structure
```
/src/app/
├── client/          # SPA version (primary)
├── classicapp/      # SSR fallback (fully functional)
├── admin/           # Admin panels
└── (auth)/          # Authentication routes
```

**Critical**: Both `client/` and `classicapp/` share components from `/src/components/`. When adding features, implement in `/src/components/` first, then integrate into both app versions.

### 🔄 Hybrid State Management
- **Redux Toolkit**: Realtime-synced dynamic data (auth, checkins, coupons, streaks, spins)
- **React Query**: Static/semi-static configuration data (system settings, prizes, branches)
- **Pattern**: Redux handles realtime updates via RealtimeManager, React Query for cacheable config

```typescript
// Redux: Dynamic data synced via realtime
{ auth: { user, coupons, recentActivity, streakData }, ui, settings, roulette }

// React Query: Configuration data with aggressive caching
{ systemSettings, roulettePrizes, streakPrizes, branchesConfig }
```

### 🔐 Multi-Layer Security System
1. **Middleware** (`middleware.ts`): JWT validation, route access
2. **RouteGuard** components: Role-based access control
3. **Role hierarchy**: client → verifier → manager → admin → superadmin

## Essential Development Workflows

### 🛠️ Key Commands
```bash
# Type generation from Supabase
npm run types:generate

# Development with realtime
npm run dev
```

### 🔄 Realtime Architecture
- **Singleton Pattern**: `RealtimeManager` handles all realtime subscriptions
- **Hook**: `useRealtimeManager()` in components needing realtime data
- **Auto-invalidation**: React Query cache invalidated on realtime events

## Critical Code Patterns

### 🎯 Component Organization
```
/src/components/
├── client/          # SPA-specific components
├── shared/          # Reusable across both apps
├── auth/            # Authentication components
└── ui/              # shadcn/ui base components
```

### 🎰 Roulette Spin Safety System
```typescript
// Navigation blocking during spins
const rouletteSlice = {
  isSpinning: boolean,
  isNavigationBlocked: boolean,
  spinStartTime: number | null,
  lockDuration: number // 6500ms default
}
```

### 📱 Mobile-First Patterns
- Use `min-h-dvh` not `min-h-screen` for mobile viewport
- Implement pull-to-refresh with `use-pull-to-refresh.ts`
- Navigation blocking during critical operations

## Integration Points

### 🗄️ Supabase Integration
- **Client**: `createClientBrowser()` for browser components
- **Types**: Auto-generated in `/src/types/database.ts`
- **Auth**: Supabase Auth + custom role system in `user_roles` table

### 🎨 Styling Conventions
- **Base**: Tailwind CSS with custom component variants
- **Theme**: Dynamic theming via `ClientThemeProvider`
- **Mobile**: Use `px-4` for consistent mobile spacing

### 🔍 QR Code System
- **Scanner**: `html5-qrcode` library in `/src/components/scanner/`
- **Generation**: `qrcode` library for user QR generation
- **Validation**: Backend validates QR with security parameters

## Development Best Practices

### 🎯 Data Fetching Patterns
```typescript
// Use React Query for API data
const { data, error, isLoading } = useQuery({
  queryKey: ['userProfile', userId],
  queryFn: () => fetchUserProfile(userId)
})

// Use Redux for app state
const user = useSelector(selectUser)
const dispatch = useAppDispatch()
```

### 🚦 Error Handling
- **Toast System**: Global toast provider for user feedback
- **Error Boundaries**: Wrap features in error boundaries
- **Fallbacks**: Always provide loading/error states

### 📊 Debugging Tools
- **Debug Components**: Available in `/src/components/debug/`
- **Realtime Logger**: Structured logging in `RealtimeManager`
- **Redux DevTools**: Enabled in development

## Critical Files to Understand
- `/docs/PROJECT_MASTER_GUIDE.md` - Complete project overview
- `/src/store/index.ts` - Redux store configuration
- `/src/components/providers/Providers.tsx` - App provider hierarchy
- `/middleware.ts` - Route protection and auth flow
- `/src/lib/realtime/RealtimeManager.ts` - Realtime synchronization

## Testing & Deployment Notes
- **Branch Strategy**: Feature branches, current: `feature/spa-architecture`
- **Environment**: Uses Supabase for backend, types auto-generated
- **Mobile Testing**: Test on actual devices for QR scanning functionality

---
*Last Updated: Based on codebase analysis - September 2025*