import React, { useState } from 'react';
import { User, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { updateUserProfile, getUserByUsername } from '../../utils/supabase';

const UsernameSetup: React.FC = () => {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  const { user, walletAddress, updateUser, refreshUser } = useAuth();

  const checkUsernameAvailability = async (usernameToCheck: string) => {
    if (!usernameToCheck || usernameToCheck.length < 3) {
      setIsAvailable(null);
      return;
    }

    setIsChecking(true);
    try {
      const existingUser = await getUserByUsername(usernameToCheck);
      setIsAvailable(!existingUser);
    } catch (error) {
      console.error('Error checking username:', error);
      setIsAvailable(null);
    } finally {
      setIsChecking(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    // Only allow alphanumeric characters and underscores
    const sanitized = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(sanitized);
    
    // Debounce username check
    if (sanitized !== username) {
      setIsAvailable(null);
      const timeoutId = setTimeout(() => {
        checkUsernameAvailability(sanitized);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !walletAddress || isLoading) return;

    setIsLoading(true);
    setError('');

    try {
      const updatedUser = await updateUserProfile(walletAddress, {
        username,
        display_name: displayName || username,
      });

      updateUser(updatedUser);
      await refreshUser();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('duplicate key value')) {
        setError('This username is already taken. Please choose another.');
      } else {
        setError('Failed to set username. Please try again.');
      }
      console.error('Username setup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = username.length >= 3 && isAvailable === true;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <User className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose your username</h1>
          <p className="text-gray-600">This is how friends will find and pay you</p>
        </div>

        {/* Setup Form */}
        <div className="venmo-card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Username *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400 font-medium">@</span>
                  </div>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder="yourusername"
                    className={`venmo-input pl-8 pr-10 ${
                      username.length >= 3
                        ? isAvailable === true
                          ? 'border-green-300 focus:ring-green-500'
                          : isAvailable === false
                          ? 'border-red-300 focus:ring-red-500'
                          : ''
                        : ''
                    }`}
                    maxLength={20}
                    required
                    disabled={isLoading}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {isChecking ? (
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                    ) : username.length >= 3 ? (
                      isAvailable === true ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : isAvailable === false ? (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      ) : null
                    ) : null}
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-500">
                    3-20 characters, letters, numbers, and underscores only
                  </p>
                  {username.length >= 3 && isAvailable === false && (
                    <p className="text-xs text-red-600">
                      This username is already taken
                    </p>
                  )}
                  {username.length >= 3 && isAvailable === true && (
                    <p className="text-xs text-green-600">
                      Username is available!
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                  Display name (optional)
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your full name"
                  className="venmo-input"
                  maxLength={50}
                  disabled={isLoading}
                />
                <p className="mt-1 text-xs text-gray-500">
                  How your name appears to other users
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={!isFormValid || isLoading}
                className="venmo-button w-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Complete setup'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Your wallet address
              </h3>
              <p className="mt-1 text-sm text-blue-700">
                {user?.wallet_address && (
                  <span className="font-mono text-xs break-all">
                    {user.wallet_address}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsernameSetup;
