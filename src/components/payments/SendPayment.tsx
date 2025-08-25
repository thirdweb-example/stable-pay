import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, Send, MessageCircle, DollarSign, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { type User } from '../../utils/supabase';
import { CHAINS, type TokenContract, parseTokenAmount, formatTokenAmount, CHAIN_IDS } from '../../utils/contracts';
import { getWalletBalance } from '../../utils/thirdwebAPI';

// Constants moved outside component to prevent recreation
const QUICK_AMOUNTS = ['1', '5', '10', '20', '50'];

interface SendPaymentProps {
  recipient: User;
  onBack: () => void;
  onPaymentConfirm: (paymentData: PaymentData) => void;
}

export interface PaymentData {
  recipient: User;
  token: TokenContract;
  amount: string;
  amountWei: string;
  message: string;
}

const SendPayment: React.FC<SendPaymentProps> = ({ recipient, onBack, onPaymentConfirm }) => {
  const { user } = useAuth();
  const [selectedToken, setSelectedToken] = useState<TokenContract | null>(null);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [availableTokens, setAvailableTokens] = useState<TokenContract[]>([]);
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [isLoadingBalances, setIsLoadingBalances] = useState(true);
  const [error, setError] = useState('');

  // Load available tokens and balances
  const loadTokensAndBalances = useCallback(async () => {
      if (!user?.wallet_address) return;

      setIsLoadingBalances(true);
      const tokens: TokenContract[] = [];
      const balanceMap: Record<string, string> = {};

      try {
        // Get all tokens across all chains
        for (const chain of CHAINS) {
          for (const token of chain.tokens) {
            tokens.push(token);
            
            try {
              const balanceResponse = await getWalletBalance(
                user.wallet_address,
                token.chainId,
                token.address
              );
              const balanceKey = `${token.chainId}-${token.address}`;
              balanceMap[balanceKey] = balanceResponse.result.value;
            } catch (error) {
              console.error(`Failed to fetch balance for ${token.symbol}:`, error);
              balanceMap[`${token.chainId}-${token.address}`] = '0';
            }
          }
        }

        setAvailableTokens(tokens);
        setBalances(balanceMap);

        // Auto-select Base USDC first, then any USDC, then first token
        const baseUSDC = tokens.find(t => t.symbol === 'USDC' && t.chainId === CHAIN_IDS.BASE);
        const firstUSDC = tokens.find(t => t.symbol === 'USDC');

        if (baseUSDC) {
          setSelectedToken(baseUSDC);
        } else if (firstUSDC) {
          setSelectedToken(firstUSDC);
        } else {
          setSelectedToken(tokens[0]);
        }
      } catch (error) {
        console.error('Failed to load tokens and balances:', error);
        setError('Failed to load available tokens');
      } finally {
        setIsLoadingBalances(false);
      }
  }, [user?.wallet_address]);

  useEffect(() => {
    loadTokensAndBalances();
  }, [loadTokensAndBalances]);

  const getTokenBalance = useCallback((token: TokenContract): string => {
    const balanceKey = `${token.chainId}-${token.address}`;
    return balances[balanceKey] || '0';
  }, [balances]);

  const getFormattedBalance = useCallback((token: TokenContract): string => {
    const balance = getTokenBalance(token);
    return formatTokenAmount(balance, token.decimals);
  }, [getTokenBalance]);

  const handleAmountChange = useCallback((value: string) => {
    // Only allow numbers and one decimal point
    const regex = /^\d*\.?\d*$/;
    if (regex.test(value)) {
      setAmount(value);
      setError('');
    }
  }, []);

  const validateAmount = useCallback((): boolean => {
    if (!selectedToken || !amount) {
      setError('');
      return false;
    }

    const amountFloat = parseFloat(amount);
    if (isNaN(amountFloat) || amountFloat <= 0) {
      setError('Please enter a valid amount');
      return false;
    }

    // No balance validation needed - thirdweb payment API handles insufficient balance
    setError('');
    return true;
  }, [selectedToken, amount]);

  const handleContinue = useCallback(() => {
    if (!selectedToken || !validateAmount()) return;

    try {
      const amountWei = parseTokenAmount(amount, selectedToken.decimals);
      
      const paymentData: PaymentData = {
        recipient,
        token: selectedToken,
        amount,
        amountWei,
        message: message.trim(),
      };

      onPaymentConfirm(paymentData);
    } catch (error) {
      console.error('Error in handleContinue:', error);
      setError('Invalid amount format');
    }
  }, [selectedToken, validateAmount, amount, message, recipient, onPaymentConfirm]);

  const handleQuickAmountClick = useCallback((quickAmount: string) => {
    setAmount(quickAmount);
    setError('');
  }, []);



  const handleTokenSelect = useCallback((token: TokenContract) => {
    setSelectedToken(token);
    setShowTokenSelector(false);
    setAmount('');
    setError('');
  }, []);

  const toggleTokenSelector = useCallback(() => {
    setShowTokenSelector(!showTokenSelector);
  }, [showTokenSelector]);

  // Memoize tokens with their balance information to prevent recalculation
  const tokensWithBalances = useMemo(() => {
    return availableTokens.map(token => {
      const balance = getTokenBalance(token);
      const formattedBalance = formatTokenAmount(balance, token.decimals);
      const hasBalance = parseFloat(formattedBalance) > 0;
      
      return {
        ...token,
        balance,
        formattedBalance,
        hasBalance
      };
    });
  }, [availableTokens, getTokenBalance]);

  // Memoize validation result to prevent calling validateAmount() on every render
  const isAmountValid = useMemo(() => {
    if (!selectedToken || !amount) return false;

    const amountFloat = parseFloat(amount);
    if (isNaN(amountFloat) || amountFloat <= 0) {
      return false;
    }

    // No balance check needed - thirdweb payment API handles insufficient balance
    return true;
  }, [selectedToken, amount]);

  // Memoize selected token display info to prevent function calls in JSX
  const selectedTokenInfo = useMemo(() => {
    if (!selectedToken) return null;
    
    return {
      formattedBalance: getFormattedBalance(selectedToken),
      chainName: CHAINS.find(c => c.id === selectedToken.chainId)?.name || 'Unknown Chain'
    };
  }, [selectedToken, getFormattedBalance]);

  // Run validation when values change to show error messages
  useEffect(() => {
    if (amount && selectedToken) {
      validateAmount();
    }
  }, [amount, selectedToken, validateAmount]);

  if (isLoadingBalances) {
    return (
      <div className="p-4">
        <div className="venmo-card">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900">Send Payment</h1>
      </div>

      {/* Recipient Info */}
      <div className="venmo-card">
        <div className="flex items-center space-x-3">
          <div className="venmo-avatar">
            {recipient.display_name?.[0]?.toUpperCase() || recipient.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="font-semibold text-gray-900">
              {recipient.display_name || recipient.username}
            </p>
            <p className="text-sm text-gray-500">@{recipient.username}</p>
          </div>
        </div>
      </div>

      {/* Payment Form */}
      <div className="venmo-card space-y-6">
        {/* Token Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Currency
          </label>
          <button
            onClick={toggleTokenSelector}
            className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-blue-500 transition-colors"
          >
            {selectedToken ? (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xs">
                    {selectedToken.symbol[0]}
                  </span>
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">{selectedToken.symbol}</p>
                  <p className="text-sm text-gray-500">
                    {selectedTokenInfo?.chainName} • Balance: {selectedTokenInfo?.formattedBalance}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Select currency</p>
            )}
            <ChevronDown className="h-5 w-5 text-gray-400" />
          </button>

          {/* Token Selector Dropdown */}
          {showTokenSelector && (
            <div className="mt-2 border border-gray-200 rounded-xl bg-white shadow-lg max-h-60 overflow-y-auto">
              {tokensWithBalances.map((tokenWithBalance) => {
                
                return (
                  <button
                    key={`${tokenWithBalance.chainId}-${tokenWithBalance.address}`}
                    onClick={() => handleTokenSelect(tokenWithBalance)}
                    className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                      selectedToken?.address === tokenWithBalance.address && selectedToken?.chainId === tokenWithBalance.chainId
                        ? 'bg-blue-50'
                        : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-xs">
                          {tokenWithBalance.symbol[0]}
                        </span>
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">{tokenWithBalance.symbol}</p>
                        <p className="text-sm text-gray-500">
                          {CHAINS.find(c => c.id === tokenWithBalance.chainId)?.name} • Balance: {tokenWithBalance.formattedBalance}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-600">
                        {tokenWithBalance.formattedBalance} {tokenWithBalance.symbol}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0.00"
              className="venmo-input pl-10 text-2xl font-semibold text-center"
            />
          </div>
          
          {selectedToken && (
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Current Balance: {selectedTokenInfo?.formattedBalance} {selectedToken.symbol}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                💡 Don't worry about insufficient balance - you can add funds during payment
              </p>
            </div>
          )}

          {/* Quick Amount Buttons */}
          <div className="mt-3 flex space-x-2">
            {QUICK_AMOUNTS.map((quickAmount) => (
              <button
                key={quickAmount}
                onClick={() => handleQuickAmountClick(quickAmount)}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
              >
                ${quickAmount}
              </button>
            ))}
          </div>
        </div>

        {/* Message Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message (optional)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MessageCircle className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What's this for?"
              className="venmo-input pl-10"
              maxLength={100}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {message.length}/100 characters
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={!selectedToken || !amount || !isAmountValid}
          className="venmo-button w-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4 mr-2" />
          Continue
        </button>
      </div>
    </div>
  );
};

export default SendPayment;
