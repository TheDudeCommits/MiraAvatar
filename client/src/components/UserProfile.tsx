import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { LogOut, Settings, User, Wallet, Plus, Link as LinkIcon } from 'lucide-react';
import { FaGoogle, FaTwitter } from 'react-icons/fa';
import { AuthModal } from './AuthModal';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface UserAccount {
  id: number;
  provider: 'google' | 'twitter' | 'wallet';
  walletAddress?: string;
  metadata?: {
    twitterHandle?: string;
    googleProfile?: any;
    walletType?: string;
  };
}

interface UserData {
  id: number;
  email?: string;
  username?: string;
  displayName?: string;
  profileImage?: string;
}

export function UserProfile() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch current user
  const { data: user, isLoading: userLoading } = useQuery<UserData>({
    queryKey: ['/auth/user'],
    retry: false,
  });

  // Fetch user accounts
  const { data: accounts = [] } = useQuery<UserAccount[]>({
    queryKey: ['/auth/accounts'],
    enabled: !!user,
    retry: false,
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('/auth/logout', 'POST');
    },
    onSuccess: () => {
      queryClient.clear();
      window.location.reload();
    },
  });

  const handleAuthSuccess = (userData: UserData) => {
    queryClient.setQueryData(['/auth/user'], userData);
    queryClient.invalidateQueries({ queryKey: ['/auth/accounts'] });
    toast({
      title: "Welcome to AskMira!",
      description: "Successfully authenticated",
    });
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return <FaGoogle className="w-4 h-4" />;
      case 'twitter':
        return <FaTwitter className="w-4 h-4" />;
      case 'wallet':
        return <Wallet className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getProviderLabel = (account: UserAccount) => {
    switch (account.provider) {
      case 'google':
        return 'Google';
      case 'twitter':
        return `Twitter${account.metadata?.twitterHandle ? ` (@${account.metadata.twitterHandle})` : ''}`;
      case 'wallet':
        return `Wallet ${account.walletAddress?.slice(0, 8)}...`;
      default:
        return account.provider;
    }
  };

  if (userLoading) {
    return (
      <div className="p-4 border-t border-gray-700">
        <div className="animate-pulse flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
          <div className="h-4 bg-gray-700 rounded w-24"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 border-t border-gray-700">
        <Button
          onClick={() => setIsAuthModalOpen(true)}
          className="w-full titillium-web-semibold bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign In
        </Button>
        
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-gray-700">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="w-full p-2 justify-start space-x-3 hover:bg-gray-800/50">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user.profileImage} />
              <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-green-600 text-white text-sm">
                {user.displayName?.charAt(0) || user.username?.charAt(0) || user.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium text-white truncate">
                {user.displayName || user.username || 'User'}
              </div>
              <div className="text-xs text-gray-400 truncate">
                {user.email || 'No email'}
              </div>
            </div>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          className="w-64 bg-gray-900/95 border-gray-700 text-white" 
          align="end"
          side="top"
        >
          <div className="px-3 py-2">
            <div className="text-sm font-medium">{user.displayName || user.username}</div>
            <div className="text-xs text-gray-400">{user.email}</div>
          </div>
          
          <DropdownMenuSeparator className="bg-gray-700" />
          
          <div className="px-3 py-2">
            <div className="text-xs font-medium text-gray-300 mb-2">Connected Accounts</div>
            {accounts.map((account) => (
              <div key={account.id} className="flex items-center space-x-2 py-1">
                {getProviderIcon(account.provider)}
                <span className="text-xs text-gray-400">{getProviderLabel(account)}</span>
              </div>
            ))}
            
            {accounts.length < 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAuthModalOpen(true)}
                className="w-full mt-2 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-gray-800/50"
              >
                <Plus className="w-3 h-3 mr-1" />
                Link Account
              </Button>
            )}
          </div>
          
          <DropdownMenuSeparator className="bg-gray-700" />
          
          <DropdownMenuItem 
            className="text-red-400 hover:text-red-300 hover:bg-red-900/20 focus:text-red-300 focus:bg-red-900/20"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}