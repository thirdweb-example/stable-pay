# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Preview production build
npm run preview
```

## Project Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom Venmo-inspired design system
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Blockchain**: thirdweb API v1 for Web3 operations
- **Authentication**: thirdweb email verification + JWT tokens

### Core Application Flow

1. **Authentication**: Email + 6-digit code via thirdweb API (`src/utils/thirdwebAPI.ts`)
2. **User Management**: Supabase stores user profiles linked to wallet addresses
3. **Payment Flow**: Three-step process (search → form → confirm) using thirdweb Payment API
4. **State Management**: React Context (`src/context/AuthContext.tsx`) with local storage persistence

### Key Files and Architecture

- **`src/App.tsx`**: Main app component managing payment flow state and tab navigation
- **`src/context/AuthContext.tsx`**: Authentication state management with localStorage persistence
- **`src/utils/thirdwebAPI.ts`**: Complete thirdweb API integration (auth, payments, balances, transactions)
- **`src/utils/supabase.ts`**: Database operations and real-time subscriptions
- **`src/utils/contracts.ts`**: Multi-chain token contract configuration and amount formatting

### Component Structure

```
src/components/
├── auth/              # LoginForm, UsernameSetup
├── payments/          # BalanceDisplay, SendPayment, PaymentConfirm
├── users/             # UserSearch
├── transactions/      # TransactionHistory with real-time updates
└── ui/               # Layout with bottom navigation
```

### Database Schema

Two main tables in Supabase:
- **`users`**: email, username, wallet_address, display_name
- **`transactions`**: payment records with thirdweb integration and status tracking

Run `sql/supabase-schema.sql` to set up the database with permissive RLS policies for development.

### Environment Configuration

Copy `env.example` to `.env` and configure:
- `VITE_THIRDWEB_CLIENT_ID`: thirdweb project client ID
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`: Supabase project credentials
- Chain and token contract addresses (defaults provided for Base, Ethereum, Polygon)

### Multi-chain Support

Default chain is Base (8453) with USDC as primary token. The app supports:
- **Base**: Native USDC (`0x833589fcd6edb6e08f4c7c32d4f71b54bda02913`)
- **Ethereum**: USDC and USDT
- **Polygon**: USDC and USDT (bridged versions)

Token contracts and chain configuration managed in `src/utils/contracts.ts`.

### thirdweb Payment API Integration

The app uses thirdweb's Payment API for secure stablecoin transfers:
1. **Create Payment**: `POST /v1/payments` with recipient, token, and amount
2. **Complete Payment**: `POST /v1/payments/{id}` with sender wallet address
3. **Handle Insufficient Funds**: 402 responses include payment links for funding wallets

### Performance Optimizations

The codebase includes several React performance optimizations:
- `useCallback` and `useMemo` hooks to prevent infinite re-renders
- Proper dependency arrays in `useEffect` hooks
- Memoized components for balance display and payment forms

### Common Development Issues

1. **Infinite Re-render Loops**: Usually caused by missing dependency arrays in useEffect/useCallback
2. **thirdweb API Errors**: Ensure both `x-client-id` and `Authorization: Bearer {JWT}` headers are present
3. **Supabase 406 Errors**: RLS policies are permissive for development; check if anon user has proper grants
4. **Balance Display Errors**: Use null checks and fallbacks in `formatTokenAmount` utility

### Real-time Features

- Transaction history updates in real-time via Supabase subscriptions
- Balance refreshes after successful payments
- Transaction status polling for pending thirdweb transactions

### Mobile-First Design

The UI is built mobile-first with:
- Bottom navigation matching Venmo UX patterns
- Touch-friendly interfaces and button sizes
- Responsive layouts that scale to desktop
- Custom CSS classes following `venmo-card` pattern for consistent styling

## Development Workflow

### Testing and Quality Assurance

After making changes, always run:
```bash
npm run lint    # Check for linting issues
npm run build   # Ensure production build succeeds
```

### Important Development Guidelines

- **NEVER create files unless absolutely necessary** for achieving your goal
- **ALWAYS prefer editing existing files** to creating new ones
- **NEVER proactively create documentation files** (*.md) or README files unless explicitly requested
- Authentication flow must be tested with real thirdweb credentials
- All environment variables must be properly configured before testing payments
- Use `sql/supabase-schema.sql` for fresh database setup

### AI Development Resources

The project includes `AGENTS.md` - a comprehensive specification for building this app from scratch using AI coding assistants. This file contains:
- Complete technical specifications for all features
- Implementation directives for AI agents
- Step-by-step development phases
- Integration guidelines for thirdweb and Supabase APIs