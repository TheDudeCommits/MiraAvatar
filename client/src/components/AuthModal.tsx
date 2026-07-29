import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LogIn, Wallet, Twitter } from 'lucide-react';
import { FaGoogle } from 'react-icons/fa';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { SiweMessage } from 'siwe';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any) => void;
}

declare global {
  interface Window {
    ethereum?: any;
    web3?: any;
  }
}

export function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogleLogin = () => {
    window.location.href = '/auth/google';
  };

  const handleTwitterLogin = () => {
    window.location.href = '/auth/twitter';
  };

  const handleWalletConnect = async () => {
    setIsLoading(true);
    try {
      if (typeof window.ethereum === 'undefined') {
        toast({
          title: "Wallet Not Found",
          description: "Please install MetaMask or another Web3 wallet",
          variant: "destructive",
        });
        return;
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        toast({
          title: "No Account Selected",
          description: "Please select an account in your wallet",
          variant: "destructive",
        });
        return;
      }

      const address = accounts[0];
      const nonceResponse = await apiRequest('GET', '/auth/wallet/nonce');
      const nonceBody: unknown = await nonceResponse.json();
      if (
        !nonceBody ||
        typeof nonceBody !== 'object' ||
        !('nonce' in nonceBody) ||
        typeof nonceBody.nonce !== 'string'
      ) {
        throw new Error('The server returned an invalid wallet challenge');
      }

      const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
      const chainId = Number.parseInt(String(chainIdHex), 16);
      if (!Number.isSafeInteger(chainId) || chainId <= 0) {
        throw new Error('The wallet returned an invalid chain ID');
      }

      const issuedAt = new Date();
      const expirationTime = new Date(issuedAt.getTime() + 5 * 60 * 1000);
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in to AskMira.',
        uri: window.location.origin,
        version: '1',
        chainId,
        nonce: nonceBody.nonce,
        issuedAt: issuedAt.toISOString(),
        expirationTime: expirationTime.toISOString(),
      }).prepareMessage();

      // Sign message
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, address],
      });

      // Send to backend for verification
      const response = await apiRequest('POST', '/auth/wallet', {
        message,
        signature,
      });
      const result = await response.json();

      toast({
        title: "Wallet Connected",
        description: "Successfully authenticated with your wallet",
      });

      onAuthSuccess(result.user);
      onClose();
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gray-900/95 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl titillium-web-bold text-emerald-300">
            Join AskMira
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 p-6">
          <Button
            onClick={handleGoogleLogin}
            className="w-full titillium-web-semibold bg-red-600/80 hover:bg-red-600 border border-red-500/30 text-white transition-all duration-300"
            size="lg"
          >
            <FaGoogle className="w-5 h-5 mr-3" />
            Continue with Google
          </Button>

          <Button
            onClick={handleTwitterLogin}
            className="w-full titillium-web-semibold bg-blue-600/80 hover:bg-blue-600 border border-blue-500/30 text-white transition-all duration-300"
            size="lg"
          >
            <Twitter className="w-5 h-5 mr-3" />
            Continue with Twitter
          </Button>

          <Button
            onClick={handleWalletConnect}
            disabled={isLoading}
            className="w-full titillium-web-semibold bg-purple-600/80 hover:bg-purple-600 border border-purple-500/30 text-white transition-all duration-300"
            size="lg"
          >
            <Wallet className="w-5 h-5 mr-3" />
            {isLoading ? 'Connecting...' : 'Connect Wallet'}
          </Button>

          <div className="text-center text-sm text-gray-400 mt-4">
            Choose your preferred authentication method to get started with personalized AI conversations
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
