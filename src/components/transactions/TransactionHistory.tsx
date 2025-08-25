import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getUserTransactions, subscribeToUserTransactions, type Transaction } from '../../utils/supabase';
import { CHAINS, formatTokenAmount } from '../../utils/contracts';

const TransactionHistory: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.id) return;

    const loadTransactions = async () => {
      try {
        setIsLoading(true);
        const userTransactions = await getUserTransactions(user.id);
        setTransactions(userTransactions);
      } catch (error) {
        console.error('Failed to load transactions:', error);
        setError('Failed to load transaction history');
      } finally {
        setIsLoading(false);
      }
    };

    loadTransactions();

    // Subscribe to real-time updates
    const subscription = subscribeToUserTransactions(user.id, (transaction) => {
      setTransactions(prev => {
        const existingIndex = prev.findIndex(t => t.id === transaction.id);
        if (existingIndex >= 0) {
          // Update existing transaction
          const updated = [...prev];
          updated[existingIndex] = transaction;
          return updated;
        } else {
          // Add new transaction
          return [transaction, ...prev];
        }
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  const handleRefresh = async () => {
    if (!user?.id) return;
    
    try {
      const userTransactions = await getUserTransactions(user.id);
      setTransactions(userTransactions);
      setError('');
    } catch (error) {
      console.error('Failed to refresh transactions:', error);
      setError('Failed to refresh transactions');
    }
  };

  const getTransactionIcon = (transaction: Transaction, isOutgoing: boolean) => {
    const iconClass = "h-5 w-5";
    
    if (transaction.status === 'pending') {
      return <Clock className={`${iconClass} text-yellow-500`} />;
    } else if (transaction.status === 'confirmed') {
      return isOutgoing 
        ? <ArrowUpRight className={`${iconClass} text-red-500`} />
        : <ArrowDownLeft className={`${iconClass} text-green-500`} />;
    } else {
      return <XCircle className={`${iconClass} text-red-500`} />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Confirmed
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </span>
        );
      default:
        return null;
    }
  };

  const getExplorerUrl = (transaction: Transaction) => {
    if (!transaction.transaction_hash) return '';
    
    const baseUrls: Record<number, string> = {
      1: 'https://etherscan.io/tx/',
      137: 'https://polygonscan.com/tx/',
      8453: 'https://basescan.org/tx/',
    };

    return baseUrls[transaction.chain_id] + transaction.transaction_hash;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 168) { // Less than a week
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="venmo-card animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="venmo-card">
        <div className="text-center py-8">
          <XCircle className="h-12 w-12 text-red-300 mx-auto mb-3" />
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="venmo-card">
        <div className="text-center py-8">
          <ArrowUpRight className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No transactions yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Your payment history will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        <button
          onClick={handleRefresh}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Transaction List */}
      <div className="space-y-3">
        {transactions.map((transaction) => {
          const isOutgoing = transaction.from_user_id === user?.id;
          const otherUser = isOutgoing ? transaction.to_user : transaction.from_user;
          const formattedAmount = formatTokenAmount(transaction.amount, 6); // Assuming 6 decimals for stablecoins
          const chainName = CHAINS.find(c => c.id === transaction.chain_id)?.name || `Chain ${transaction.chain_id}`;

          return (
            <div key={transaction.id} className="venmo-card hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-4">
                {/* Avatar and Icon */}
                <div className="relative">
                  <div className="venmo-avatar">
                    {otherUser?.display_name?.[0]?.toUpperCase() || otherUser?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                    {getTransactionIcon(transaction, isOutgoing)}
                  </div>
                </div>

                {/* Transaction Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {isOutgoing ? 'Paid' : 'Received from'} {otherUser?.display_name || otherUser?.username}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-sm text-gray-500">
                          @{otherUser?.username}
                        </p>
                        <span className="text-gray-300">•</span>
                        <p className="text-sm text-gray-500">
                          {formatDate(transaction.created_at)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className={`font-semibold ${
                        isOutgoing 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      }`}>
                        {isOutgoing ? '-' : '+'}{formattedAmount} {transaction.token_symbol}
                      </p>
                      <p className="text-xs text-gray-500">{chainName}</p>
                    </div>
                  </div>

                  {/* Message */}
                  {transaction.message && (
                    <p className="text-sm text-gray-600 mt-2 italic">
                      "{transaction.message}"
                    </p>
                  )}

                  {/* Status and Actions */}
                  <div className="flex items-center justify-between mt-3">
                    {getStatusBadge(transaction.status)}
                    
                    {transaction.transaction_hash && (
                      <a
                        href={getExplorerUrl(transaction)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs text-blue-500 hover:underline"
                      >
                        View on Explorer
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More (placeholder for pagination) */}
      {transactions.length >= 20 && (
        <div className="text-center">
          <button className="px-4 py-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
            Load More
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
