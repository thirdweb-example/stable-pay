# 💰 StablePay

A fully functional peer-to-peer cryptocurrency payment application built with React, thirdweb APIs, and Supabase. Send and receive stablecoins (USDC/USDT) to other users by username with a Venmo-inspired interface.

## ✨ Features

- **Email-based authentication** using thirdweb user wallets and JWT tokens
- **Username-based payments** - send to users by @username
- **Advanced chain & token selection** with persistent user preferences
- **Multi-chain support** (Ethereum, Polygon, Base) with Base as default
- **Stablecoin transfers** via thirdweb Payment API (createPayment + completePayment)
- **Smart balance filtering** by chain and token with "Show All" toggle
- **Real-time balance display** across multiple chains and tokens
- **User search and discovery** with Supabase integration
- **Mobile-first Venmo-inspired UI** based on Figma design
- **Complete payment flow** from search to confirmation to execution
- **Transaction status monitoring** with blockchain confirmation tracking
- **Local storage persistence** for user's preferred networks and tokens
- **Logout functionality** with session management

## 🛠 Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS v3 with custom Venmo-inspired design system
- **Database:** Supabase (PostgreSQL) with Row Level Security (RLS)
- **Blockchain:** thirdweb API v1 for all Web3 operations
- **Authentication:** thirdweb email verification + JWT token management
- **State Management:** React Context + Hooks with performance optimizations

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/eabdelmoneim/stablepay.git
cd stablepay
npm install
```

### 2. Environment Setup

Copy the environment example and configure your keys:

```bash
cp env.example .env
```

Update `.env` with your actual values:

```env
# thirdweb Configuration
VITE_THIRDWEB_CLIENT_ID=your_thirdweb_client_id_here

# Supabase Configuration  
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Token Contract Addresses (optional - defaults provided)
VITE_ETHEREUM_USDC_ADDRESS=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
VITE_POLYGON_USDC_ADDRESS=0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174
VITE_BASE_USDC_ADDRESS=0x833589fcd6edb6e08f4c7c32d4f71b54bda02913

# Default Chain (Base = 8453)
VITE_DEFAULT_CHAIN_ID=8453
```

### 3. Database Setup

1. Create a new [Supabase](https://supabase.com) project
2. In the Supabase SQL Editor, run the schema from `sql/supabase-schema.sql`
3. This creates the `users` and `transactions` tables with permissive RLS policies for development

### 4. thirdweb Setup

1. Create a [thirdweb](https://thirdweb.com) account
2. Create a new project and get your Client ID
3. Add your domain to the allowlist for frontend usage
4. Ensure you have access to the Payment API endpoints

### 5. Run the App

```bash
npm run dev
```

Visit `http://localhost:5173` to see the app!

## 📋 Project Structure

```
src/
├── components/
│   ├── auth/                    # Authentication components
│   │   ├── LoginForm.tsx        # Email + code verification
│   │   └── UsernameSetup.tsx    # Username registration
│   ├── payments/                # Payment-related components
│   │   ├── BalanceDisplay.tsx   # Multi-chain wallet balance display with filtering
│   │   ├── SendPayment.tsx      # Payment form with chain/token selection
│   │   └── PaymentConfirm.tsx   # Payment review and execution
│   ├── users/                   # User management
│   │   └── UserSearch.tsx       # Search users by username
│   ├── transactions/            # Transaction components
│   │   └── TransactionHistory.tsx # Transaction list with real-time updates
│   └── ui/                      # UI components
│       ├── Layout.tsx           # Main app layout with navigation
│       └── TokenChainSelector.tsx # Reusable chain/token selection component
├── context/
│   └── AuthContext.tsx          # Authentication state management
├── hooks/
│   └── useChainTokenPreference.ts # Chain/token preference management with localStorage
├── utils/
│   ├── thirdwebAPI.ts           # Complete thirdweb API integration
│   ├── supabase.ts              # Supabase client and database functions
│   └── contracts.ts             # Token contracts and chain configuration with metadata
├── App.tsx                      # Main app with payment flow state
└── main.tsx                     # Entry point with error handling
```

## 🔧 Key Implementation Details

### Authentication Flow
1. **Email Verification**: User enters email → thirdweb `/auth/initiate` endpoint
2. **Code Verification**: User enters 6-digit code → thirdweb `/auth/complete` endpoint
3. **JWT Token**: Receives JWT token + wallet address + isNewUser flag
4. **User Storage**: User data stored in Supabase with wallet address mapping
5. **Session Persistence**: JWT stored in localStorage and restored on app reload

### Payment Flow Implementation
1. **User Search**: Lookup recipient by username in Supabase → get wallet address
2. **Payment Creation**: Call thirdweb `/v1/payments` endpoint to create payment
3. **Payment Execution**: Call thirdweb `/v1/payments/{id}` endpoint to complete payment
4. **Transaction Recording**: Store transaction details in Supabase
5. **Real-time Updates**: Transaction status updates via Supabase subscriptions

### thirdweb API Integration

The app uses several thirdweb API endpoints for comprehensive Web3 functionality:

#### **Authentication & User Management**
- **`POST /v1/auth/initiate`** - Send email verification code
- **`POST /v1/auth/complete`** - Verify code and get JWT token + wallet address

#### **Balance & Token Management**
- **`GET /v1/wallets/{address}/balance`** - Get native and ERC20 token balances
- **`GET /v1/wallets/{address}/tokens`** - Get all token balances across chains
- **`GET /v1/wallets/{address}/transactions`** - Get transaction history

#### **Payment System**
- **`POST /v1/payments`** - Create payment with recipient, token, and amount
- **`POST /v1/payments/{id}`** - Complete payment with sender wallet address
- **`GET /v1/payments/{id}`** - Get payment status without completing
- **Handle Insufficient Funds**: 402 responses include payment links for funding wallets

