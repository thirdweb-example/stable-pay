import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginForm from './components/auth/LoginForm';
import UsernameSetup from './components/auth/UsernameSetup';
import Layout from './components/ui/Layout';
import BalanceDisplay from './components/payments/BalanceDisplay';
import UserSearch from './components/users/UserSearch';
import SendPayment, { type PaymentData } from './components/payments/SendPayment';
import PaymentConfirm from './components/payments/PaymentConfirm';
import TransactionHistory from './components/transactions/TransactionHistory';
import { type User } from './utils/supabase';

type PaymentFlow = 'search' | 'form' | 'confirm';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [currentTab, setCurrentTab] = useState<'home' | 'send' | 'activity' | 'search' | 'profile'>('home');
  const [paymentFlow, setPaymentFlow] = useState<PaymentFlow>('search');
  const [selectedRecipient, setSelectedRecipient] = useState<User | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  if (!user?.username) {
    return <UsernameSetup />;
  }

  const handleUserSelectForPayment = (selectedUser: User) => {
    setSelectedRecipient(selectedUser);
    setPaymentFlow('form');
  };

  const handlePaymentConfirm = (data: PaymentData) => {
    setPaymentData(data);
    setPaymentFlow('confirm');
  };

  const handlePaymentSuccess = () => {
    setCurrentTab('home');
    setPaymentFlow('search');
    setSelectedRecipient(null);
    setPaymentData(null);
  };

  const handleBackToSearch = () => {
    setPaymentFlow('search');
    setSelectedRecipient(null);
    setPaymentData(null);
  };

  const handleBackToForm = () => {
    setPaymentFlow('form');
    setPaymentData(null);
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case 'home':
        return (
          <div className="p-4 space-y-6">
            <BalanceDisplay />
            <TransactionHistory />
          </div>
        );
      
      case 'send':
        if (paymentFlow === 'search') {
          return (
            <div className="p-4 space-y-6">
              <div className="venmo-card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Send Payment</h2>
                <UserSearch 
                  showPayButton={true}
                  onUserSelect={handleUserSelectForPayment}
                />
              </div>
            </div>
          );
        } else if (paymentFlow === 'form' && selectedRecipient) {
          return (
            <SendPayment
              recipient={selectedRecipient}
              onBack={handleBackToSearch}
              onPaymentConfirm={handlePaymentConfirm}
            />
          );
        } else if (paymentFlow === 'confirm' && paymentData) {
          return (
            <PaymentConfirm
              paymentData={paymentData}
              onBack={handleBackToForm}
              onSuccess={handlePaymentSuccess}
            />
          );
        }
        return null;
      
      case 'activity':
        return (
          <div className="p-4 space-y-6">
            <TransactionHistory />
          </div>
        );
      
      case 'search':
        return (
          <div className="p-4 space-y-6">
            <div className="venmo-card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Find Users</h2>
              <UserSearch 
                onUserSelect={(selectedUser) => {
                  setSelectedRecipient(selectedUser);
                  setCurrentTab('send');
                  setPaymentFlow('form');
                }}
              />
            </div>
          </div>
        );
      
      case 'profile':
        return (
          <div className="p-4 space-y-6">
            <div className="venmo-card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {user.display_name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {user.display_name || user.username}
                    </h3>
                    <p className="text-gray-500">@{user.username}</p>
                    <p className="text-sm text-gray-400">{user.email}</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Wallet Address</h4>
                  <p className="text-xs font-mono text-gray-600 break-all bg-gray-50 p-3 rounded-lg">
                    {user.wallet_address}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const handleTabChange = (tab: 'home' | 'send' | 'activity' | 'search' | 'profile') => {
    setCurrentTab(tab);
    // Reset payment flow when changing tabs
    if (tab !== 'send') {
      setPaymentFlow('search');
      setSelectedRecipient(null);
      setPaymentData(null);
    }
  };

  return (
    <Layout currentTab={currentTab} onTabChange={handleTabChange}>
      {renderTabContent()}
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
