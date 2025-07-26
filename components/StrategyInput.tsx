import React, { useState } from 'react';
import { StyleSheet, TextInput, View, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Send } from 'lucide-react-native';
import { useStrategy } from '@/hooks/strategy-store';

interface StrategyInputProps {
  onSubmit?: () => void;
}

export default function StrategyInput({ onSubmit }: StrategyInputProps) {
  const { processInput, isProcessing } = useStrategy();
  const [input, setInput] = useState<string>('');

  const handleSubmit = () => {
    if (input.trim()) {
      processInput(input.trim());
      if (onSubmit) onSubmit();
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Describe your trading strategy..."
        placeholderTextColor="#9CA3AF"
        value={input}
        onChangeText={setInput}
        multiline
        numberOfLines={3}
        testID="strategy-input"
      />
      <TouchableOpacity 
        style={styles.button} 
        onPress={handleSubmit}
        disabled={isProcessing || !input.trim()}
      >
        {isProcessing ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Send color="#FFFFFF" size={20} />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    minHeight: 80,
    maxHeight: 120,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  button: {
    marginLeft: 12,
    backgroundColor: '#3B82F6',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});