#### **Transaction Monitoring**
- **`GET /v1/transactions/{id}`** - Get transaction status and confirmation details
- **Real-time status tracking** from 'queued' → 'submitted' → 'confirmed'/'failed'

All API calls include proper authentication headers:
- `x-client-id`: Project identifier
- `Authorization: Bearer {JWT}`: User authentication token

### Performance Optimizations

- **React Hooks**: `useCallback` and `useMemo` to prevent infinite re-renders
- **Memoized Components**: Balance display and payment forms optimized for performance
- **Efficient State Management**: Minimal re-renders through proper dependency arrays
- **Error Handling**: Comprehensive error handling with user-friendly messages

## 🌐 Supported Networks & Tokens

### Base (Default Chain)
- USDC: `0x833589fcd6edb6e08f4c7c32d4f71b54bda02913`
- **Icon**: 🟦
- **Description**: Ethereum L2 built to bring the next billion users to web3
- **Block Time**: ~2 seconds
- **Gas Currency**: ETH

### Ethereum Mainnet
- USDC: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`
- **Icon**: 💎
- **Description**: The world's programmable blockchain
- **Block Time**: ~12 seconds
- **Gas Currency**: ETH

### Polygon
- USDC: `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174`
- **Icon**: 🟣
- **Description**: Ethereum scaling solution
- **Block Time**: ~2 seconds
- **Gas Currency**: MATIC

The app defaults to Base chain for better user experience and lower gas fees.

## 🔧 Advanced Chain & Token Selection

### **Smart Filtering System**
- **Chain Selection**: Users can choose specific networks or view all chains
- **Token Filtering**: Filter balances by specific tokens within selected chains
- **"Show All" Toggle**: Switch between filtered and comprehensive balance views

### **Persistent User Preferences**
- **Local Storage**: Remembers user's last selected chain and token
- **Auto-selection**: Automatically selects preferred networks on app restart
- **Smart Defaults**: Falls back to Base network if no preference exists

### **Enhanced Balance Display**
- **Real-time Updates**: Balances refresh when chain/token selection changes
- **Performance Optimized**: Only fetches balances for selected networks
- **Visual Indicators**: Clear chain icons and token symbols for easy identification

## 🔐 Security Features

- **Row Level Security** on all Supabase tables with permissive policies
- **JWT token validation** for all thirdweb API requests
- **Input sanitization** and validation throughout the app
- **Environment variable protection** for sensitive configuration
- **Error suppression** for browser extension conflicts

## 🎨 UI Design Implementation

The interface follows the provided Figma design:
- **Modern card-based layouts** with subtle shadows and rounded corners
- **Mobile-first responsive design** with bottom navigation
- **Venmo-inspired color scheme** and typography
- **Smooth transitions** and hover effects
- **Accessible form controls** with proper labels and validation

## 📱 Responsive Design

The app is built with:
- **Mobile-first approach** as primary design target
- **Flexible layouts** that adapt to different screen sizes
- **Touch-friendly interfaces** with appropriate button sizes
- **Optimized navigation** for mobile devices

## 🚧 Development Phases Completed

### Phase 1: Core Infrastructure ✅
- [x] Project setup with Vite + React + TypeScript
- [x] Tailwind CSS configuration and custom design system
- [x] thirdweb API integration and authentication
- [x] Supabase database setup with proper schema

### Phase 2: Authentication & User Management ✅
- [x] Email-based authentication flow
- [x] JWT token management and session persistence
- [x] Username setup for new users
- [x] User profile management in Supabase

### Phase 3: Payment System ✅
- [x] User search and discovery
- [x] Payment form with token and amount selection
- [x] Payment confirmation flow
- [x] thirdweb Payment API integration
- [x] Transaction execution and status tracking

### Phase 4: UI/UX & Polish ✅
- [x] Figma design implementation
- [x] Mobile-first responsive design
- [x] Performance optimizations
- [x] Error handling and user feedback
- [x] Logout functionality

### Phase 5: Advanced Chain & Token Selection ✅
- [x] Reusable TokenChainSelector component
- [x] Smart balance filtering by chain and token
- [x] Persistent user preferences with localStorage
- [x] Enhanced chain metadata and visual indicators
- [x] Performance-optimized balance fetching
- [x] "Show All" toggle for comprehensive balance views

## 🐛 Common Issues & Solutions

### Infinite Re-render Loops
- **Cause**: Missing dependency arrays in useEffect/useCallback
- **Solution**: Properly memoize functions and values with useCallback/useMemo

### thirdweb API Authentication Errors
- **Cause**: Missing x-client-id header or invalid JWT
- **Solution**: Ensure both x-client-id and Authorization headers are present

### Supabase 406 Errors
- **Cause**: Row Level Security policies too restrictive
- **Solution**: Use permissive RLS policies during development

### Balance Display Errors
- **Cause**: Undefined values from API responses
- **Solution**: Added null checks and fallbacks in formatTokenAmount

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with proper TypeScript types
4. Test thoroughly to avoid infinite re-render issues
5. Submit a pull request with clear description

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- [thirdweb](https://thirdweb.com) for comprehensive Web3 infrastructure and Payment APIs
- [Supabase](https://supabase.com) for real-time database and authentication
- [Figma](https://figma.com) for the beautiful UI design reference
- [Tailwind CSS](https://tailwindcss.com) for the utility-first CSS framework
- [Vite](https://vitejs.dev) for the fast build tool and dev server

---

**Note:** This is a production-ready application built with modern web technologies. The app uses real thirdweb APIs and can handle actual cryptocurrency transactions. Always test with small amounts first and verify all configuration before production use.