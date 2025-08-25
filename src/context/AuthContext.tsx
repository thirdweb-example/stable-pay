import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type User, getUserByWalletAddress, createOrUpdateUser } from '../utils/supabase';
import { sendLoginCode, verifyLoginCode } from '../utils/thirdwebAPI';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  walletAddress: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, code: string) => Promise<void>;
  sendCode: (email: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    token: null,
    walletAddress: null,
  });

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('thirdweb_token');
        const storedWalletAddress = localStorage.getItem('wallet_address');

        if (storedToken && storedWalletAddress) {
          // Try to get user from Supabase
          const user = await getUserByWalletAddress(storedWalletAddress);
          
          if (user) {
            setAuthState({
              isAuthenticated: true,
              isLoading: false,
              user,
              token: storedToken,
              walletAddress: storedWalletAddress,
            });
          } else {
            // Token exists but user not found, clear storage
            localStorage.removeItem('thirdweb_token');
            localStorage.removeItem('wallet_address');
            setAuthState(prev => ({ ...prev, isLoading: false }));
          }
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        localStorage.removeItem('thirdweb_token');
        localStorage.removeItem('wallet_address');
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initializeAuth();
  }, []);

  const sendCode = async (email: string) => {
    try {
      await sendLoginCode(email);
    } catch (error) {
      console.error('Failed to send login code:', error);
      throw error;
    }
  };

  const login = async (email: string, code: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      // Verify code with thirdweb
      const authResult = await verifyLoginCode(email, code);
      const { token, walletAddress, isNewUser } = authResult;

      // Store token and wallet address
      localStorage.setItem('thirdweb_token', token);
      localStorage.setItem('wallet_address', walletAddress);

      // Create or get user from Supabase
      let user: User;
      if (isNewUser) {
        user = await createOrUpdateUser(email, walletAddress);
      } else {
        const existingUser = await getUserByWalletAddress(walletAddress);
        if (existingUser) {
          user = existingUser;
        } else {
          // User exists in thirdweb but not in our database
          user = await createOrUpdateUser(email, walletAddress);
        }
      }

      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        user,
        token,
        walletAddress,
      });
    } catch (error) {
      console.error('Login failed:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('thirdweb_token');
    localStorage.removeItem('wallet_address');
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      token: null,
      walletAddress: null,
    });
  };

  const updateUser = (updates: Partial<User>) => {
    setAuthState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...updates } : null,
    }));
  };

  const refreshUser = async () => {
    if (!authState.walletAddress) return;

    try {
      const user = await getUserByWalletAddress(authState.walletAddress);
      if (user) {
        setAuthState(prev => ({ ...prev, user }));
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    sendCode,
    logout,
    updateUser,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
