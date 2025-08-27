const THIRDWEB_API_BASE = 'https://api.thirdweb.com/v1';
const CLIENT_ID = import.meta.env.VITE_THIRDWEB_CLIENT_ID;

// Debug logging
if (!CLIENT_ID || CLIENT_ID === 'your_thirdweb_client_id_here') {
  console.error('⚠️ thirdweb Client ID is not set! Please add VITE_THIRDWEB_CLIENT_ID to your .env file');
  console.log('Current CLIENT_ID:', CLIENT_ID);
}

export interface AuthResponse {
  token: string;
  walletAddress: string;
  isNewUser: boolean;
}

export interface BalanceResponse {
  result: {
    value: string;
    decimals: number;
    symbol: string;
    name: string;
  };
}

export interface CreatePaymentResponse {
  result: {
    id: string;
    link: string;
  };
}

export interface CompletePaymentResponse {
  result: {
    transactionId: string;
    status: string;
  };
}

export interface InsufficientFundsResponse {
  result: {
    link: string;
    rawQuote: unknown;
  };
}

// Payment status response from GET /payments/{id}
export interface PaymentStatusResponse {
  data: Array<{
    id: string;
    blockNumber: string;
    transactionId: string;
    clientId: string;
    sender: string;
    receiver: string;
    developerFeeRecipient: string;
    developerFeeBps: number;
    transactions: Array<{
      chainId: number;
      transactionHash: string;
    }>;
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    type: string;
    originAmount: string;
    destinationAmount: string;
    paymentLinkId: string;
    purchaseData: unknown;
    originToken: {
      chainId: number;
      address: string;
      symbol: string;
      name: string;
      decimals: number;
      iconUri: string;
    };
    destinationToken: {
      chainId: number;
      address: string;
      symbol: string;
      name: string;
      decimals: number;
      iconUri: string;
    };
    createdAt: string;
  }>;
  meta: {
    totalCount: number;
  };
}

// Type guard function to check if response is insufficient funds
export const isInsufficientFundsResponse = (response: TransactionResponse | InsufficientFundsResponse): response is InsufficientFundsResponse => {
  return 'result' in response && 'link' in response.result && !('transactionId' in response.result);
}

export interface TransactionResponse {
  result: {
    transactionId: string;
    status: string;
  };
}

interface SendTokensBody {
  chainId: number;
  from: string;
  recipients: Array<{
    address: string;
    quantity: string;
  }>;
  tokenAddress?: string;
}

interface TransactionStatusResponse {
  result: {
    status: string;
    transactionHash?: string;
    blockNumber?: number;
  };
}

// Status mapping from thirdweb API to our internal statuses
export const mapThirdwebStatusToInternal = (thirdwebStatus: string | null): 'pending' | 'confirmed' | 'failed' => {
  if (!thirdwebStatus) return 'pending';
  
  switch (thirdwebStatus.toUpperCase()) {
    case 'QUEUED':
    case 'SUBMITTED':
      return 'pending';
    case 'CONFIRMED':
      return 'confirmed';
    case 'FAILED':
      return 'failed';
    default:
      return 'pending';
  }
};

