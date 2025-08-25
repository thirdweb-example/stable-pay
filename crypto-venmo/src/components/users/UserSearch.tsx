import React, { useState, useEffect } from 'react';
import { Search, User, Send } from 'lucide-react';
import { searchUsers, type User as UserType } from '../../utils/supabase';

interface UserSearchProps {
  onUserSelect?: (user: UserType) => void;
  showPayButton?: boolean;
}

const UserSearch: React.FC<UserSearchProps> = ({ onUserSelect, showPayButton = false }) => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const searchUsersDebounced = async () => {
      if (!query.trim()) {
        setUsers([]);
        return;
      }

      if (query.length < 2) {
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const results = await searchUsers(query.trim());
        setUsers(results);
      } catch (error) {
        console.error('Search error:', error);
        setError('Failed to search users');
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(searchUsersDebounced, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleUserSelect = (user: UserType) => {
    if (onUserSelect) {
      onUserSelect(user);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by username or name..."
          className="venmo-input pl-10"
        />
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Search Results */}
      {query.length >= 2 && (
        <div className="space-y-2">
          {users.length > 0 ? (
            <>
              <p className="text-sm text-gray-600 font-medium">
                {users.length} user{users.length !== 1 ? 's' : ''} found
              </p>
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleUserSelect(user)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="venmo-avatar">
                        {user.display_name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.display_name || user.username}
                        </p>
                        <p className="text-sm text-gray-500">@{user.username}</p>
                      </div>
                    </div>
                    
                    {showPayButton && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUserSelect(user);
                        }}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <Send className="h-4 w-4" />
                        <span className="text-sm font-medium">Pay</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : !isLoading && query.length >= 2 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No users found</p>
              <p className="text-sm text-gray-400 mt-1">
                Try searching for a different username or name
              </p>
            </div>
          ) : null}
        </div>
      )}

      {/* Help Text */}
      {query.length === 0 && (
        <div className="text-center py-8">
          <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Search for users to pay</p>
          <p className="text-sm text-gray-400 mt-1">
            Enter at least 2 characters to start searching
          </p>
        </div>
      )}

      {query.length === 1 && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-400">
            Keep typing to search for users...
          </p>
        </div>
      )}
    </div>
  );
};

export default UserSearch;
