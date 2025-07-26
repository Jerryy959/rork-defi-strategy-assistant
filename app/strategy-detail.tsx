import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Dimensions, Platform } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useStrategy } from '@/hooks/strategy-store';
import { StrategyResult } from '@/types/strategy';
import { LineChart } from 'react-native-chart-kit';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  DollarSign, 
  BarChart3, 

  ExternalLink,
  Square,
  RefreshCw
} from 'lucide-react-native';

import * as Haptics from 'expo-haptics';

const screenWidth = Dimensions.get('window').width;

export default function StrategyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { savedStrategies, stopStrategy, updateStrategyPerformance } = useStrategy();
  const router = useRouter();
  const [strategy, setStrategy] = useState<StrategyResult | null>(null);
  const [isStopping, setIsStopping] = useState<boolean>(false);

  useEffect(() => {
    const foundStrategy = savedStrategies.find(s => s.id === id);
    if (foundStrategy) {
      setStrategy(foundStrategy);
    } else {
      router.back();
    }
  }, [id, savedStrategies, router]);

  const handleStopStrategy = async () => {
    if (!strategy?.id) return;

    Alert.alert(
      'Stop Strategy',
      'Are you sure you want to stop this strategy? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: async () => {
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            setIsStopping(true);
            
            try {
              const result = await stopStrategy(strategy.id!);
              if (result.success) {
                if (Platform.OS !== 'web') {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
                Alert.alert('Success', 'Strategy stopped successfully');
              } else {
                Alert.alert('Error', result.error || 'Failed to stop strategy');
              }
            } catch (error) {
              console.error('Error stopping strategy:', error);
              Alert.alert('Error', 'An error occurred while stopping the strategy');
            } finally {
              setIsStopping(false);
            }
          }
        }
      ]
    );
  };

  const handleRefreshPerformance = () => {
    if (strategy?.id && strategy.status === 'active') {
      if (Platform.OS !== 'web') {
        Haptics.selectionAsync();
      }
      updateStrategyPerformance(strategy.id);
    }
  };

  const generateMockChartData = () => {
    const data = [];
    const baseValue = strategy?.parameters.total_investment || 1000;
    
    for (let i = 0; i < 30; i++) {
      const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
      const value = baseValue * (1 + variation * (i / 30));
      data.push(value);
    }
    
    return data;
  };

  if (!strategy) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'paused': return '#F59E0B';
      case 'stopped': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: strategy.parameters.strategy_name,
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerShadowVisible: false,
        }} 
      />
      
      <ScrollView style={styles.scrollContainer}>
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.pairText}>{strategy.parameters.pair}</Text>
              <Text style={styles.strategyTypeText}>{strategy.parameters.strategy_name}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(strategy.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(strategy.status) }]}>
                {strategy.status ? strategy.status.charAt(0).toUpperCase() + strategy.status.slice(1) : 'Draft'}
              </Text>
            </View>
          </View>
          
          {strategy.txHash && (
            <TouchableOpacity style={styles.txContainer}>
              <ExternalLink size={16} color="#6B7280" />
              <Text style={styles.txText}>
                {strategy.txHash.slice(0, 10)}...{strategy.txHash.slice(-8)}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Performance Overview */}
        {strategy.performance && (
          <View style={styles.performanceCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Performance Overview</Text>
              <TouchableOpacity onPress={handleRefreshPerformance} style={styles.refreshButton}>
                <RefreshCw size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <View style={styles.metricHeader}>
                  {strategy.performance.roi >= 0 ? (
                    <TrendingUp size={20} color="#10B981" />
                  ) : (
                    <TrendingDown size={20} color="#EF4444" />
                  )}
                  <Text style={styles.metricLabel}>ROI</Text>
                </View>
                <Text style={[
                  styles.metricValue,
                  { color: strategy.performance.roi >= 0 ? '#10B981' : '#EF4444' }
                ]}>
                  {formatPercentage(strategy.performance.roi)}
                </Text>
              </View>
              
              <View style={styles.metricItem}>
                <View style={styles.metricHeader}>
                  <BarChart3 size={20} color="#3B82F6" />
                  <Text style={styles.metricLabel}>Trades</Text>
                </View>
                <Text style={styles.metricValue}>{strategy.performance.tradeCount}</Text>
              </View>
              
              <View style={styles.metricItem}>
                <View style={styles.metricHeader}>
                  <DollarSign size={20} color="#8B5CF6" />
                  <Text style={styles.metricLabel}>Current Value</Text>
                </View>
                <Text style={styles.metricValue}>
                  {formatCurrency(strategy.performance.currentValue)}
                </Text>
              </View>
              
              <View style={styles.metricItem}>
                <View style={styles.metricHeader}>
                  <Activity size={20} color="#F59E0B" />
                  <Text style={styles.metricLabel}>P&L</Text>
                </View>
                <Text style={[
                  styles.metricValue,
                  { color: strategy.performance.pnl >= 0 ? '#10B981' : '#EF4444' }
                ]}>
                  {formatCurrency(strategy.performance.pnl)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Performance Chart */}
        {strategy.performance && (
          <View style={styles.chartCard}>
            <Text style={styles.cardTitle}>Performance Chart</Text>
            <LineChart
              data={{
                labels: ['', '', '', '', '', ''],
                datasets: [{
                  data: generateMockChartData()
                }]
              }}
              width={screenWidth - 32}
              height={220}
              chartConfig={{
                backgroundColor: '#FFFFFF',
                backgroundGradientFrom: '#FFFFFF',
                backgroundGradientTo: '#FFFFFF',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                style: {
                  borderRadius: 16
                },
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                  stroke: '#3B82F6'
                }
              }}
              bezier
              style={styles.chart}
            />
          </View>
        )}

        {/* Strategy Parameters */}
        <View style={styles.parametersCard}>
          <Text style={styles.cardTitle}>Strategy Parameters</Text>
          
          <View style={styles.parametersList}>
            <View style={styles.parameterItem}>
              <Text style={styles.parameterLabel}>Trading Pair</Text>
              <Text style={styles.parameterValue}>{strategy.parameters.pair}</Text>
            </View>
            
            <View style={styles.parameterItem}>
              <Text style={styles.parameterLabel}>Strategy Type</Text>
              <Text style={styles.parameterValue}>{strategy.parameters.strategy_type}</Text>
            </View>
            
            <View style={styles.parameterItem}>
              <Text style={styles.parameterLabel}>Total Investment</Text>
              <Text style={styles.parameterValue}>
                {strategy.parameters.total_investment} {strategy.parameters.token_invested}
              </Text>
            </View>
            
            {strategy.parameters.lower_bound && strategy.parameters.upper_bound && (
              <View style={styles.parameterItem}>
                <Text style={styles.parameterLabel}>Price Range</Text>
                <Text style={styles.parameterValue}>
                  ${strategy.parameters.lower_bound} - ${strategy.parameters.upper_bound}
                </Text>
              </View>
            )}
            
            {strategy.parameters.grid_count && (
              <View style={styles.parameterItem}>
                <Text style={styles.parameterLabel}>Grid Count</Text>
                <Text style={styles.parameterValue}>{strategy.parameters.grid_count}</Text>
              </View>
            )}
            
            <View style={styles.parameterItem}>
              <Text style={styles.parameterLabel}>Duration</Text>
              <Text style={styles.parameterValue}>{strategy.parameters.duration_days} days</Text>
            </View>
            
            <View style={styles.parameterItem}>
              <Text style={styles.parameterLabel}>Risk Level</Text>
              <Text style={[
                styles.parameterValue,
                {
                  color: strategy.parameters.risk_level === 'low' ? '#10B981' :
                        strategy.parameters.risk_level === 'high' ? '#EF4444' : '#F59E0B'
                }
              ]}>
                {strategy.parameters.risk_level.charAt(0).toUpperCase() + strategy.parameters.risk_level.slice(1)}
              </Text>
            </View>
            
            {strategy.deployedAt && (
              <View style={styles.parameterItem}>
                <Text style={styles.parameterLabel}>Deployed At</Text>
                <Text style={styles.parameterValue}>
                  {new Date(strategy.deployedAt).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Action Button */}
      {strategy.status === 'active' && (
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={[styles.stopButton, isStopping && styles.stoppingButton]}
            onPress={handleStopStrategy}
            disabled={isStopping}
          >
            <Square size={20} color="#FFFFFF" />
            <Text style={styles.stopButtonText}>
              {isStopping ? 'Stopping...' : 'Stop Strategy'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  pairText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  strategyTypeText: {
    fontSize: 16,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  txContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
  },
  txText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    fontFamily: 'monospace',
  },
  performanceCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  refreshButton: {
    padding: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  parametersCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    marginBottom: 100,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  parametersList: {
    marginTop: 16,
  },
  parameterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  parameterLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  parameterValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  actionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  stopButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  stoppingButton: {
    backgroundColor: '#FCA5A5',
  },
  stopButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});