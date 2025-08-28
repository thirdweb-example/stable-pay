# StablePay Web App - AI Development Guide

Build a complete Venmo-style peer-to-peer cryptocurrency payment application that allows users to send and receive stablecoins (USDC/USDT) to other registered users by username. This guide provides the complete technical specification for building StablePay from scratch using modern React, TypeScript, and thirdweb APIs.

## ✨ Core Features Required

### 🔐 Authentication & User Management
- **Email-based authentication** using thirdweb user wallets and JWT tokens
- **Username-based payments** - send to users by @username
- **User profiles** with unique usernames, display names, and linked wallet addresses
- **User search/discovery** to find other registered users by username
- **Session persistence** with localStorage and JWT token management

### 💰 Advanced Payment Features
- **Multi-chain & token selection** with persistent user preferences
- **Smart balance filtering** by chain and token with "Show All" toggle
- **Stablecoin transfers** via thirdweb Payment API (createPayment + completePayment)
- **Real-time balance display** across multiple chains and tokens
- **Complete payment flow** from search to confirmation to execution
- **Transaction status monitoring** with blockchain confirmation tracking
- **Insufficient funds handling** with payment links for wallet funding

### 🌐 Multi-Chain Web3 Integration
- **Multi-chain support** (Ethereum, Polygon, Base) with Base as default
- **Chain & token selector** with visual indicators and metadata
- **Local storage persistence** for user's preferred networks and tokens
- **Real-time balance tracking** with performance optimizations
- **Transaction monitoring** from 'queued' → 'submitted' → 'confirmed'/'failed'

## 🛠 Technical Requirements

### Frontend Stack
- **React 18 + TypeScript** with modern hooks and strict typing
- **Vite** for fast development server and build tool
- **Tailwind CSS v3** with custom Venmo-inspired design system
- **React Context + Hooks** for state management with performance optimizations
- **Lucide React** for modern iconography (Wallet, RefreshCw, Eye, Send, etc.)
- **Custom Hooks** for chain/token preferences and localStorage persistence
- **Loading skeletons and error boundaries** for better UX
- **Performance optimizations** with useCallback, useMemo, and proper dependency arrays

### Database (Supabase)
- **PostgreSQL** with Row Level Security (RLS) enabled
- **User profiles** table with UUID primary keys, usernames, wallet addresses
- **Transactions** table with thirdweb integration and status tracking
- **Permissive RLS policies** for development (easily upgradeable to production)
- **Real-time subscriptions** for live transaction updates
- **Proper indexes** for performance (wallet_address, username, transaction status)
- **Triggers** for automatic updated_at timestamps

### 🌐 thirdweb API Integration

The app uses several thirdweb API v1 endpoints organized by functionality:

