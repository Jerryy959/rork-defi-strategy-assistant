import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { TrendingUp, Users, Star, Copy, Calendar } from 'lucide-react-native';
import { useStrategy } from '@/hooks/strategy-store';
import { StrategyResult } from '@/types/strategy';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MarketplaceStrategy extends StrategyResult {
  creator: string;
  subscribers: number;
  rating: number;
  lastExecuted: Date;
  isPublic: boolean;
}

const TRENDING_STRATEGIES: MarketplaceStrategy[] = [
  {
    id: 'mp-1',
    creator: '0x742d...35Bd',
    subscribers: 1247,
    rating: 4.8,
    lastExecuted: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isPublic: true,
    parameters: {
      strategy_name: 'High-Frequency Grid',
      strategy_type: 'grid',
      pair: 'INJ/USDT',
      lower_bound: 18,
      upper_bound: 28,
      grid_count: 20,
      total_investment: 5000,
      amount_per_order: 250,
      token_invested: 'USDT',
      duration_days: 30,
      risk_level: 'medium',
      deploy_to_chain: true
    },
    summary: 'A high-frequency grid trading strategy optimized for INJ/USDT with 20 grids between $18-$28. Proven track record with 89% win rate.',
    uiLayout: {
      page_title: 'High-Frequency Grid Strategy',
      sections: [],
      actions: []
    },
    contractCall: {
      contract_name: 'StrategyExecutor',
      method: 'deployStrategy',
      params: {}
    },
    deploymentWarning: 'Strategy will execute automatically',
    followUpSuggestions: [],
    status: 'active',
    performance: {
      roi: 23.4,
      tradeCount: 156,
      totalVolume: 45230,
      winRate: 89.1,
      currentValue: 6170,
      pnl: 1170,
      lastUpdated: new Date()
    }
  },
  {
    id: 'mp-2',
    creator: '0x8f3a...92Cc',
    subscribers: 892,
    rating: 4.6,
    lastExecuted: new Date(Date.now() - 5 * 60 * 60 * 1000),
    isPublic: true,
    parameters: {
      strategy_name: 'Conservative DCA',
      strategy_type: 'dca',
      pair: 'INJ/USDT',
      total_investment: 2000,
      amount_per_order: 100,
      token_invested: 'USDT',
      duration_days: 90,
      risk_level: 'low',
      deploy_to_chain: true
    },
    summary: 'Dollar-cost averaging strategy that buys INJ every 3 days regardless of price. Perfect for long-term accumulation.',
    uiLayout: {
      page_title: 'Conservative DCA Strategy',
      sections: [],
      actions: []
    },
    contractCall: {
      contract_name: 'StrategyExecutor',
      method: 'deployStrategy',
      params: {}
    },
    deploymentWarning: 'Strategy will execute automatically',
    followUpSuggestions: [],
    status: 'active',
    performance: {
      roi: 12.8,
      tradeCount: 28,
      totalVolume: 2800,
      winRate: 100,
      currentValue: 2256,
      pnl: 256,
      lastUpdated: new Date()
    }
  },
  {
    id: 'mp-3',
    creator: '0x1b7e...44Af',
    subscribers: 634,
    rating: 4.3,
    lastExecuted: new Date(Date.now() - 1 * 60 * 60 * 1000),
    isPublic: true,
    parameters: {
      strategy_name: 'RSI Momentum',
      strategy_type: 'rsi',
      pair: 'INJ/USDT',
      total_investment: 3000,
      token_invested: 'USDT',
      duration_days: 60,
      risk_level: 'high',
      deploy_to_chain: true
    },
    summary: 'RSI-based momentum strategy that buys when RSI < 30 and sells when RSI > 70. High-risk, high-reward approach.',
    uiLayout: {
      page_title: 'RSI Momentum Strategy',
      sections: [],
      actions: []
    },
    contractCall: {
      contract_name: 'StrategyExecutor',
      method: 'deployStrategy',
      params: {}
    },
    deploymentWarning: 'High-risk strategy - use with caution',
    followUpSuggestions: [],
    status: 'active',
    performance: {
      roi: 31.7,
      tradeCount: 42,
      totalVolume: 8940,
      winRate: 73.8,
      currentValue: 3951,
      pnl: 951,
      lastUpdated: new Date()
    }
  }
];

