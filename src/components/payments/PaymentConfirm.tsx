import React, { useState } from 'react';
import { ArrowLeft, Send, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { createPayment, completePayment, getTransactionStatus, isInsufficientFundsResponse } from '../../utils/thirdwebAPI';
import { createTransaction, updateTransactionStatus } from '../../utils/supabase';
import { CHAINS } from '../../utils/contracts';
import { type PaymentData } from './SendPayment';

interface PaymentConfirmProps {
  paymentData: PaymentData;
  onBack: () => void;
  onSuccess: () => void;
}

type PaymentStatus = 'confirming' | 'sending' | 'monitoring' | 'success' | 'failed';

const PaymentConfirm: React.FC<PaymentConfirmProps> = ({ paymentData, onBack, onSuccess }) => {
  const { user, token } = useAuth();
  const [status, setStatus] = useState<PaymentStatus>('confirming');
  const [error, setError] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [paymentLink, setPaymentLink] = useState<string>('');
  const [showInsufficientFunds, setShowInsufficientFunds] = useState(false);
  const [currentPaymentId, setCurrentPaymentId] = useState<string>('');

  const { recipient, token: selectedToken, amount, amountWei, message } = paymentData;
  const chainName = CHAINS.find(c => c.id === selectedToken.chainId)?.name || `Chain ${selectedToken.chainId}`;

  const executePayment = async () => {
    if (!user?.wallet_address || !token) return;

    try {
      setStatus('sending');
      setError('');

      // Create transaction record in Supabase first
      const supabaseTransaction = await createTransaction(
        user.id,
        recipient.id,
        user.wallet_address,
        recipient.wallet_address,
        amountWei,
        selectedToken.address,
        selectedToken.symbol,
        selectedToken.chainId,
        message
      );

      setTransactionId(supabaseTransaction.id);

      // Create payment via thirdweb Payment API
      const paymentName = `Payment to @${recipient.username}`;
      const paymentDescription = message || `Payment of ${amount} ${selectedToken.symbol}`;
      
      const payment = await createPayment(
        paymentName,
        paymentDescription,
        recipient.wallet_address,
        selectedToken.address,
        amountWei,
        selectedToken.chainId,
        token
      );

      // Save the payment link for potential insufficient funds case
      setPaymentLink(payment.link);
      setCurrentPaymentId(payment.id);

      // Complete the payment
      const result = await completePayment(
        payment.id,
        user.wallet_address,
        token
      );

      console.log('Complete payment result:', result);
      console.log('Result type:', typeof result);
      console.log('Has result property:', 'result' in result);
      console.log('Result result:', result.result);

      // Check if this is an insufficient funds response (402)
      if (isInsufficientFundsResponse(result)) {
        console.log('Insufficient funds detected, showing payment link');
        // Insufficient funds - show payment link (already saved from createPayment)
        setShowInsufficientFunds(true);
        setStatus('confirming');
        return;
      }

      // Normal successful payment
      if ('result' in result && 'transactionId' in result.result) {
        console.log('Payment successful, transaction ID:', result.result.transactionId);
        // Update Supabase with thirdweb transaction ID
        try {
          await updateTransactionStatus(
            supabaseTransaction.id,
            'pending',
            undefined
          );
          console.log('Supabase transaction status updated successfully');
        } catch (updateError) {
          console.error('Failed to update Supabase transaction status:', updateError);
          // Continue with the payment flow even if Supabase update fails
        }

        // Monitor transaction status
        setStatus('monitoring');
        await monitorTransaction(result.result.transactionId, supabaseTransaction.id);
      } else {
        console.log('Unexpected response format:', result);
        throw new Error('Failed to get transaction ID from thirdweb');
      }
    } catch (error: unknown) {
      console.error('Payment failed:', error);
      setError(error instanceof Error ? error.message : 'Payment failed. Please try again.');
      setStatus('failed');

      // Update transaction status in Supabase if we have a transaction ID
      if (transactionId) {
        try {
          await updateTransactionStatus(transactionId, 'failed');
        } catch (updateError) {
          console.error('Failed to update transaction status:', updateError);
        }
      }
    }
  };

  const openPaymentLink = () => {
    if (paymentLink) {
      // Open payment link in new window
      window.open(paymentLink, '_blank', 'width=800,height=600');
      
      // Set up polling to check if payment was completed
      const checkPaymentStatus = async () => {
        try {
          // Try to complete the payment again
          const result = await completePayment(
            currentPaymentId,
            user!.wallet_address,
            token!
          );
          
          if ('result' in result && 'transactionId' in result.result) {
            // Payment completed successfully
            setShowInsufficientFunds(false);
            setPaymentLink('');
            
            // Update Supabase and monitor transaction
            if (transactionId) {
              await updateTransactionStatus(transactionId, 'pending', undefined);
              setStatus('monitoring');
              await monitorTransaction(result.result.transactionId, transactionId);
            }
          }
        } catch (error) {
          console.error('Payment still not completed:', error);
          // Continue polling
          setTimeout(checkPaymentStatus, 5000); // Check every 5 seconds
        }
      };
      
      // Start checking after a delay to allow user to complete payment
      setTimeout(checkPaymentStatus, 10000); // Start checking after 10 seconds
    }
  };

  const monitorTransaction = async (thirdwebTransactionId: string, supabaseTransactionId: string) => {
    const maxAttempts = 30; // Monitor for up to 5 minutes (10 second intervals)
    let attempts = 0;

    const checkStatus = async (): Promise<void> => {
      try {
        const statusResult = await getTransactionStatus(thirdwebTransactionId);
        
        if (statusResult.result?.status === 'mined' || statusResult.result?.status === 'confirmed') {
          // Transaction successful
          setTransactionHash(statusResult.result.transactionHash || '');
          await updateTransactionStatus(
            supabaseTransactionId,
            'confirmed',
            statusResult.result.transactionHash
          );
          setStatus('success');
          return;
        } else if (statusResult.result?.status === 'failed') {
          // Transaction failed
          await updateTransactionStatus(supabaseTransactionId, 'failed');
          setError('Transaction failed on the blockchain');
          setStatus('failed');
          return;
        }

        // Still pending, check again
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 10000); // Check every 10 seconds
        } else {
          // Timeout - transaction might still be pending
          setError('Transaction is taking longer than expected. Check your wallet for updates.');
          setStatus('failed');
        }
      } catch (error) {
        console.error('Failed to check transaction status:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 10000);
        } else {
          setError('Failed to monitor transaction status');
          setStatus('failed');
        }
      }
    };

    checkStatus();
  };

  const getStatusIcon = () => {
    if (showInsufficientFunds) {
      return <AlertCircle className="h-8 w-8 text-blue-500" />;
    }
    
    switch (status) {
      case 'confirming':
        return <Send className="h-8 w-8 text-blue-500" />;
      case 'sending':
      case 'monitoring':
        return <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-8 w-8 text-red-500" />;
    }
  };

  const getStatusMessage = () => {
    if (showInsufficientFunds) {
      return 'Add funds to complete payment';
    }
    
    switch (status) {
      case 'confirming':
        return 'Review your payment details';
      case 'sending':
        return 'Sending your payment...';
      case 'monitoring':
        return 'Confirming on blockchain...';
      case 'success':
        return 'Payment sent successfully!';
      case 'failed':
        return 'Payment failed';
    }
  };

  const getExplorerUrl = () => {
    if (!transactionHash) return '';
    
    const baseUrls: Record<number, string> = {
      1: 'https://etherscan.io/tx/',
      137: 'https://polygonscan.com/tx/',
      8453: 'https://basescan.org/tx/',
    };

    return baseUrls[selectedToken.chainId] + transactionHash;
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        {(status === 'confirming' || showInsufficientFunds) && (
          <button
            onClick={() => {
              if (showInsufficientFunds) {
                setShowInsufficientFunds(false);
                setPaymentLink('');
                setCurrentPaymentId('');
              }
              onBack();
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
        )}
        <h1 className="text-xl font-semibold text-gray-900">
          {status === 'confirming' ? 'Confirm Payment' : 'Payment Status'}
        </h1>
      </div>

      {/* Status Card */}
      <div className="venmo-card text-center">
        <div className="flex flex-col items-center space-y-4">
          {getStatusIcon()}
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{getStatusMessage()}</h2>
            {status === 'monitoring' && (
              <p className="text-sm text-gray-500 mt-1">
                This may take a few minutes
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div className="venmo-card space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Payment Details</h3>
        
        <div className="space-y-3">
          {/* To */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600">To</span>
            <div className="text-right">
              <p className="font-medium text-gray-900">
                {recipient.display_name || recipient.username}
              </p>
              <p className="text-sm text-gray-500">@{recipient.username}</p>
            </div>
          </div>

          {/* Amount */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Amount</span>
            <div className="text-right">
              <p className="font-medium text-gray-900">
                {amount} {selectedToken.symbol}
              </p>
              <p className="text-sm text-gray-500">{chainName}</p>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className="flex justify-between items-start">
              <span className="text-gray-600">Message</span>
              <p className="font-medium text-gray-900 text-right max-w-48">
                "{message}"
              </p>
            </div>
          )}

          {/* Network Fee Info */}
          <div className="pt-3 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Network</span>
              <p className="text-sm text-gray-500">{chainName}</p>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Network fees are covered by the smart wallet
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-600 text-sm font-medium">Payment Failed</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Insufficient Funds Message */}
      {showInsufficientFunds && paymentLink && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-blue-600 text-sm font-medium">Insufficient Funds</p>
              <p className="text-blue-600 text-sm mt-1">
                You need to add funds to complete this payment. Click the button below to open the payment page.
              </p>
              <button
                onClick={openPaymentLink}
                className="inline-flex items-center text-blue-600 text-sm mt-2 hover:underline font-medium"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Open Payment Page
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Hash */}
      {transactionHash && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-green-600 text-sm font-medium">Transaction Confirmed</p>
              <p className="text-green-600 text-xs mt-1 font-mono break-all">
                {transactionHash}
              </p>
              <a
                href={getExplorerUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-green-600 text-sm mt-2 hover:underline"
              >
                View on Explorer
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {status === 'confirming' && !showInsufficientFunds && (
          <button
            onClick={executePayment}
            className="venmo-button w-full flex items-center justify-center"
          >
            <Send className="h-4 w-4 mr-2" />
            Send Payment
          </button>
        )}

        {status === 'confirming' && showInsufficientFunds && (
          <div className="space-y-3">
            <button
              onClick={openPaymentLink}
              className="venmo-button w-full flex items-center justify-center"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Payment Page
            </button>
            <button
              onClick={() => {
                setShowInsufficientFunds(false);
                setPaymentLink('');
                setCurrentPaymentId('');
              }}
              className="w-full py-3 px-4 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-3">
            <button
              onClick={onSuccess}
              className="venmo-button w-full"
            >
              Done
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-4 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Send Another Payment
            </button>
          </div>
        )}

        {status === 'failed' && (
          <div className="space-y-3">
            <button
              onClick={() => {
                setStatus('confirming');
                setError('');
                setTransactionHash('');
                setTransactionId('');
              }}
              className="venmo-button w-full"
            >
              Try Again
            </button>
            <button
              onClick={() => {
                setShowInsufficientFunds(false);
                setPaymentLink('');
                setCurrentPaymentId('');
                onBack();
              }}
              className="w-full py-3 px-4 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Back to Payment
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentConfirm;
