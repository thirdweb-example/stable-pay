import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Wallet, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getWalletBalance } from '../../utils/thirdwebAPI';
import { CHAINS, formatTokenAmount, type TokenContract, DEFAULT_CHAIN_ID } from '../../utils/contracts';
import TokenChainSelector from '../ui/TokenChainSelector';
import { useChainTokenPreference } from '../../hooks/useChainTokenPreference';

interface Balance {
  token: TokenContract;
  balance: string;
  formattedBalance: string;
  usdValue?: string;
}

const BalanceDisplay: React.FC = () => {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showBalances, setShowBalances] = useState(true);
  const [error, setError] = useState('');
  const [showAllChains, setShowAllChains] = useState(false);

  const { user } = useAuth();
  const { preference, updateChain, updateToken } = useChainTokenPreference();
  const { chainId: selectedChainId, tokenAddress: selectedTokenAddress } = preference;

  const fetchBalances = useCallback(async (showSpinner = false) => {
    if (!user?.wallet_address) return;

    if (showSpinner) setIsRefreshing(true);
    else setIsLoading(true);
    setError('');

    try {
      const balancePromises: Promise<Balance>[] = [];

      // Determine which chains and tokens to fetch
      let chainsToFetch = CHAINS;
      if (!showAllChains && selectedChainId) {
        chainsToFetch = CHAINS.filter(chain => chain.id === selectedChainId);
      }

      // Fetch balances for selected chains and tokens
      chainsToFetch.forEach(chain => {
        let tokensToFetch = chain.tokens;
        if (selectedTokenAddress) {
          tokensToFetch = chain.tokens.filter(token => token.address === selectedTokenAddress);
        }

        tokensToFetch.forEach(token => {
          const promise = getWalletBalance(
            user.wallet_address,
            token.chainId,
            token.address
          ).then(response => {
            // Handle array result from getWalletBalance
            const balanceData = Array.isArray(response.result) ? response.result[0] : response.result;
            
            return {
              token,
              balance: balanceData?.value || '0',
              formattedBalance: formatTokenAmount(balanceData?.value || '0', token.decimals),
              usdValue: undefined // We could add price API integration here
            };
          }).catch(error => {
            console.error(`Failed to fetch ${token.symbol} balance on ${chain.name}:`, error);
            return {
              token,
              balance: '0',
              formattedBalance: '0',
              usdValue: undefined
            };
          });
          
          balancePromises.push(promise);
        });
      });

      const results = await Promise.all(balancePromises);
      
      // Sort results by chain and token
      const sortedResults = results.sort((a, b) => {
        // Sort by chain ID first
        if (a.token.chainId !== b.token.chainId) {
          return a.token.chainId - b.token.chainId;
        }
        // Then by token symbol
        return a.token.symbol.localeCompare(b.token.symbol);
      });
      
      // Filter out zero balances for cleaner display
      const nonZeroBalances = sortedResults.filter(b => b.balance !== '0');
      
      if (nonZeroBalances.length > 0) {
        setBalances(nonZeroBalances);
      } else {
        // Show all results if no non-zero balances
        setBalances(sortedResults);
      }
    } catch (error) {
      console.error('Failed to fetch balances:', error);
      setError('Failed to load balances');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.wallet_address, selectedChainId, selectedTokenAddress, showAllChains]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  const handleRefresh = () => {
    fetchBalances(true);
  };

  const toggleVisibility = () => {
    setShowBalances(!showBalances);
  };

  const handleChainSelect = (chainId: number) => {
    updateChain(chainId);
  };

  const handleTokenSelect = (token: TokenContract) => {
    updateToken(token);
  };

  const toggleShowAllChains = () => {
    setShowAllChains(!showAllChains);
    if (!showAllChains) {
      updateChain(DEFAULT_CHAIN_ID);
      // Reset token selection by updating with a dummy token
      const defaultChain = CHAINS.find(c => c.id === DEFAULT_CHAIN_ID);
      if (defaultChain?.tokens[0]) {
        updateToken(defaultChain.tokens[0]);
      }
    } else {
      updateChain(DEFAULT_CHAIN_ID);
    }
  };

  // Create balance mapping for the selector
  const balanceMap = useMemo(() => {
    const map: Record<string, string> = {};
    balances.forEach(balance => {
      map[balance.token.address] = balance.formattedBalance;
    });
    return map;
  }, [balances]);

  const getTotalUSDValue = () => {
    // For demo purposes, we'll assume 1 USDC/USDT = $1
    return balances.reduce((total, balance) => {
      if (balance.token.symbol === 'USDC' || balance.token.symbol === 'USDT') {
        return total + parseFloat(balance.formattedBalance || '0');
      }
      return total;
    }, 0).toFixed(2);
  };

  if (isLoading) {
    return (
      <div className="venmo-card animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-200 rounded w-24"></div>
          <div className="h-8 bg-gray-200 rounded w-8"></div>
        </div>
        <div className="space-y-3">
          <div className="h-8 bg-gray-200 rounded w-32"></div>
          <div className="h-4 bg-gray-200 rounded w-48"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="venmo-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Wallet className="h-5 w-5 text-blue-500" />
          <h2 className="text-lg font-semibold text-gray-900">Your Balance</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleVisibility}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={() => fetchBalances()}
            className="text-red-600 text-sm underline mt-1"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Chain and Token Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">Filter Balances</h3>
              <button
                onClick={toggleShowAllChains}
                className={`text-sm px-3 py-1 rounded-full transition-colors ${
                  showAllChains 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {showAllChains ? 'Show All' : 'Filter'}
              </button>
            </div>
            
            {!showAllChains && (
              <TokenChainSelector
                selectedChainId={selectedChainId}
                selectedTokenAddress={selectedTokenAddress}
                onChainSelect={handleChainSelect}
                onTokenSelect={handleTokenSelect}
                balances={balanceMap}
                showBalances={showBalances}
              />
            )}
          </div>

          {/* Total Value */}
          <div>
            <div className="text-3xl font-bold text-gray-900">
              {showBalances ? `$${getTotalUSDValue()}` : '••••••'}
            </div>
            <p className="text-sm text-gray-500">Total USD value</p>
          </div>

          {/* Individual Balances */}
          <div className="space-y-3">
            {balances.map((balance) => (
              <div
                key={`${balance.token.chainId}-${balance.token.address}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {balance.token.symbol[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {balance.token.symbol}
                    </p>
                    <p className="text-sm text-gray-500">
                      {balance.token.name}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {showBalances ? balance.formattedBalance : '••••••'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {CHAINS.find(c => c.id === balance.token.chainId)?.name}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {balances.length === 0 && (
            <div className="text-center py-8">
              <Wallet className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No balances to display</p>
              <button
                onClick={() => fetchBalances()}
                className="text-blue-500 text-sm mt-2 hover:underline"
              >
                Refresh
              </button>
            </div>
          )}

          {/* Wallet Address */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Wallet Address</p>
            <p className="text-xs font-mono text-gray-700 break-all">
              {user?.wallet_address}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BalanceDisplay;
