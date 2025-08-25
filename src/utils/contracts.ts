export interface TokenContract {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  chainId: number;
}

export interface ChainConfig {
  id: number;
  name: string;
  tokens: TokenContract[];
}

// Chain IDs
export const CHAIN_IDS = {
  ETHEREUM: 1,
  POLYGON: 137,
  BASE: 8453,
} as const;

// Default chain (Base)
export const DEFAULT_CHAIN_ID = CHAIN_IDS.BASE;

// Get contract addresses from environment variables with fallbacks
const getContractAddress = (envVar: string, fallback: string): string => {
  const address = import.meta.env[envVar];
  return address && address !== 'your_address_here' ? address : fallback;
};

// Token contract addresses for each chain
export const TOKENS: Record<number, TokenContract[]> = {
  [CHAIN_IDS.ETHEREUM]: [
    {
      address: getContractAddress('VITE_ETHEREUM_USDC_ADDRESS', '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: CHAIN_IDS.ETHEREUM,
    },
    {
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      chainId: CHAIN_IDS.ETHEREUM,
    },
  ],
  [CHAIN_IDS.POLYGON]: [
    {
      address: getContractAddress('VITE_POLYGON_USDC_ADDRESS', '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'),
      symbol: 'USDC',
      name: 'USD Coin (PoS)',
      decimals: 6,
      chainId: CHAIN_IDS.POLYGON,
    },
    {
      address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      symbol: 'USDT',
      name: 'Tether USD (PoS)',
      decimals: 6,
      chainId: CHAIN_IDS.POLYGON,
    },
  ],
  [CHAIN_IDS.BASE]: [
    {
      address: getContractAddress('VITE_BASE_USDC_ADDRESS', '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'),
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: CHAIN_IDS.BASE,
    },
  ],
};

export const CHAINS: ChainConfig[] = [
  {
    id: CHAIN_IDS.BASE,
    name: 'Base',
    tokens: TOKENS[CHAIN_IDS.BASE],
  },
  {
    id: CHAIN_IDS.ETHEREUM,
    name: 'Ethereum',
    tokens: TOKENS[CHAIN_IDS.ETHEREUM],
  },
  {
    id: CHAIN_IDS.POLYGON,
    name: 'Polygon',
    tokens: TOKENS[CHAIN_IDS.POLYGON],
  },
];

// Helper functions
export const getTokensByChain = (chainId: number): TokenContract[] => {
  return TOKENS[chainId] || [];
};

export const getTokenByAddress = (chainId: number, address: string): TokenContract | undefined => {
  const tokens = getTokensByChain(chainId);
  return tokens.find(token => token.address.toLowerCase() === address.toLowerCase());
};

export const getChainName = (chainId: number): string => {
  const chain = CHAINS.find(c => c.id === chainId);
  return chain?.name || `Chain ${chainId}`;
};

export const getAllTokens = (): TokenContract[] => {
  return Object.values(TOKENS).flat();
};

export const getDefaultToken = (): TokenContract => {
  // Return Base USDC as the default token
  return TOKENS[DEFAULT_CHAIN_ID][0]; // First token in Base array (USDC)
};

export const getDefaultChain = (): ChainConfig => {
  // Return Base as the default chain
  return CHAINS[0]; // Base is now first in the array
};

export const formatTokenAmount = (amount: string | undefined | null, decimals: number): string => {
  // Handle undefined, null, or empty values
  if (!amount || amount === '' || amount === 'undefined' || amount === 'null') {
    return '0';
  }
  
  try {
    const bigIntAmount = BigInt(amount);
    const divisor = BigInt(10 ** decimals);
    const wholePart = bigIntAmount / divisor;
    const fractionalPart = bigIntAmount % divisor;
    
    if (fractionalPart === 0n) {
      return wholePart.toString();
    }
    
    const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
    const trimmedFractional = fractionalStr.replace(/0+$/, '');
    
    return `${wholePart}.${trimmedFractional}`;
  } catch (error) {
    console.error('Error formatting token amount:', { amount, decimals, error });
    return '0';
  }
};

export const parseTokenAmount = (amount: string, decimals: number): string => {
  const [wholePart, fractionalPart = ''] = amount.split('.');
  const paddedFractional = fractionalPart.padEnd(decimals, '0').slice(0, decimals);
  const result = BigInt(wholePart + paddedFractional);
  return result.toString();
};