// Authentication Functions
export const sendLoginCode = async (email: string) => {
  const response = await fetch(`${THIRDWEB_API_BASE}/auth/initiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': CLIENT_ID
    },
    body: JSON.stringify({
      method: 'email',
      email: email
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Send code error response:', errorText);
    throw new Error(`Failed to send login code: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

export const verifyLoginCode = async (email: string, code: string): Promise<AuthResponse> => {
  const response = await fetch(`${THIRDWEB_API_BASE}/auth/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': CLIENT_ID
    },
    body: JSON.stringify({
      method: 'email',
      email: email,
      code: code
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Verify code error response:', errorText);
    throw new Error(`Failed to verify login code: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // According to the API docs, response includes: token, walletAddress, isNewUser
  return {
    token: data.token,
    walletAddress: data.walletAddress,
    isNewUser: data.isNewUser
  };
};

// Balance Functions
export const getWalletBalance = async (address: string, chainId: number, tokenAddress?: string): Promise<BalanceResponse> => {
  const url = new URL(`${THIRDWEB_API_BASE}/wallets/${address}/balance`);
  url.searchParams.append('chainId', chainId.toString());
  
  // If tokenAddress is provided, add it as a query parameter
  // If not provided, it will fetch native token balance
  if (tokenAddress && tokenAddress !== '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
    url.searchParams.append('tokenAddress', tokenAddress);
  }
  
  console.log('Fetching balance for:', { address, chainId, tokenAddress, url: url.toString() });
  
  const response = await fetch(url.toString(), {
    headers: {
      'x-client-id': CLIENT_ID
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Balance error response:', errorText);
    throw new Error(`Failed to get wallet balance: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log('Balance response:', data);
  
  return data;
};

// Get native token balance (ETH, MATIC, etc.)
export const getNativeTokenBalance = async (address: string, chainId: number): Promise<BalanceResponse> => {
  const url = new URL(`${THIRDWEB_API_BASE}/wallets/${address}/balance`);
  url.searchParams.append('chainId', chainId.toString());
  // Don't add tokenAddress for native token balance
  
  console.log('Fetching native token balance for:', { address, chainId, url: url.toString() });
  
  const response = await fetch(url.toString(), {
    headers: {
      'x-client-id': CLIENT_ID
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Native balance error response:', errorText);
    throw new Error(`Failed to get native token balance: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log('Native balance response:', data);
  
  return data;
};

// Payment Functions
export const createPayment = async (
  name: string,
  description: string,
  recipient: string,
  tokenAddress: string,
  amount: string,
  chainId: number,
  userToken: string
): Promise<{id: string; link: string}> => {
  console.log('Creating payment for:', {
    name,
    description,
    recipient,
    tokenAddress,
    amount,
    chainId
  });
  const response = await fetch(`${THIRDWEB_API_BASE}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': CLIENT_ID,
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({
      name,
      description,
      recipient,
      token: {
        address: tokenAddress,
        chainId,
        amount
      }
    })
  });

  console.log('create payment response:', response);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Create payment error response:', errorText);
    throw new Error(`Failed to create payment: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log('create payment data:', data);
  
  // Extract the result from the API response structure
  if (data.result && data.result.id) {
    return {
      id: data.result.id,
      link: data.result.link
    };
  }
  
  throw new Error('Invalid payment response format from thirdweb API');
};

export const completePayment = async (
  paymentId: string,
  fromAddress: string,
  userToken: string
): Promise<TransactionResponse | InsufficientFundsResponse> => {
  console.log('Completing payment for:', {
    paymentId,
    fromAddress
  });
  const response = await fetch(`${THIRDWEB_API_BASE}/payments/${paymentId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': CLIENT_ID,
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({
      from: fromAddress
    })
  });

  console.log('Complete payment response:', response.status);
  
  if (response.status === 402) {
    // Insufficient funds - return the payment link for user to add funds
    const data = await response.json();
    console.log('Insufficient funds, payment link available:', data);
    console.log('Response status:', response.status);
    console.log('Response data:', data);
    return data as InsufficientFundsResponse;
  }
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Complete payment error response:', errorText);
    throw new Error(`Failed to complete payment: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Get payment status without completing it
export const getPaymentStatus = async (
  paymentId: string,
  userToken: string
): Promise<PaymentStatusResponse> => {
  console.log('Getting payment status for:', paymentId);
  
  const response = await fetch(`${THIRDWEB_API_BASE}/payments/${paymentId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': CLIENT_ID,
      'Authorization': `Bearer ${userToken}`
    }
  });

  console.log('Get payment status response:', response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Get payment status error response:', errorText);
    throw new Error(`Failed to get payment status: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Legacy direct token transfer (keeping as fallback)
export const sendTokens = async (
  fromAddress: string,
  toAddress: string,
  amount: string,
  chainId: number,
  userToken: string,
  tokenAddress?: string
): Promise<TransactionResponse> => {
  const recipients = [{
    address: toAddress,
    quantity: amount
  }];

  const body: SendTokensBody = {
    chainId,
    from: fromAddress,
    recipients
  };

  if (tokenAddress) {
    body.tokenAddress = tokenAddress;
  }

  const response = await fetch(`${THIRDWEB_API_BASE}/wallets/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': CLIENT_ID,
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify(body)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Send tokens error response:', errorText);
    throw new Error(`Failed to send tokens: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

export const getTransactionStatus = async (transactionId: string): Promise<TransactionStatusResponse> => {
  const response = await fetch(`${THIRDWEB_API_BASE}/transactions/${transactionId}`, {
    headers: {
      'x-client-id': CLIENT_ID
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Transaction status error response:', errorText);
    throw new Error(`Failed to get transaction status: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Refresh transaction statuses for pending transactions only
// Note: confirmed and failed are final statuses that don't need refreshing
export const refreshPendingTransactionStatuses = async (
  pendingTransactions: Array<{ id: string; thirdweb_transaction_id?: string }>,
  updateCallback: (transactionId: string, status: 'pending' | 'confirmed' | 'failed', transactionHash?: string) => Promise<void>
): Promise<void> => {
  const refreshPromises = pendingTransactions
    .filter(tx => tx.thirdweb_transaction_id) // Only refresh transactions with thirdweb IDs
    .map(async (tx) => {
      try {
        const statusResult = await getTransactionStatus(tx.thirdweb_transaction_id!);
        const internalStatus = mapThirdwebStatusToInternal(statusResult.result?.status);
        const transactionHash = statusResult.result?.transactionHash;
        
        // Only update if status has changed from pending to a final status
        if (internalStatus !== 'pending') {
          await updateCallback(tx.id, internalStatus, transactionHash);
        }
      } catch (error) {
        console.error(`Failed to refresh status for transaction ${tx.id}:`, error);
        // Continue with other transactions even if one fails
      }
    });

  await Promise.allSettled(refreshPromises);
};

export const getWalletTransactions = async (address: string, chainId: number, limit = 20) => {
  const url = new URL(`${THIRDWEB_API_BASE}/wallets/${address}/transactions`);
  url.searchParams.append('chainId', chainId.toString());
  url.searchParams.append('limit', limit.toString());
  
  const response = await fetch(url.toString(), {
    headers: {
      'x-client-id': CLIENT_ID
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Wallet transactions error response:', errorText);
    throw new Error(`Failed to get wallet transactions: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};
