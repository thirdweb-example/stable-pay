import React, { useState, useEffect, useCallback } from 'react';
import { Wallet, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getWalletBalance } from '../../utils/thirdwebAPI';
import { CHAINS, formatTokenAmount, type TokenContract } from '../../utils/contracts';

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

  const { user } = useAuth();

  const fetchBalances = useCallback(async (showSpinner = false) => {
    if (!user?.wallet_address) return;

    if (showSpinner) setIsRefreshing(true);
    else setIsLoading(true);
    setError('');

    try {
      const balancePromises: Promise<Balance>[] = [];

      // Prioritize Base USDC first, then other tokens
      const sortedChains = [...CHAINS].sort((a, b) => {
        // Put Base first
        if (a.id === 8453) return -1;
        if (b.id === 8453) return 1;
        return 0;
      });

      // Fetch balances for all tokens across all chains
      sortedChains.forEach(chain => {
        chain.tokens.forEach(token => {
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
      
      // Sort results to prioritize Base USDC
      const sortedResults = results.sort((a, b) => {
        // Base USDC first
        if (a.token.chainId === 8453 && a.token.symbol === 'USDC') return -1;
        if (b.token.chainId === 8453 && b.token.symbol === 'USDC') return 1;
        // Then other USDC tokens
        if (a.token.symbol === 'USDC' && b.token.symbol !== 'USDC') return -1;
        if (b.token.symbol === 'USDC' && a.token.symbol !== 'USDC') return 1;
        return 0;
      });
      
      // Filter out zero balances for cleaner display, but always show Base USDC
      const baseUSDC = sortedResults.find(b => b.token.chainId === 8453 && b.token.symbol === 'USDC');
      const nonZeroBalances = sortedResults.filter(b => b.balance !== '0');
      
      if (baseUSDC) {
        // Always include Base USDC, even if zero
        const otherBalances = nonZeroBalances.filter(b => !(b.token.chainId === 8453 && b.token.symbol === 'USDC'));
        setBalances([baseUSDC, ...otherBalances]);
      } else if (nonZeroBalances.length > 0) {
        setBalances(nonZeroBalances);
      } else {
        // Show first token if no balances
        setBalances(sortedResults.slice(0, 1));
      }
    } catch (error) {
      console.error('Failed to fetch balances:', error);
      setError('Failed to load balances');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.wallet_address]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  const handleRefresh = () => {
    fetchBalances(true);
  };

  const toggleVisibility = () => {
    setShowBalances(!showBalances);
  };

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
