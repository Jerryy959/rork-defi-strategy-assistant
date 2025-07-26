import React from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { User, TrendingUp, BarChart3, DollarSign, Settings } from 'lucide-react-native';
import { useStrategy } from '@/hooks/strategy-store';
import SavedStrategyCard from '@/components/SavedStrategyCard';

export default function StrategiesScreen() {
  const { savedStrategies, deleteStrategy, isLoading, userProfile, isWalletConnected, disconnectWallet } = useStrategy();
  const router = useRouter();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'My Strategies',
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerShadowVisible: false,
          headerRight: () => (
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => {
                // Could navigate to profile screen or show profile modal
                console.log('Profile pressed');
              }}
            >
              <User size={20} color="#3B82F6" />
            </TouchableOpacity>
          ),
        }} 
      />
      
      {/* User Profile Section */}
      {isWalletConnected && userProfile && (
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <View style={styles.profileInfo}>
              <Text style={styles.profileTitle}>Portfolio Overview</Text>
              <Text style={styles.walletAddress}>
                {userProfile.walletAddress.slice(0, 6)}...{userProfile.walletAddress.slice(-4)}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={disconnectWallet}
            >
              <Settings size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <BarChart3 size={20} color="#3B82F6" />
              <Text style={styles.statValue}>{userProfile.totalStrategies}</Text>
              <Text style={styles.statLabel}>Total Strategies</Text>
            </View>
            <View style={styles.statItem}>
              <TrendingUp size={20} color="#10B981" />
              <Text style={styles.statValue}>{userProfile.activeStrategies}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statItem}>
              <DollarSign size={20} color="#F59E0B" />
              <Text style={styles.statValue}>${userProfile.totalReturns.toFixed(0)}</Text>
              <Text style={styles.statLabel}>Total Returns</Text>
            </View>
          </View>
        </View>
      )}
      
      {savedStrategies.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Saved Strategies</Text>
          <Text style={styles.emptyDescription}>
            Your saved trading strategies will appear here. Create a new strategy to get started.
          </Text>
        </View>
      ) : (
        <FlatList
          data={savedStrategies}
          keyExtractor={(_, index) => `strategy-${index}`}
          renderItem={({ item, index }) => (
            <SavedStrategyCard
              strategy={item}
              onPress={() => {
                if (item.id) {
                  router.push(`/strategy-detail?id=${item.id}`);
                } else {
                  console.log('Strategy has no ID, cannot navigate to details');
                }
              }}
              onDelete={() => deleteStrategy(index)}
            />
          )}
          contentContainerStyle={styles.listContainer}
          testID="strategies-list"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  profileButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  profileSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileInfo: {
    flex: 1,
  },
  profileTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  walletAddress: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  settingsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
});