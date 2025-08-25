# 💰 Crypto Venmo Example

A peer-to-peer crypto payment application built with React, thirdweb API, and Supabase. Send and receive stablecoins (USDC/USDT) to other users by username with a Venmo-like interface.

## ✨ Features

- **Email-based authentication** using thirdweb user wallets
- **Username-based payments** - send to users by @username
- **Multi-chain support** (Ethereum, Polygon, Base)
- **Stablecoin transfers** (USDC, USDT) via thirdweb API
- **Real-time balance display** across multiple chains
- **User search and discovery**
- **Mobile-first Venmo-inspired UI**
- **Transaction history** (coming soon)
- **Real-time updates** via Supabase subscriptions

## 🛠 Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Blockchain:** thirdweb API
- **Authentication:** thirdweb email verification + Supabase

## 🚀 Quick Start

### 1. Clone and Install

\`\`\`bash
git clone <your-repo>
cd crypto-venmo
npm install
\`\`\`

### 2. Environment Setup

Copy the environment example and configure your keys:

\`\`\`bash
cp env.example .env
\`\`\`

Update `.env` with your actual values:

\`\`\`env
# thirdweb Configuration
VITE_THIRDWEB_CLIENT_ID=your_thirdweb_client_id_here

# Supabase Configuration  
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
\`\`\`

### 3. Database Setup

1. Create a new [Supabase](https://supabase.com) project
2. In the Supabase SQL Editor, run the schema from `supabase-schema.sql`
3. This creates the `users` and `transactions` tables with proper RLS policies

### 4. thirdweb Setup

1. Create a [thirdweb](https://thirdweb.com) account
2. Create a new project and get your Client ID
3. Add your domain to the allowlist for frontend usage

### 5. Run the App

\`\`\`bash
npm run dev
\`\`\`

Visit `http://localhost:5173` to see the app!

## 📋 Project Structure

\`\`\`
src/
├── components/
│   ├── auth/                 # Authentication components
│   │   ├── LoginForm.tsx     # Email + code verification
│   │   └── UsernameSetup.tsx # Username registration
│   ├── payments/             # Payment-related components
│   │   └── BalanceDisplay.tsx# Wallet balance display
│   ├── users/                # User management
│   │   └── UserSearch.tsx    # Search users by username
│   └── ui/                   # UI components
│       └── Layout.tsx        # Main app layout
├── context/
│   └── AuthContext.tsx       # Authentication state management
├── utils/
│   ├── thirdwebAPI.ts        # thirdweb API functions
│   ├── supabase.ts           # Supabase client and functions
│   └── contracts.ts          # Token contract addresses
└── App.tsx                   # Main app component
\`\`\`

## 🔧 Key Components

### Authentication Flow
1. User enters email → thirdweb sends verification code
2. Code verification → JWT token + wallet address
3. User stored in Supabase with wallet mapping
4. Username registration for new users

### Payment Flow (Coming Soon)
1. Username lookup in Supabase → wallet address
2. thirdweb API call for ERC-20 transfer
3. Transaction record stored in Supabase
4. Real-time updates via subscriptions

## 🌐 Supported Networks & Tokens

### Ethereum Mainnet
- USDC: `0xA0b86a33E6776e2d98D24083B2E4AB4E8fCD5918`
- USDT: `0xdAC17F958D2ee523a2206206994597C13D831ec7`

### Polygon
- USDC: `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174`
- USDT: `0xc2132D05D31c914a87C6611C10748AEb04B58e8F`

### Base
- USDC: `0x833589fcd6edb6e08f4c7c32d4f71b54bda02913`

## 🔐 Security Features

- **Row Level Security** on all Supabase tables
- **JWT token validation** for API requests
- **Input sanitization** and validation
- **Environment variable protection**

## 🎨 UI Design

The interface follows Venmo's design principles:
- **Classic blue theme** (#3D95CE)
- **Card-based layouts** with clean shadows
- **Mobile-first responsive design**
- **Social feed-style interfaces**
- **Clean typography** with Inter font

## 📱 Responsive Design

The app is optimized for:
- Mobile devices (primary)
- Tablets
- Desktop browsers

## 🚧 Roadmap

### Phase 1: Core Features ✅
- [x] Authentication system
- [x] User profiles with usernames
- [x] Balance display
- [x] User search
- [x] Basic UI components

### Phase 2: Payment System (In Progress)
- [ ] Send payment interface
- [ ] Payment confirmation flow
- [ ] Transaction execution via thirdweb
- [ ] Transaction status tracking

### Phase 3: Social Features
- [ ] Transaction history
- [ ] Activity feed
- [ ] Real-time notifications
- [ ] Payment messages

### Phase 4: Advanced Features
- [ ] Request payments
- [ ] Split payments
- [ ] Payment privacy controls
- [ ] Multiple wallet support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- [thirdweb](https://thirdweb.com) for Web3 infrastructure
- [Supabase](https://supabase.com) for database and real-time features
- [Venmo](https://venmo.com) for design inspiration
- [Tailwind CSS](https://tailwindcss.com) for styling

---

**Note:** This is a demo application. Use testnet tokens for development and testing. Always verify contract addresses before using real funds.