export default function MarketplaceScreen() {
  const { deployStrategy, isWalletConnected, connectWallet } = useStrategy();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'trending' | 'top-rated'>('trending');
  const [publishedStrategies, setPublishedStrategies] = useState<MarketplaceStrategy[]>([]);
  const [allStrategies, setAllStrategies] = useState<MarketplaceStrategy[]>([]);

  // Load published strategies from storage
  useEffect(() => {
    const loadPublishedStrategies = async () => {
      try {
        const stored = await AsyncStorage.getItem('publishedStrategies');
        const userPublished = stored ? JSON.parse(stored) as StrategyResult[] : [];
        
        // Convert to marketplace format
        const marketplaceStrategies: MarketplaceStrategy[] = userPublished.map(strategy => ({
          ...strategy,
          creator: strategy.creator || 'Unknown',
          subscribers: strategy.subscribers || 0,
          rating: 4.0 + Math.random() * 1, // Mock rating
          lastExecuted: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
          isPublic: true
        }));
        
        setPublishedStrategies(marketplaceStrategies);
        
        // Combine with trending strategies
        const combined = [...TRENDING_STRATEGIES, ...marketplaceStrategies];
        setAllStrategies(combined);
      } catch (error) {
        console.error('Error loading published strategies:', error);
        setAllStrategies(TRENDING_STRATEGIES);
      }
    };
    
    loadPublishedStrategies();
  }, []);

  const handleSubscribe = async (strategy: MarketplaceStrategy) => {
    if (!isWalletConnected) {
      Alert.alert(
        'Wallet Required',
        'Please connect your wallet to subscribe to strategies.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Connect Wallet', onPress: connectWallet }
        ]
      );
      return;
    }

    Alert.alert(
      'Subscribe to Strategy',
      `Subscribe to "${strategy.parameters.strategy_name}" by ${strategy.creator}?\n\nThis will add the strategy to your collection as a draft. You can deploy it later.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Subscribe',
          onPress: async () => {
            const subscribedStrategy: StrategyResult = {
              ...strategy,
              id: `subscribed-${Date.now()}`,
              status: 'draft',
              deployedAt: undefined,
              txHash: undefined,
              performance: undefined
            };
            
            // Deploy as draft (save to collection)
            const result = await deployStrategy(subscribedStrategy);
            if (result.success) {
              Alert.alert(
                'Success!', 
                `"${strategy.parameters.strategy_name}" has been added to your strategy collection!\n\nYou can find it in the "My Strategies" tab.`
              );
            } else {
              Alert.alert('Error', 'Failed to subscribe to strategy. Please try again.');
            }
          }
        }
      ]
    );
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'high': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const renderStrategyCard = ({ item }: { item: MarketplaceStrategy }) => (
    <View style={styles.strategyCard}>
      <View style={styles.cardHeader}>
        <View style={styles.strategyInfo}>
          <Text style={styles.strategyName}>{item.parameters.strategy_name}</Text>
          <Text style={styles.creatorText}>by {item.creator}</Text>
        </View>
        <View style={styles.ratingContainer}>
          <Star size={16} color="#F59E0B" fill="#F59E0B" />
          <Text style={styles.ratingText}>{item.rating}</Text>
        </View>
      </View>

      <Text style={styles.strategyDescription} numberOfLines={2}>
        {item.summary}
      </Text>

      <View style={styles.metricsContainer}>
        <View style={styles.metricItem}>
          <TrendingUp size={16} color="#10B981" />
          <Text style={styles.metricValue}>+{item.performance?.roi.toFixed(1)}%</Text>
          <Text style={styles.metricLabel}>ROI</Text>
        </View>
        <View style={styles.metricItem}>
          <Users size={16} color="#3B82F6" />
          <Text style={styles.metricValue}>{item.subscribers}</Text>
          <Text style={styles.metricLabel}>Subscribers</Text>
        </View>
        <View style={styles.metricItem}>
          <Calendar size={16} color="#6B7280" />
          <Text style={styles.metricValue}>{formatTimeAgo(item.lastExecuted)}</Text>
          <Text style={styles.metricLabel}>Last Active</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.strategyDetails}>
          <View style={styles.pairContainer}>
            <Text style={styles.pairText}>{item.parameters.pair}</Text>
          </View>
          <View style={[styles.riskBadge, { backgroundColor: getRiskColor(item.parameters.risk_level) + '20' }]}>
            <Text style={[styles.riskText, { color: getRiskColor(item.parameters.risk_level) }]}>
              {item.parameters.risk_level.toUpperCase()}
            </Text>
          </View>
        </View>
        <TouchableOpacity 
          style={[styles.subscribeButton, !isWalletConnected && styles.subscribeButtonDisabled]}
          onPress={() => handleSubscribe(item)}
        >
          <Copy size={16} color="#FFFFFF" />
          <Text style={styles.subscribeText}>
            {isWalletConnected ? 'Subscribe' : 'Connect Wallet'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Strategy Marketplace',
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerShadowVisible: false,
        }} 
      />
      
      <View style={styles.filterContainer}>
        {(['trending', 'top-rated', 'all'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              selectedFilter === filter && styles.filterButtonActive
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text style={[
              styles.filterText,
              selectedFilter === filter && styles.filterTextActive
            ]}>
              {filter === 'top-rated' ? 'Top Rated' : filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={allStrategies}
        keyExtractor={(item) => item.id || 'unknown'}
        renderItem={renderStrategyCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 16,
  },
  strategyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  strategyInfo: {
    flex: 1,
  },
  strategyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  creatorText: {
    fontSize: 14,
    color: '#6B7280',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 4,
  },
  strategyDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 16,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 4,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  strategyDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pairContainer: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  pairText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  riskText: {
    fontSize: 12,
    fontWeight: '600',
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  subscribeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  subscribeButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
});