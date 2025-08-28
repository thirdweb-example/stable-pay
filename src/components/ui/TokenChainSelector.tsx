import React, { useState, useMemo } from 'react';
import { ChevronDown, Check, Globe, Coins } from 'lucide-react';
import { CHAINS, type TokenContract } from '../../utils/contracts';

interface TokenChainSelectorProps {
  selectedChainId: number | null;
  selectedTokenAddress: string | null;
  onChainSelect: (chainId: number) => void;
  onTokenSelect: (token: TokenContract) => void;
  balances?: Record<string, string>; // token address -> balance mapping
  showBalances?: boolean;
  className?: string;
}

const TokenChainSelector: React.FC<TokenChainSelectorProps> = ({
  selectedChainId,
  selectedTokenAddress,
  onChainSelect,
  onTokenSelect,
  balances = {},
  showBalances = true,
  className = ''
}) => {
  const [showChainSelector, setShowChainSelector] = useState(false);
  const [showTokenSelector, setShowTokenSelector] = useState(false);

  const selectedChain = useMemo(() => 
    CHAINS.find(c => c.id === selectedChainId) || CHAINS[0], 
    [selectedChainId]
  );

  const selectedToken = useMemo(() => 
    selectedChain?.tokens.find(t => t.address === selectedTokenAddress) || selectedChain?.tokens[0], 
    [selectedChain, selectedTokenAddress]
  );

  const handleChainSelect = (chainId: number) => {
    onChainSelect(chainId);
    // Reset token selection when chain changes
    const newChain = CHAINS.find(c => c.id === chainId);
    if (newChain?.tokens[0]) {
      onTokenSelect(newChain.tokens[0]);
    }
    setShowChainSelector(false);
  };

  const handleTokenSelect = (token: TokenContract) => {
    onTokenSelect(token);
    setShowTokenSelector(false);
  };

  const formatBalance = (address: string) => {
    const balance = balances[address];
    if (!balance || !showBalances) return '';
    return parseFloat(balance) > 0 ? `(${parseFloat(balance).toFixed(2)})` : '';
  };

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      {/* Chain Selector */}
      <div className="relative">
        <button
          onClick={() => setShowChainSelector(!showChainSelector)}
          className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Globe className="h-5 w-5 text-blue-500" />
            <span className="font-medium text-gray-900">{selectedChain?.name}</span>
          </div>
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showChainSelector ? 'rotate-180' : ''}`} />
        </button>

        {showChainSelector && (
          <div className="absolute top-full left-0 right-0 mt-1 border border-gray-200 rounded-lg bg-white shadow-lg z-10 max-h-60 overflow-y-auto">
            {CHAINS.map((chain) => (
              <button
                key={chain.id}
                onClick={() => handleChainSelect(chain.id)}
                className={`w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors ${
                  selectedChainId === chain.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">{chain.icon || chain.name[0]}</span>
                  </div>
                  <div className="text-left">
                    <span className="font-medium text-gray-900">{chain.name}</span>
                    {chain.description && (
                      <p className="text-xs text-gray-500">{chain.description}</p>
                    )}
                  </div>
                </div>
                {selectedChainId === chain.id && (
                  <Check className="h-4 w-4 text-blue-500" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Token Selector */}
      <div className="relative">
        <button
          onClick={() => setShowTokenSelector(!showTokenSelector)}
          className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Coins className="h-5 w-5 text-green-500" />
            <div className="text-left">
              <span className="font-medium text-gray-900">{selectedToken?.symbol}</span>
              <span className="text-sm text-gray-500 ml-2">{selectedToken?.name}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {showBalances && selectedToken && (
              <span className="text-sm text-gray-500">
                {formatBalance(selectedToken.address)}
              </span>
            )}
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showTokenSelector ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {showTokenSelector && (
          <div className="absolute top-full left-0 right-0 mt-1 border border-gray-200 rounded-lg bg-white shadow-lg z-10 max-h-60 overflow-y-auto">
            {selectedChain?.tokens.map((token) => (
              <button
                key={token.address}
                onClick={() => handleTokenSelect(token)}
                className={`w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors ${
                  selectedTokenAddress === token.address ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{token.symbol[0]}</span>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{token.symbol}</p>
                    <p className="text-sm text-gray-500">{token.name}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {showBalances && (
                    <span className="text-sm text-gray-500">
                      {formatBalance(token.address)}
                    </span>
                  )}
                  {selectedTokenAddress === token.address && (
                    <Check className="h-4 w-4 text-blue-500" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Click outside to close dropdowns */}
      {(showChainSelector || showTokenSelector) && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => {
            setShowChainSelector(false);
            setShowTokenSelector(false);
          }}
        />
      )}
    </div>
  );
};

export default TokenChainSelector;
