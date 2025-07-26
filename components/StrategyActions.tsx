import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useStrategy } from '@/hooks/strategy-store';
import { StrategyResult } from '@/types/strategy';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { Wallet, Shield } from 'lucide-react-native';

interface StrategyActionsProps {
  strategy: StrategyResult;
  onSave?: () => void;
  onDeploy?: () => void;
}

export default function StrategyActions({ strategy, onSave, onDeploy }: StrategyActionsProps) {
  const { saveCurrentStrategy, deployStrategy, isWalletConnected, connectWallet, isConnecting, walletAddress } = useStrategy();
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [deployResult, setDeployResult] = useState<{ success: boolean; txHash?: string; error?: string } | null>(null);

  const handleSave = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    saveCurrentStrategy();
    if (onSave) onSave();
  };

  const handleConnectWallet = async () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    
    try {
      const connected = await connectWallet();
      if (!connected) {
        Alert.alert('Connection Failed', 'Failed to connect wallet. Please try again.');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      Alert.alert('Error', 'An error occurred while connecting wallet.');
    }
  };

  const handleDeploy = async () => {
    if (!isWalletConnected) {
      Alert.alert('Wallet Required', 'Please connect your wallet first.');
      return;
    }

    Alert.alert(
      'Deploy Strategy',
      `${strategy.deploymentWarning}\n\nThis will deploy your strategy to the Injective blockchain.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Deploy', 
          style: 'default',
          onPress: async () => {
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            setIsDeploying(true);
            setDeployResult(null);
            
            try {
              const result = await deployStrategy(strategy);
              setDeployResult(result);
              
              if (result.success) {
                if (Platform.OS !== 'web') {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
                Alert.alert(
                  'Deployment Successful!',
                  `Strategy deployed successfully.\nTransaction Hash: ${result.txHash}`,
                  [{ text: 'OK', onPress: () => onDeploy?.() }]
                );
              } else {
                if (Platform.OS !== 'web') {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                }
                Alert.alert('Deployment Failed', result.error || 'Unknown error occurred');
              }
            } catch (error) {
              console.error('Error deploying strategy:', error);
              Alert.alert('Error', 'An error occurred during deployment.');
            } finally {
              setIsDeploying(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container} testID="strategy-actions">
      {/* Wallet Connection Status */}
      {isWalletConnected ? (
        <View style={styles.walletConnected}>
          <View style={styles.walletInfo}>
            <Wallet size={16} color="#10B981" />
            <Text style={styles.walletText}>
              Connected: {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
            </Text>
          </View>
          <View style={styles.connectedIndicator} />
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.connectWalletButton} 
          onPress={handleConnectWallet}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <ActivityIndicator color="#3B82F6" size="small" />
          ) : (
            <>
              <Wallet size={20} color="#3B82F6" />
              <Text style={styles.connectWalletText}>Connect Wallet</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Warning */}
      <View style={styles.warningContainer}>
        <Shield size={16} color="#F59E0B" />
        <Text style={styles.warningText}>{strategy.deploymentWarning}</Text>
      </View>
      
      {/* Action Buttons */}
      <TouchableOpacity 
        style={styles.saveButton} 
        onPress={handleSave}
        disabled={isDeploying}
      >
        <Text style={styles.saveButtonText}>Save Strategy</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.deployButton, 
          !isWalletConnected && styles.disabledButton,
          isDeploying && styles.deployingButton, 
          deployResult?.success && styles.successButton
        ]} 
        onPress={handleDeploy}
        disabled={!isWalletConnected || isDeploying || deployResult?.success}
      >
        {isDeploying ? (
          <>
            <ActivityIndicator color="#FFFFFF" size="small" />
            <Text style={[styles.deployButtonText, { marginLeft: 8 }]}>Deploying...</Text>
          </>
        ) : (
          <Text style={styles.deployButtonText}>
            {deployResult?.success ? '✓ Deployed Successfully' : 'Deploy to Blockchain'}
          </Text>
        )}
      </TouchableOpacity>
      
      {/* Follow-up Suggestions */}
      <View style={styles.followUpContainer}>
        <Text style={styles.followUpTitle}>Quick Actions:</Text>
        {strategy.followUpSuggestions.map((suggestion, index) => (
          <TouchableOpacity key={index} style={styles.followUpButton}>
            <Text style={styles.followUpText}>{suggestion}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saveButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  deployButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  deployingButton: {
    backgroundColor: '#93C5FD',
  },
  successButton: {
    backgroundColor: '#10B981',
  },
  walletConnected: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletText: {
    fontSize: 14,
    color: '#065F46',
    marginLeft: 8,
    fontWeight: '500',
  },
  connectedIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  connectWalletButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  connectWalletText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3B82F6',
    marginLeft: 8,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  warningText: {
    fontSize: 13,
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  deployButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  followUpContainer: {
    marginTop: 16,
  },
  followUpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  followUpButton: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  followUpText: {
    fontSize: 16,
    color: '#4B5563',
  },
});