> **📚 Complete API Reference**: For full thirdweb API documentation, see [thirdweb API Reference](https://api.thirdweb.com/llms.txt)

#### 🔐 Authentication & User Wallets

**Endpoints**: `POST /v1/auth/initiate` and `POST /v1/auth/complete`

**Implementation Directives**:

1. **Email Verification Initiation**:
   - Send POST request to `/v1/auth/initiate` with method 'email' and user's email address
   - Include `x-client-id` header for authentication
   - Handle success response indicating verification code was sent
   - Implement error handling for invalid emails or rate limiting

2. **Code Verification & Wallet Creation**:
   - Send POST request to `/v1/auth/complete` with method 'email', email, and verification code
   - Extract JWT token and wallet address from response
   - Store JWT token securely for authenticated API calls
   - Check `isNewUser` flag to determine if additional setup is needed
   - Handle invalid code errors with user-friendly messaging

3. **Session Management**:
   - Persist JWT token in localStorage for session continuity
   - Implement token validation and refresh logic
   - Provide logout functionality that clears stored tokens
   - Handle token expiration gracefully with re-authentication prompts

#### 💰 Balance & Token Management

**Endpoints**: `/v1/wallets/{address}/balance`, `/v1/wallets/{address}/tokens`, `/v1/wallets/{address}/transactions`

**Implementation Directives**:

1. **Individual Balance Fetching**:
   - Query specific token balances using wallet address and chain ID
   - Handle both native tokens (omit tokenAddress) and ERC20 tokens (include tokenAddress)
   - Parse response array format and extract balance data from first element
   - Implement error handling for invalid addresses or unsupported chains
   - Format balance values according to token decimals for display

2. **Multi-Chain Token Discovery**:
   - Fetch all token balances across multiple chains in a single request
   - Support filtering by specific chain IDs to optimize performance
   - Handle pagination for wallets with many token holdings
   - Filter out zero balances or provide toggle for showing all tokens
   - Cache results appropriately to reduce API calls

3. **Transaction History Integration**:
   - Retrieve wallet transaction history for specific chains
   - Implement pagination and filtering by date ranges
   - Parse transaction data to extract relevant payment information
   - Link transaction data with user profiles from database
   - Support real-time updates for new transactions

4. **Performance Optimization**:
   - Batch API calls when fetching data for multiple chains
   - Implement caching strategy for frequently accessed balance data
   - Use loading states and skeleton screens during data fetching
   - Handle rate limiting and implement retry logic with exponential backoff

#### 💳 Payment System (Recommended Approach)

**Endpoints**: `POST /v1/payments`, `POST /v1/payments/{id}`, `GET /v1/payments/{id}`

**Implementation Directives**:

1. **Payment Creation**:
   - Create payment intents with recipient wallet address, token details, and payment metadata
   - Include descriptive name and message for payment identification
   - Specify token contract address, amount (in wei), and target chain ID
   - Require user JWT token for authentication
   - Store returned payment ID for tracking and completion

2. **Payment Execution Flow**:
   - Attempt payment completion using stored payment ID and sender address
   - Handle successful execution (status 200) with transaction ID for monitoring
   - Handle insufficient funds (status 402) by presenting funding options to user
   - Provide payment links for wallet funding when balances are insufficient
   - Implement retry logic for temporary network failures

3. **Payment Status Tracking**:
   - Check payment status without executing to verify readiness
   - Monitor payment completion progress through transaction monitoring
   - Update database records with payment status changes
   - Provide real-time feedback to users on payment progress

4. **Error Handling & UX**:
   - Present user-friendly error messages for common failure scenarios
   - Implement loading states during payment processing
   - Provide clear instructions for insufficient funds scenarios
   - Allow payment cancellation before execution
   - Log payment attempts for debugging and analytics

#### 📊 Transaction Monitoring

**Endpoint**: `GET /v1/transactions/{transactionId}`

**Implementation Directives**:

1. **Status Mapping**: Create a function to map thirdweb transaction statuses to your internal status system:
   - `QUEUED` or `SUBMITTED` → `pending` 
   - `CONFIRMED` → `confirmed`
   - `FAILED` → `failed`
   - Any unknown status → `pending` (default)

2. **Monitoring Strategy**: Implement a polling mechanism with these parameters:
   - **Poll Interval**: 10 seconds between status checks
   - **Max Duration**: 5 minutes (30 attempts total)
   - **Timeout Behavior**: Mark as `failed` if no confirmation after max attempts
   - **Error Handling**: Continue polling on API errors, count towards max attempts

3. **Status Updates**: When transaction reaches `confirmed` or `failed`:
   - Update transaction record in Supabase with new status
   - Store `transactionHash` from response when confirmed
   - Set `confirmed_at` timestamp for confirmed transactions
   - Trigger UI updates and user notifications

4. **Error Recovery**: Handle network failures gracefully:
   - Log errors but continue monitoring
   - Don't immediately fail on temporary API issues
   - Only mark as failed after exhausting all retry attempts

#### 🔑 Authentication Headers

**Implementation Directives**:

1. **Public Endpoint Authentication**:
   - Include `x-client-id` header with your thirdweb client ID
   - Use for balance queries, transaction status checks, and other read-only operations
   - Implement client ID validation and error handling for invalid credentials

2. **Authenticated Endpoint Requirements**:
   - Include both `x-client-id` and `Authorization: Bearer {jwt}` headers
   - Required for payment operations, user wallet actions, and protected resources
   - Implement JWT token refresh logic for expired tokens
   - Handle authentication errors with appropriate user redirects

3. **Environment-Based Configuration**:
   - Store client ID securely in environment variables
   - Use different client IDs for development, staging, and production environments
   - Implement configuration validation on application startup
   - Never expose client secrets in frontend applications

### 💾 Supabase Database Design

**Implementation Directives for Database Schema**:

#### 1. **Users Table Requirements**
Create a users table with the following specifications:
- **Primary Key**: UUID with auto-generation
- **Required Fields**: email (unique), wallet_address (unique)
- **Optional Fields**: username (unique when provided), display_name, avatar_url
- **Timestamps**: created_at, updated_at (auto-managed)
- **Constraints**: Enforce uniqueness on email, wallet_address, and username
- **Data Types**: Use TEXT for strings, TIMESTAMP WITH TIME ZONE for dates

#### 2. **Transactions Table Requirements**
Create a transactions table with these specifications:
- **Primary Key**: UUID with auto-generation
- **User References**: from_user_id, to_user_id (foreign keys to users table)
- **Address Fields**: from_address, to_address (wallet addresses as TEXT)
- **Payment Data**: amount (TEXT for big number support), token_contract, token_symbol, chain_id
- **Blockchain Integration**: thirdweb_transaction_id (unique), transaction_hash
- **User Experience**: message field for payment notes
- **Status Tracking**: status field with constraint (pending, monitoring, confirmed, failed)
- **Timestamps**: created_at, updated_at (auto-managed), confirmed_at (manual)

#### 3. **Security & Performance Setup**
Implement these database features:
- **Row Level Security (RLS)**: Enable on both tables
- **Development Policies**: Create permissive policies for rapid development
- **Production Upgrade Path**: Document how to restrict policies later
- **Performance Indexes**: Create indexes on frequently queried fields
  - Users: wallet_address, username
  - Transactions: status, thirdweb_transaction_id
- **Auto-timestamps**: Implement triggers to automatically update updated_at fields
- **Permissions**: Grant appropriate access to anon and authenticated users

#### 4. **Database Functions & Triggers**
Implement these automated features:
- **Update Timestamp Function**: Auto-update updated_at on record changes
- **Status Validation**: Ensure only valid status values are allowed
- **Referential Integrity**: Maintain proper foreign key relationships
- **UUID Generation**: Use database-native UUID generation for primary keys

#### 5. **Development vs Production Considerations**
- **Development**: Use permissive RLS policies for ease of testing
- **Production**: Implement strict RLS policies based on user authentication
- **Migration Path**: Design schema changes to be backward compatible
- **Backup Strategy**: Plan for regular database backups and disaster recovery

#### 6. **Supabase Client Integration Directives**

**Client Setup Requirements**:
- **Environment Variables**: Use Vite environment variables for Supabase URL and anon key
- **Client Initialization**: Create Supabase client with proper configuration
- **Error Handling**: Implement consistent error handling patterns across all database operations

**Required Database Operations**:

1. **User Management Functions**:
   - **Create/Update User**: Implement upsert operation using wallet_address as conflict resolution
   - **User Search**: Build username search with case-insensitive pattern matching and result limits
   - **User Lookup**: Enable finding users by username for payment recipient resolution

2. **Transaction Management Functions**:
   - **Create Transaction**: Insert new transaction records with proper foreign key relationships
   - **Update Status**: Implement status updates with automatic timestamp management
   - **Transaction History**: Query user's transaction history with proper joins to user data
   - **Real-time Subscriptions**: Set up live transaction updates using Supabase subscriptions

3. **Data Relationships**:
   - **Join Queries**: Implement proper joins between users and transactions tables
   - **Foreign Key Handling**: Ensure referential integrity in all operations
   - **Nested Data**: Structure responses to include related user information in transaction queries

4. **Performance Optimization**:
   - **Query Limits**: Apply appropriate limits to search and list operations
   - **Select Specific Fields**: Only query needed columns to reduce data transfer
   - **Pagination**: Implement pagination for large result sets
   - **Caching Strategy**: Consider client-side caching for frequently accessed user data

## Key User Flows

### 1. User Authentication & Onboarding
1. User enters email in login form
2. App calls thirdweb API to send verification code
3. User enters code, app calls verify endpoint to get JWT token
4. App stores user in Supabase users table with wallet address and email
5. User claims unique username (enforced by Supabase unique constraint)
6. App fetches wallet balances using thirdweb API

### 2. Sending Payment
1. User enters recipient username in payment form
2. App queries Supabase to get recipient's wallet address from username
3. User selects USDC/USDT, enters amount, adds message
4. App calls thirdweb transactions API with ERC-20 transfer data
5. App stores transaction record in Supabase transactions table
6. App polls thirdweb for transaction status and updates Supabase record
7. Both users see real-time updates via Supabase subscriptions

## 📁 Component Structure

```
src/
├── components/
│   ├── auth/                    # Authentication components
│   │   ├── LoginForm.tsx        # Email + code verification with thirdweb
│   │   └── UsernameSetup.tsx    # Username registration for new users
│   ├── payments/                # Payment-related components
│   │   ├── BalanceDisplay.tsx   # Multi-chain balance display with filtering
│   │   ├── SendPayment.tsx      # Payment form with chain/token selection
│   │   └── PaymentConfirm.tsx   # Payment review and execution flow
│   ├── users/                   # User management
│   │   └── UserSearch.tsx       # Search users by username via Supabase
│   ├── transactions/            # Transaction components
│   │   └── TransactionHistory.tsx # Transaction list with real-time updates
│   └── ui/                      # Reusable UI components
│       ├── Layout.tsx           # Main app layout with navigation
│       └── TokenChainSelector.tsx # Chain/token selection component
├── context/
│   └── AuthContext.tsx          # Authentication state with thirdweb + Supabase
├── hooks/
│   └── useChainTokenPreference.ts # Chain/token preference management
├── utils/
│   ├── thirdwebAPI.ts           # Complete thirdweb API integration
│   ├── supabase.ts              # Supabase client and database functions
│   └── contracts.ts             # Token contracts and chain configuration
├── types/                       # TypeScript type definitions
│   └── index.ts                 # Common types and interfaces
├── App.tsx                      # Main app with payment flow state
└── main.tsx                     # Entry point with error handling
```

### 🎨 Design System & Styling

**Implementation Directives**:

1. **Tailwind CSS Configuration**:
   - Set up Tailwind CSS v3 with custom design tokens
   - Configure responsive breakpoints for mobile-first design
   - Implement custom color palette inspired by Venmo's brand
   - Set up font families and typography scales

2. **Component Design Patterns**:
   - **Card Components**: Use rounded corners (2xl), subtle shadows, and consistent padding
   - **Input Fields**: Implement rounded borders, focus states with ring effects, and smooth transitions
   - **Buttons**: Create primary/secondary variants with hover states and disabled styling
   - **Avatars**: Design circular avatars with gradient backgrounds and fallback initials

3. **Mobile-First Responsive Design**:
   - Optimize touch targets for mobile devices (minimum 44px)
   - Implement responsive typography scaling
   - Use flexible layouts with CSS Grid and Flexbox
   - Test across different screen sizes and orientations

4. **Accessibility & UX**:
   - Ensure sufficient color contrast ratios
   - Implement focus indicators for keyboard navigation
   - Use semantic HTML elements and ARIA labels
   - Provide loading states and skeleton screens for better perceived performance

## 🚧 Development Phases

### Phase 1: Core Infrastructure ✅
- **Project setup** with Vite + React 18 + TypeScript
- **Tailwind CSS configuration** with custom Venmo-inspired design system
- **thirdweb API integration** and authentication setup
- **Supabase database** setup with proper schema (`sql/supabase-schema.sql`)

### Phase 2: Authentication & User Management ✅
- **Email-based authentication** flow with thirdweb (`/v1/auth/initiate` + `/v1/auth/complete`)
- **JWT token management** and session persistence with localStorage
- **Username setup** for new users with Supabase uniqueness validation
- **User profile management** in Supabase with proper error handling

### Phase 3: Payment System ✅
- **User search and discovery** component with Supabase user lookup
- **Payment form** with advanced chain/token selection
- **Payment confirmation** flow with thirdweb Payment API
- **thirdweb Payment API** integration (createPayment + completePayment)
- **Transaction execution** and status tracking with proper monitoring

### Phase 4: UI/UX & Polish ✅
- **Figma design implementation** with modern card-based layouts
- **Mobile-first responsive design** with touch-friendly interfaces
- **Performance optimizations** (useCallback, useMemo, proper dependency arrays)
- **Error handling** and user feedback throughout the app
- **Logout functionality** with session management

### Phase 5: Advanced Chain & Token Selection ✅
- **Reusable TokenChainSelector** component with visual indicators
- **Smart balance filtering** by chain and token with "Show All" toggle
- **Persistent user preferences** with localStorage and auto-selection
- **Enhanced chain metadata** with icons, descriptions, block times
- **Performance-optimized** balance fetching for selected networks
- **Real-time updates** when chain/token selection changes

## ⚙️ Environment Configuration

**Environment Configuration Directives**:

1. **Required Environment Variables**:
   - **thirdweb Client ID**: Obtain from thirdweb dashboard and set as `VITE_THIRDWEB_CLIENT_ID`
   - **Supabase URL**: Set `VITE_SUPABASE_URL` from Supabase project settings
   - **Supabase Anon Key**: Set `VITE_SUPABASE_ANON_KEY` for client-side operations

2. **Token Contract Configuration**:
   - Configure USDC contract addresses for each supported network
   - Set Ethereum USDC: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`
   - Set Polygon USDC: `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174`
   - Set Base USDC: `0x833589fcd6edb6e08f4c7c32d4f71b54bda02913`

3. **Default Chain Setup**:
   - Set Base (chain ID 8453) as the default network for optimal user experience
   - Implement fallback logic for unsupported chains
   - Allow users to override default chain selection through preferences

4. **Environment Security**:
   - Use Vite's `VITE_` prefix for frontend environment variables
   - Never expose secret keys in frontend applications
   - Validate all environment variables on application startup
   - Provide clear error messages for missing configuration

### 🌐 Supported Networks & Tokens

#### Base (Default Chain - ID: 8453)
- **USDC**: `0x833589fcd6edb6e08f4c7c32d4f71b54bda02913`
- **Icon**: 🟦 | **Gas**: ETH | **Block Time**: ~2s
- **Description**: Ethereum L2 for next billion users

#### Ethereum Mainnet (ID: 1)
- **USDC**: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`
- **Icon**: 💎 | **Gas**: ETH | **Block Time**: ~12s
- **Description**: World's programmable blockchain

#### Polygon (ID: 137)
- **USDC**: `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174`
- **Icon**: 🟣 | **Gas**: MATIC | **Block Time**: ~2s
- **Description**: Ethereum scaling solution

## 🎯 Success Criteria & Key Features

### ✅ Authentication & User Management
- [x] **Email verification** using thirdweb `/v1/auth/initiate` and `/v1/auth/complete`
- [x] **JWT token management** with localStorage persistence
- [x] **User profiles** stored and managed via Supabase with unique usernames
- [x] **Session persistence** across browser restarts

### ✅ Payment & Transaction System
- [x] **Username-based payments** with Supabase address lookup
- [x] **Multi-chain support** (Base, Ethereum, Polygon) with user preferences
- [x] **thirdweb Payment API** integration (createPayment + completePayment)
- [x] **Insufficient funds handling** with payment links
- [x] **Transaction monitoring** from 'queued' → 'submitted' → 'confirmed'/'failed'
- [x] **Real-time status updates** with proper error handling

### ✅ Advanced Features
- [x] **Chain & token selection** with persistent user preferences
- [x] **Smart balance filtering** with "Show All" toggle
- [x] **Performance optimizations** (useCallback, useMemo, dependency arrays)
- [x] **Mobile-first responsive design** with Venmo-inspired UI
- [x] **Error boundaries** and comprehensive error handling
- [x] **Local storage persistence** for user preferences

### 🔧 Technical Excellence
- [x] **TypeScript** throughout with proper type definitions
- [x] **React 18** with modern hooks and performance patterns
- [x] **Tailwind CSS v3** with custom design system
- [x] **Supabase integration** with proper RLS policies
- [x] **Real-time updates** via Supabase subscriptions
- [x] **Proper state management** with React Context

## 🚀 Implementation Guidelines

### 📋 Development Checklist
1. **Setup Project**: Vite + React 18 + TypeScript + Tailwind CSS
2. **Configure Environment**: thirdweb Client ID + Supabase credentials
3. **Database Setup**: Run `sql/supabase-schema.sql` in Supabase
4. **Authentication**: Implement thirdweb email/code flow with JWT persistence
5. **User Management**: Username setup + user search with Supabase
6. **Chain/Token Selection**: Build TokenChainSelector with preferences
7. **Balance Display**: Multi-chain balance fetching with filtering
8. **Payment Flow**: Search → Send → Confirm → Monitor → Complete
9. **Transaction Monitoring**: Status tracking with blockchain confirmation
10. **UI/UX Polish**: Mobile-first design with loading states and error handling

### 🛡️ Best Practices
- **Error Handling**: Try/catch blocks with user-friendly error messages
- **Performance**: Use useCallback/useMemo to prevent infinite re-renders
- **Security**: Validate inputs and use Supabase RLS policies
- **UX**: Loading states, skeleton screens, and optimistic updates
- **Code Quality**: TypeScript strict mode, proper component structure
- **Testing**: Test authentication flow, payment creation, and status monitoring

### 📖 Key Learning Points
- **thirdweb Payment API** is the recommended approach (not direct token transfers)
- **Status mapping** is crucial for transaction monitoring
- **Local storage** for user preferences enhances UX
- **Chain selection** should be user-friendly with visual indicators
- **Error handling** must cover insufficient funds, network issues, and API failures

Build this incrementally following the phases, ensuring robust error handling and excellent user experience at each step. Focus on the thirdweb Payment API flow rather than direct token transfers for better UX and automatic insufficient funds handling.