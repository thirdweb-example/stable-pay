import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug logging
if (!supabaseUrl || supabaseUrl === 'your_supabase_url_here') {
  console.error('⚠️ Supabase URL is not set! Please add VITE_SUPABASE_URL to your .env file');
}
if (!supabaseKey || supabaseKey === 'your_supabase_anon_key_here') {
  console.error('⚠️ Supabase Anon Key is not set! Please add VITE_SUPABASE_ANON_KEY to your .env file');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export interface User {
  id: string;
  email: string;
  username: string;
  wallet_address: string;
  display_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  from_user_id: string;
  to_user_id: string;
  from_address: string;
  to_address: string;
  amount: string;
  token_contract: string;
  token_symbol: string;
  chain_id: number;
  thirdweb_transaction_id?: string;
  transaction_hash?: string;
  message?: string;
  status: 'pending' | 'confirmed' | 'failed';
  created_at: string;
  confirmed_at?: string;
  from_user?: User;
  to_user?: User;
}

// User Functions
export const createOrUpdateUser = async (
  email: string,
  walletAddress: string,
  username?: string,
  displayName?: string
): Promise<User> => {
  const userData: {
    email: string;
    wallet_address: string;
    updated_at: string;
    username?: string;
    display_name?: string;
  } = {
    email,
    wallet_address: walletAddress,
    updated_at: new Date().toISOString()
  };

  if (username) userData.username = username;
  if (displayName) userData.display_name = displayName;

  const { data, error } = await supabase
    .from('users')
    .upsert(userData, { 
      onConflict: 'wallet_address',
      ignoreDuplicates: false 
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create/update user: ${error.message}`);
  }

  return data;
};

export const getUserByWalletAddress = async (walletAddress: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('wallet_address', walletAddress)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get user: ${error.message}`);
  }

  return data;
};

export const getUserByUsername = async (username: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get user by username: ${error.message}`);
  }

  return data;
};

export const searchUsers = async (query: string): Promise<User[]> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .limit(10);

  if (error) {
    throw new Error(`Failed to search users: ${error.message}`);
  }

  return data || [];
};

export const updateUserProfile = async (
  walletAddress: string,
  updates: Partial<Pick<User, 'username' | 'display_name' | 'avatar_url'>>
): Promise<User> => {
  const { data, error } = await supabase
    .from('users')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('wallet_address', walletAddress)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update user profile: ${error.message}`);
  }

  return data;
};

// Transaction Functions
export const createTransaction = async (
  fromUserId: string,
  toUserId: string,
  fromAddress: string,
  toAddress: string,
  amount: string,
  tokenContract: string,
  tokenSymbol: string,
  chainId: number,
  message?: string,
  thirdwebTransactionId?: string
): Promise<Transaction> => {
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      from_user_id: fromUserId,
      to_user_id: toUserId,
      from_address: fromAddress,
      to_address: toAddress,
      amount,
      token_contract: tokenContract,
      token_symbol: tokenSymbol,
      chain_id: chainId,
      message,
      thirdweb_transaction_id: thirdwebTransactionId,
      status: 'pending'
    })
    .select(`
      *,
      from_user:users!from_user_id(*),
      to_user:users!to_user_id(*)
    `)
    .single();

  if (error) {
    throw new Error(`Failed to create transaction: ${error.message}`);
  }

  return data;
};

export const updateTransactionStatus = async (
  transactionId: string,
  status: 'pending' | 'confirmed' | 'failed',
  transactionHash?: string
): Promise<Transaction> => {
  const updates: {
    status: 'pending' | 'confirmed' | 'failed';
    updated_at: string;
    confirmed_at?: string;
    transaction_hash?: string;
  } = {
    status,
    updated_at: new Date().toISOString()
  };

  if (status === 'confirmed') {
    updates.confirmed_at = new Date().toISOString();
  }

  if (transactionHash) {
    updates.transaction_hash = transactionHash;
  }

  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', transactionId)
    .select(`
      *,
      from_user:users!from_user_id(*),
      to_user:users!to_user_id(*)
    `)
    .single();

  if (error) {
    throw new Error(`Failed to update transaction status: ${error.message}`);
  }

  return data;
};

export const updateThirdwebTransactionId = async (
  transactionId: string,
  thirdwebTransactionId: string
): Promise<Transaction> => {
  const { data, error } = await supabase
    .from('transactions')
    .update({
      thirdweb_transaction_id: thirdwebTransactionId,
      updated_at: new Date().toISOString()
    })
    .eq('id', transactionId)
    .select(`
      *,
      from_user:users!from_user_id(*),
      to_user:users!to_user_id(*)
    `)
    .single();

  if (error) {
    throw new Error(`Failed to update thirdweb transaction ID: ${error.message}`);
  }

  return data;
};

export const getUserTransactions = async (userId: string): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      from_user:users!from_user_id(*),
      to_user:users!to_user_id(*)
    `)
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get user transactions: ${error.message}`);
  }

  return data || [];
};

export const getRecentTransactions = async (limit = 20): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      from_user:users!from_user_id(*),
      to_user:users!to_user_id(*)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get recent transactions: ${error.message}`);
  }

  return data || [];
};

// Real-time subscriptions
export const subscribeToUserTransactions = (
  userId: string,
  callback: (transaction: Transaction) => void
) => {
  return supabase
    .channel('user-transactions')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'transactions',
        filter: `or(from_user_id.eq.${userId},to_user_id.eq.${userId})`
      },
      (payload) => {
        callback(payload.new as Transaction);
      }
    )
    .subscribe();
};
