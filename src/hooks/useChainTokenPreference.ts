import { useState, useEffect } from 'react';
import { DEFAULT_CHAIN_ID } from '../utils/contracts';
import { type TokenContract } from '../utils/contracts';

interface ChainTokenPreference {
  chainId: number;
  tokenAddress: string | null;
}

const STORAGE_KEY = 'crypto-venmo-chain-token-preference';

export const useChainTokenPreference = () => {
  const [preference, setPreference] = useState<ChainTokenPreference>({
    chainId: DEFAULT_CHAIN_ID,
    tokenAddress: null
  });

  // Load preference from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreference(parsed);
      }
    } catch (error) {
      console.warn('Failed to load chain/token preference from localStorage:', error);
    }
  }, []);

  // Save preference to localStorage
  const savePreference = (chainId: number, tokenAddress: string | null) => {
    const newPreference = { chainId, tokenAddress };
    setPreference(newPreference);
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPreference));
    } catch (error) {
      console.warn('Failed to save chain/token preference to localStorage:', error);
    }
  };

  // Update chain preference
  const updateChain = (chainId: number) => {
    savePreference(chainId, null); // Reset token when chain changes
  };

  // Update token preference
  const updateToken = (token: TokenContract) => {
    savePreference(token.chainId, token.address);
  };

  return {
    preference,
    updateChain,
    updateToken,
    savePreference
  };
};
