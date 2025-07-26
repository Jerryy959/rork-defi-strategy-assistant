import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Modal } from 'react-native';
import { StrategyResult } from '@/types/strategy';
import { Trash2, TrendingUp, TrendingDown, Activity, Pause, Square, Share2, Users, CheckCircle } from 'lucide-react-native';
import { useStrategy } from '@/hooks/strategy-store';

interface SavedStrategyCardProps {
  strategy: StrategyResult;
  onPress: () => void;
  onDelete: () => void;
}

export default function SavedStrategyCard({ strategy, onPress, onDelete }: SavedStrategyCardProps) {
  const { publishStrategy, isWalletConnected, connectWallet } = useStrategy();
  const [showPublishModal, setShowPublishModal] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'paused': return '#F59E0B';
      case 'stopped': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'active': return <Activity size={14} color={getStatusColor(status)} />;
      case 'paused': return <Pause size={14} color={getStatusColor(status)} />;
      case 'stopped': return <Square size={14} color={getStatusColor(status)} />;
      default: return null;
    }
  };

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

  const handlePublishPress = () => {
    if (!isWalletConnected) {
      Alert.alert(
        'Wallet Required',
        'Please connect your wallet to publish strategies.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Connect Wallet', onPress: connectWallet }
        ]
      );
      return;
    }
    
    setShowPublishModal(true);
  };

  const handleConfirmPublish = async () => {
    if (!strategy.id) return;
    
    setIsPublishing(true);
    const result = await publishStrategy(strategy.id);
    setIsPublishing(false);
    setShowPublishModal(false);
    
    if (result.success) {
      Alert.alert(
        'Published Successfully! 🎉',
        `Your strategy "${strategy.parameters.strategy_name}" is now live in the marketplace. Other users can discover and subscribe to it.`,
        [{ text: 'Great!', style: 'default' }]
      );
    } else {
      Alert.alert('Publishing Failed', result.error || 'Unknown error');
    }
  };

  return (
    <>
      <TouchableOpacity style={styles.container} onPress={onPress} testID="saved-strategy-card">
        <View style={styles.header}>
          <View style={styles.leftHeader}>
            <View style={styles.typeContainer}>
              <Text style={styles.typeText}>{strategy.parameters.strategy_name}</Text>
            </View>
            <View style={styles.statusRow}>
              {strategy.status && (
                <View style={styles.statusContainer}>
                  {getStatusIcon(strategy.status)}
                  <Text style={[styles.statusText, { color: getStatusColor(strategy.status) }]}>
                    {strategy.status.charAt(0).toUpperCase() + strategy.status.slice(1)}
                  </Text>
                </View>
              )}
              {strategy.isPublished && (
                <View style={styles.publishedBadge}>
                  <CheckCircle size={12} color="#10B981" />
                  <Text style={styles.publishedText}>Published</Text>
                  {strategy.subscribers !== undefined && (
                    <View style={styles.subscribersContainer}>
                      <Users size={12} color="#6B7280" />
                      <Text style={styles.subscribersText}>{strategy.subscribers}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      
      <View style={styles.pairContainer}>
        <Text style={styles.pairText}>{strategy.parameters.pair}</Text>
        {strategy.txHash && (
          <Text style={styles.txHashText}>
            TX: {strategy.txHash.slice(0, 8)}...{strategy.txHash.slice(-6)}
          </Text>
        )}
      </View>
      
      {/* Performance Section */}
      {strategy.performance ? (
        <View style={styles.performanceContainer}>
          <View style={styles.performanceItem}>
            <Text style={styles.performanceLabel}>ROI</Text>
            <View style={styles.performanceValueContainer}>
              {strategy.performance.roi >= 0 ? (
                <TrendingUp size={16} color="#10B981" />
              ) : (
                <TrendingDown size={16} color="#EF4444" />
              )}
              <Text style={[
                styles.performanceValue,
                { color: strategy.performance.roi >= 0 ? '#10B981' : '#EF4444' }
              ]}>
                {formatPercentage(strategy.performance.roi)}
              </Text>
            </View>
          </View>
          
          <View style={styles.performanceItem}>
            <Text style={styles.performanceLabel}>Trades</Text>
            <Text style={styles.performanceValue}>{strategy.performance.tradeCount}</Text>
          </View>
          
          <View style={styles.performanceItem}>
            <Text style={styles.performanceLabel}>Current Value</Text>
            <Text style={styles.performanceValue}>
              {formatCurrency(strategy.performance.currentValue)}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Investment</Text>
            <Text style={styles.detailValue}>
              {strategy.parameters.total_investment} {strategy.parameters.token_invested}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>{strategy.parameters.duration_days} days</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Risk</Text>
            <Text style={[
              styles.riskValue, 
              strategy.parameters.risk_level === 'low' ? styles.lowRisk : 
              strategy.parameters.risk_level === 'high' ? styles.highRisk : 
              styles.mediumRisk
            ]}>
              {strategy.parameters.risk_level.charAt(0).toUpperCase() + strategy.parameters.risk_level.slice(1)}
            </Text>
          </View>
        </View>
      )}
      
      {/* Publish Button - only show for draft strategies that aren't published */}
      {strategy.status === 'draft' && !strategy.isPublished && (
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={styles.publishButton}
            onPress={(e) => {
              e.stopPropagation();
              handlePublishPress();
            }}
          >
            <Share2 size={16} color="#3B82F6" />
            <Text style={styles.publishButtonText}>Publish to Marketplace</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
    
    {/* Publish Confirmation Modal */}
    <Modal
      visible={showPublishModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowPublishModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Share2 size={24} color="#3B82F6" />
            <Text style={styles.modalTitle}>Publish Strategy</Text>
          </View>
          
          <Text style={styles.modalMessage}>
            Are you sure you want to publish "{strategy.parameters.strategy_name}" to the marketplace?
          </Text>
          
          <Text style={styles.modalSubMessage}>
            Once published, other users will be able to view and subscribe to your strategy. You can track subscriber count in your strategy library.
          </Text>
          
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.modalCancelButton}
              onPress={() => setShowPublishModal(false)}
              disabled={isPublishing}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalConfirmButton, isPublishing && styles.modalConfirmButtonDisabled]}
              onPress={handleConfirmPublish}
              disabled={isPublishing}
            >
              <Text style={styles.modalConfirmText}>
                {isPublishing ? 'Publishing...' : 'Publish'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  leftHeader: {
    flex: 1,
  },
  typeContainer: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  typeText: {
    color: '#1E40AF',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  publishedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  publishedText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#10B981',
    marginLeft: 4,
  },
  subscribersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  subscribersText: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 2,
  },
  pairContainer: {
    marginBottom: 12,
  },
  txHashText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontFamily: 'monospace',
  },
  pairText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  riskValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  lowRisk: {
    color: '#10B981',
  },
  mediumRisk: {
    color: '#F59E0B',
  },
  highRisk: {
    color: '#EF4444',
  },
  performanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  performanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  performanceLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  performanceValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  performanceValue: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  actionContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  publishButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 12,
    lineHeight: 24,
  },
  modalSubMessage: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  modalConfirmButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});