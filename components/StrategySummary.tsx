import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { StrategyResult } from '@/types/strategy';

interface StrategySummaryProps {
  strategy: StrategyResult;
}

export default function StrategySummary({ strategy }: StrategySummaryProps) {
  return (
    <ScrollView style={styles.container} testID="strategy-summary">
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>{strategy.summary}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Strategy Parameters</Text>
        <View style={styles.parameterContainer}>
          {strategy.uiLayout.sections.map((section, index) => (
            <View key={index} style={styles.parameter}>
              <Text style={styles.parameterLabel}>{section.title}</Text>
              <Text style={styles.parameterValue}>{section.value}</Text>
            </View>
          ))}
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Backtesting Results</Text>
        <Text style={styles.backtestingText}>{strategy.backtestingFeedback}</Text>
      </View>
      
      <View style={styles.warningContainer}>
        <Text style={styles.warningText}>{strategy.deploymentWarning}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  summaryContainer: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    margin: 16,
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1E40AF',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  parameterContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  parameter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  parameterLabel: {
    fontSize: 16,
    color: '#4B5563',
  },
  parameterValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  backtestingText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4B5563',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
  },
  warningContainer: {
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  warningText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#B91C1C',
  },
});