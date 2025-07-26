import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, KeyboardAvoidingView, Platform, FlatList, TouchableOpacity, TextInput, Alert, Animated } from 'react-native';
import { Stack } from 'expo-router';
import { Send, Bot, User, Wallet, TrendingUp, BarChart3, Save, CheckCircle } from 'lucide-react-native';
import { useStrategy } from '@/hooks/strategy-store';
import { StrategyResult } from '@/types/strategy';
import { parseStrategyInput } from '@/utils/strategyParser';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  strategyPreview?: StrategyResult;
  backtestData?: {
    roi: number;
    winRate: number;
    trades: number;
    maxDrawdown: number;
  };
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    type: 'ai',
    content: "👋 Hi! I'm your AI trading strategist. I'll help you create, backtest, and deploy trading strategies on Injective Protocol.\n\nWhat kind of trading strategy would you like to create today?",
    timestamp: new Date()
  }
];



export default function CreateStrategyScreen() {
  const { isWalletConnected, walletAddress, connectWallet, deployStrategy, saveCurrentStrategy } = useStrategy();
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<'input' | 'questions' | 'backtest' | 'deploy'>('input');
  const [currentStrategy, setCurrentStrategy] = useState<StrategyResult | null>(null);
  const [showSaveSuccess, setShowSaveSuccess] = useState<boolean>(false);
  const flatListRef = useRef<FlatList>(null);
  const saveSuccessAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (messages.length > 1) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const simulateAIResponse = async (userInput: string) => {
    setIsTyping(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (currentStep === 'input') {
      // Use the actual parser to create a realistic strategy
      const parsedStrategy = parseStrategyInput(userInput);
      
      const mockStrategy: StrategyResult = {
        id: `strategy-${Date.now()}`,
        ...parsedStrategy,
        status: 'draft'
      };
      
      setCurrentStrategy(mockStrategy);
      
      addMessage({
        type: 'ai',
        content: "Great! I've analyzed your request and created a preliminary strategy. Let me ask a few questions to optimize it for you:",
        strategyPreview: mockStrategy
      });
      
      setTimeout(() => {
        addMessage({
          type: 'ai',
          content: "What's your risk tolerance for this strategy? This will help me adjust the grid spacing and position sizes."
        });
        setCurrentStep('questions');
      }, 1000);
      
    } else if (currentStep === 'questions') {
      addMessage({
        type: 'ai',
        content: "Perfect! Now I'll run a backtest simulation based on historical data..."
      });
      
      setTimeout(() => {
        const backtestData = {
          roi: 18.7,
          winRate: 84.2,
          trades: 47,
          maxDrawdown: -5.3
        };
        
        addMessage({
          type: 'ai',
          content: "📊 Backtest Complete!\n\nBased on the last 30 days of INJ/USDT data, your strategy would have:",
          backtestData
        });
        
        setCurrentStep('backtest');
      }, 2000);
      
    } else if (currentStep === 'backtest') {
      addMessage({
        type: 'ai',
        content: "Excellent! Your strategy looks promising. Would you like to deploy it to Injective Protocol?\n\n⚠️ Make sure you have sufficient USDT in your wallet for the initial investment."
      });
      setCurrentStep('deploy');
    }
    
    setIsTyping(false);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    
    addMessage({
      type: 'user',
      content: inputText
    });
    
    const userMessage = inputText;
    setInputText('');
    
    await simulateAIResponse(userMessage);
  };

  const handleSaveStrategy = () => {
    if (!currentStrategy) return;
    
    const savedStrategy = saveCurrentStrategy();
    if (savedStrategy) {
      setShowSaveSuccess(true);
      
      // Animate success indicator
      Animated.sequence([
        Animated.timing(saveSuccessAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(saveSuccessAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start(() => {
        setShowSaveSuccess(false);
      });
      
      addMessage({
        type: 'system',
        content: `✅ Strategy saved successfully!\n\nYour strategy "${currentStrategy.parameters.strategy_name}" has been saved to your collection. You can find it in the "My Strategies" tab.`
      });
    }
  };

  const handleDeployStrategy = async () => {
    if (!isWalletConnected) {
      Alert.alert(
        'Wallet Required',
        'Please connect your wallet to deploy strategies.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Connect Wallet', onPress: connectWallet }
        ]
      );
      return;
    }
    
    if (!currentStrategy) return;
    
    Alert.alert(
      'Deploy Strategy',
      'Deploy this strategy to Injective Protocol?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deploy',
          onPress: async () => {
            const result = await deployStrategy(currentStrategy);
            if (result.success) {
              addMessage({
                type: 'system',
                content: `🎉 Strategy deployed successfully!\n\nTransaction Hash: ${result.txHash}\n\nYour strategy is now live and will start executing automatically.`
              });
            } else {
              Alert.alert('Deployment Failed', result.error || 'Unknown error');
            }
          }
        }
      ]
    );
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.type === 'user';
    const isSystem = item.type === 'system';
    
    return (
      <View style={[styles.messageContainer, isUser && styles.userMessageContainer]}>
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble, isSystem && styles.systemBubble]}>
          <View style={styles.messageHeader}>
            {!isUser && !isSystem && <Bot size={16} color="#3B82F6" />}
            {isUser && <User size={16} color="#FFFFFF" />}
            {isSystem && <TrendingUp size={16} color="#10B981" />}
            <Text style={[styles.messageType, isUser && styles.userMessageType, isSystem && styles.systemMessageType]}>
              {isSystem ? 'System' : isUser ? 'You' : 'AI Assistant'}
            </Text>
          </View>
          <Text style={[styles.messageText, isUser && styles.userMessageText, isSystem && styles.systemMessageText]}>
            {item.content}
          </Text>
          
          {item.strategyPreview && (
            <View style={styles.strategyPreview}>
              <Text style={styles.previewTitle}>📋 Strategy Preview</Text>
              <Text style={styles.previewText}>{item.strategyPreview.parameters.strategy_name}</Text>
              <Text style={styles.previewText}>Pair: {item.strategyPreview.parameters.pair}</Text>
              <Text style={styles.previewText}>Investment: ${item.strategyPreview.parameters.total_investment}</Text>
            </View>
          )}
          
          {item.backtestData && (
            <View style={styles.backtestResults}>
              <View style={styles.backtestRow}>
                <Text style={styles.backtestLabel}>ROI:</Text>
                <Text style={[styles.backtestValue, { color: '#10B981' }]}>+{item.backtestData.roi}%</Text>
              </View>
              <View style={styles.backtestRow}>
                <Text style={styles.backtestLabel}>Win Rate:</Text>
                <Text style={styles.backtestValue}>{item.backtestData.winRate}%</Text>
              </View>
              <View style={styles.backtestRow}>
                <Text style={styles.backtestLabel}>Total Trades:</Text>
                <Text style={styles.backtestValue}>{item.backtestData.trades}</Text>
              </View>
              <View style={styles.backtestRow}>
                <Text style={styles.backtestLabel}>Max Drawdown:</Text>
                <Text style={[styles.backtestValue, { color: '#EF4444' }]}>{item.backtestData.maxDrawdown}%</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <Stack.Screen 
        options={{ 
          title: 'AI Strategy Copilot',
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerShadowVisible: false,
          headerRight: () => (
            <TouchableOpacity 
              style={styles.walletButton}
              onPress={connectWallet}
            >
              <Wallet size={20} color={isWalletConnected ? '#10B981' : '#6B7280'} />
              <Text style={[styles.walletText, isWalletConnected && styles.walletConnected]}>
                {isWalletConnected ? `${walletAddress?.slice(0, 6)}...` : 'Connect'}
              </Text>
            </TouchableOpacity>
          ),
        }} 
      />
      
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
      />
      
      {isTyping && (
        <View style={styles.typingIndicator}>
          <Bot size={16} color="#3B82F6" />
          <Text style={styles.typingText}>AI is thinking...</Text>
        </View>
      )}
      
      {(currentStep === 'backtest' || currentStep === 'deploy') && currentStrategy && (
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSaveStrategy}
          >
            <Save size={20} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>Save Strategy</Text>
          </TouchableOpacity>
          
          {currentStep === 'deploy' && (
            <TouchableOpacity 
              style={[styles.deployButton, { marginTop: 12 }]}
              onPress={handleDeployStrategy}
            >
              <BarChart3 size={20} color="#FFFFFF" />
              <Text style={styles.deployButtonText}>Deploy to Injective</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      
      {/* Save Success Animation */}
      {showSaveSuccess && (
        <Animated.View 
          style={[
            styles.saveSuccessOverlay,
            {
              opacity: saveSuccessAnim,
              transform: [{
                scale: saveSuccessAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1]
                })
              }]
            }
          ]}
        >
          <View style={styles.saveSuccessContent}>
            <CheckCircle size={48} color="#10B981" />
            <Text style={styles.saveSuccessText}>Strategy Saved!</Text>
            <Text style={styles.saveSuccessSubtext}>Check "My Strategies" tab</Text>
          </View>
        </Animated.View>
      )}
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Describe your trading strategy..."
          multiline
          maxLength={500}
        />
        <TouchableOpacity 
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!inputText.trim() || isTyping}
        >
          <Send size={20} color={inputText.trim() ? '#FFFFFF' : '#9CA3AF'} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  walletButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  walletText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 6,
  },
  walletConnected: {
    color: '#10B981',
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  messageContainer: {
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  aiBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: '#3B82F6',
    borderBottomRightRadius: 4,
  },
  systemBubble: {
    backgroundColor: '#10B981',
    borderRadius: 12,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  messageType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 6,
  },
  userMessageType: {
    color: '#FFFFFF',
  },
  systemMessageType: {
    color: '#FFFFFF',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1F2937',
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  systemMessageText: {
    color: '#FFFFFF',
  },
  strategyPreview: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  previewText: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 4,
  },
  backtestResults: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  backtestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  backtestLabel: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  backtestValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typingText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    fontStyle: 'italic',
  },
  actionContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  deployContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  deployButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
  },
  deployButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  saveSuccessOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  saveSuccessContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  saveSuccessText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  saveSuccessSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
    backgroundColor: '#F9FAFB',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
});