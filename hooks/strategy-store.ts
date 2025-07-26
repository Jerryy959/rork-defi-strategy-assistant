import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import { StrategyResult, StrategyPerformance, TradeHistory, UserProfile } from '@/types/strategy';
import { parseStrategyInput } from '@/utils/strategyParser';
import { blockchainService } from '@/services/blockchain';

export const [StrategyContext, useStrategy] = createContextHook(() => {
  const [currentInput, setCurrentInput] = useState<string>('');
  const [currentStrategy, setCurrentStrategy] = useState<StrategyResult | null>(null);
  const [savedStrategies, setSavedStrategies] = useState<StrategyResult[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Load saved strategies from storage
  const savedStrategiesQuery = useQuery({
    queryKey: ['savedStrategies'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem('savedStrategies');
        return stored ? JSON.parse(stored) as StrategyResult[] : [];
      } catch (error) {
        console.error('Error loading saved strategies:', error);
        return [];
      }
    }
  });

  // Save strategies to storage
  const saveStrategiesMutation = useMutation({
    mutationFn: async (strategies: StrategyResult[]) => {
      try {
        await AsyncStorage.setItem('savedStrategies', JSON.stringify(strategies));
        return strategies;
      } catch (error) {
        console.error('Error saving strategies:', error);
        throw error;
      }
    }
  });

  // Update saved strategies when query data changes
  useEffect(() => {
    if (savedStrategiesQuery.data) {
      setSavedStrategies(savedStrategiesQuery.data);
    }
  }, [savedStrategiesQuery.data]);

  // Process natural language input
  const processInput = (input: string) => {
    setIsProcessing(true);
    setCurrentInput(input);
    
    try {
      const result = parseStrategyInput(input);
      setCurrentStrategy(result);
    } catch (error) {
      console.error('Error processing strategy input:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Save current strategy
  const saveCurrentStrategy = () => {
    if (currentStrategy) {
      const strategyToSave: StrategyResult = {
        ...currentStrategy,
        id: `strategy-${Date.now()}`,
        status: 'draft',
        creator: walletAddress || undefined
      };
      const updated = [...savedStrategies, strategyToSave];
      setSavedStrategies(updated);
      saveStrategiesMutation.mutate(updated);
      return strategyToSave;
    }
    return null;
  };

  // Delete a strategy
  const deleteStrategy = (index: number) => {
    const updated = savedStrategies.filter((_, i) => i !== index);
    setSavedStrategies(updated);
    saveStrategiesMutation.mutate(updated);
  };

  // Publish strategy to marketplace
  const publishStrategy = async (strategyId: string) => {
    try {
      const strategyIndex = savedStrategies.findIndex(s => s.id === strategyId);
      if (strategyIndex === -1) {
        return { success: false, error: 'Strategy not found' };
      }

      const strategy = savedStrategies[strategyIndex];
      const updatedStrategy: StrategyResult = {
        ...strategy,
        isPublished: true,
        publishedAt: new Date(),
        subscribers: 0,
        creator: walletAddress || 'Unknown'
      };

      const updated = [...savedStrategies];
      updated[strategyIndex] = updatedStrategy;
      setSavedStrategies(updated);
      saveStrategiesMutation.mutate(updated);

      // Also save to published strategies list
      await savePublishedStrategy(updatedStrategy);

      return { success: true };
    } catch (error) {
      console.error('Failed to publish strategy:', error);
      return { success: false, error: 'Failed to publish strategy' };
    }
  };

  // Save published strategy to marketplace
  const savePublishedStrategy = async (strategy: StrategyResult) => {
    try {
      const stored = await AsyncStorage.getItem('publishedStrategies');
      const publishedStrategies = stored ? JSON.parse(stored) : [];
      publishedStrategies.push(strategy);
      await AsyncStorage.setItem('publishedStrategies', JSON.stringify(publishedStrategies));
    } catch (error) {
      console.error('Error saving published strategy:', error);
    }
  };

  // Wallet connection state
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Connect wallet
  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      const connected = await blockchainService.connectWallet();
      if (connected) {
        setIsWalletConnected(true);
        const address = await blockchainService.getWalletAddress();
        setWalletAddress(address);
        
        // Load or create user profile
        if (address) {
          await loadUserProfile(address);
        }
      }
      return connected;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  // Deploy a strategy to blockchain or save as draft
  const deployStrategy = async (strategy: StrategyResult) => {
    try {
      const result = await blockchainService.deployStrategy(strategy);
      
      if (result.success && result.txHash) {
        // Determine final status based on strategy type
        const finalStatus = strategy.status === 'draft' ? 'draft' : 'active';
        
        // Update strategy with deployment info
        const deployedStrategy: StrategyResult = {
          ...strategy,
          id: result.txHash,
          status: finalStatus,
          deployedAt: finalStatus === 'active' ? new Date() : undefined,
          txHash: result.txHash,
          performance: finalStatus === 'active' ? {
            roi: 0,
            tradeCount: 0,
            totalVolume: 0,
            winRate: 0,
            currentValue: strategy.parameters.total_investment,
            pnl: 0,
            lastUpdated: new Date()
          } : undefined
        };
        
        // Save to strategies list
        const updated = [...savedStrategies, deployedStrategy];
        setSavedStrategies(updated);
        saveStrategiesMutation.mutate(updated);
        
        // Update user profile stats
        if (userProfile) {
          await updateUserProfile({
            totalStrategies: userProfile.totalStrategies + 1,
            activeStrategies: finalStatus === 'active' ? userProfile.activeStrategies + 1 : userProfile.activeStrategies
          });
        }
        
        return { success: true, txHash: result.txHash };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Failed to deploy strategy:', error);
      return { success: false, error: 'Deployment failed' };
    }
  };

  // Stop a strategy
  const stopStrategy = async (strategyId: string) => {
    try {
      const result = await blockchainService.stopStrategy(strategyId);
      
      if (result.success) {
        // Update strategy status
        const updated = savedStrategies.map(strategy => 
          strategy.id === strategyId 
            ? { ...strategy, status: 'stopped' as const }
            : strategy
        );
        setSavedStrategies(updated);
        saveStrategiesMutation.mutate(updated);
        
        return { success: true, txHash: result.txHash };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Failed to stop strategy:', error);
      return { success: false, error: 'Failed to stop strategy' };
    }
  };

  // Generate mock performance data for active strategies
  const updateStrategyPerformance = (strategyId: string) => {
    const updated = savedStrategies.map(strategy => {
      if (strategy.id === strategyId && strategy.status === 'active' && strategy.performance) {
        const mockRoi = (Math.random() - 0.5) * 20; // -10% to +10%
        const mockTradeCount = strategy.performance.tradeCount + Math.floor(Math.random() * 3);
        const mockPnl = (strategy.parameters.total_investment * mockRoi) / 100;
        
        return {
          ...strategy,
          performance: {
            ...strategy.performance,
            roi: mockRoi,
            tradeCount: mockTradeCount,
            pnl: mockPnl,
            currentValue: strategy.parameters.total_investment + mockPnl,
            winRate: Math.random() * 100,
            totalVolume: strategy.performance.totalVolume + Math.random() * 10000,
            lastUpdated: new Date()
          }
        };
      }
      return strategy;
    });
    
    setSavedStrategies(updated);
    saveStrategiesMutation.mutate(updated);
  };

  // Load user profile
  const loadUserProfile = async (address: string) => {
    try {
      const profileKey = `userProfile_${address}`;
      const stored = await AsyncStorage.getItem(profileKey);
      
      if (stored) {
        const profile = JSON.parse(stored) as UserProfile;
        profile.lastActive = new Date();
        setUserProfile(profile);
        await AsyncStorage.setItem(profileKey, JSON.stringify(profile));
      } else {
        // Create new profile
        const newProfile: UserProfile = {
          walletAddress: address,
          totalStrategies: 0,
          activeStrategies: 0,
          totalReturns: 0,
          totalVolume: 0,
          joinedAt: new Date(),
          lastActive: new Date()
        };
        setUserProfile(newProfile);
        await AsyncStorage.setItem(profileKey, JSON.stringify(newProfile));
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  // Update user profile stats
  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!userProfile || !walletAddress) return;
    
    const updatedProfile = {
      ...userProfile,
      ...updates,
      lastActive: new Date()
    };
    
    setUserProfile(updatedProfile);
    
    try {
      const profileKey = `userProfile_${walletAddress}`;
      await AsyncStorage.setItem(profileKey, JSON.stringify(updatedProfile));
    } catch (error) {
      console.error('Error updating user profile:', error);
    }
  };

  // Disconnect wallet
  const disconnectWallet = async () => {
    setIsWalletConnected(false);
    setWalletAddress(null);
    setUserProfile(null);
  };

  // Check wallet connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (blockchainService.isConnected()) {
        setIsWalletConnected(true);
        const address = await blockchainService.getWalletAddress();
        setWalletAddress(address);
        if (address) {
          await loadUserProfile(address);
        }
      }
    };
    checkConnection();
  }, []);

  return {
    currentInput,
    currentStrategy,
    savedStrategies,
    isProcessing,
    isLoading: savedStrategiesQuery.isLoading,
    isWalletConnected,
    walletAddress,
    isConnecting,
    userProfile,
    processInput,
    saveCurrentStrategy,
    deleteStrategy,
    deployStrategy,
    stopStrategy,
    publishStrategy,
    connectWallet,
    disconnectWallet,
    updateUserProfile,
    updateStrategyPerformance
  };
});