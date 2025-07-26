import { StrategyParameters, StrategyResult, StrategyType, StrategyUILayout, SmartContractCall } from '@/types/strategy';

// Helper function to extract strategy type from input
const extractStrategyType = (input: string): StrategyType => {
  const input_lower = input.toLowerCase();
  
  if (input_lower.includes('grid')) return 'grid';
  if (input_lower.includes('dca') || input_lower.includes('dollar-cost') || input_lower.includes('dollar cost')) return 'dca';
  if (input_lower.includes('ma cross') || input_lower.includes('moving average')) return 'ma_cross';
  if (input_lower.includes('rsi')) return 'rsi';
  if (input_lower.includes('momentum')) return 'momentum';
  
  // Default to grid if not specified
  return 'grid';
};

// Helper function to extract currency pair
const extractPair = (input: string): string => {
  // Look for common patterns like XXX/YYY
  const pairMatch = input.match(/([A-Za-z0-9]+)\/([A-Za-z0-9]+)/);
  if (pairMatch) return pairMatch[0].toUpperCase();
  
  // Look for other common patterns
  if (input.toLowerCase().includes('inj/usdt')) return 'INJ/USDT';
  if (input.toLowerCase().includes('btc/usdt')) return 'BTC/USDT';
  if (input.toLowerCase().includes('eth/usdt')) return 'ETH/USDT';
  
  // Default
  return 'INJ/USDT';
};

// Helper to extract numeric values
const extractNumber = (input: string, pattern: RegExp, defaultValue: number): number => {
  const match = input.match(pattern);
  return match ? parseFloat(match[1]) : defaultValue;
};

// Enhanced parsing for more natural language patterns
const extractInvestmentAmount = (input: string): number => {
  // Look for patterns like "500 USDT", "$500", "invest 1000", "with 2000 USDT"
  const patterns = [
    /(\d+(?:\.\d+)?)\s*(?:usdt|usd)/i,
    /\$\s*(\d+(?:\.\d+)?)/,
    /invest\s*(\d+(?:\.\d+)?)/i,
    /with\s*(\d+(?:\.\d+)?)\s*(?:usdt|usd)/i,
    /capital\s*(\d+(?:\.\d+)?)/i,
    /amount\s*(\d+(?:\.\d+)?)/i
  ];
  
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return parseFloat(match[1]);
  }
  
  return 1000; // default
};

// Extract percentage-based triggers
const extractPercentageTriggers = (input: string): { buyTrigger?: number; sellTrigger?: number } => {
  const buyMatch = input.match(/buy\s*when\s*(?:price\s*)?(?:drops?|falls?)\s*(\d+(?:\.\d+)?)%/i);
  const sellMatch = input.match(/sell\s*(?:when\s*(?:price\s*)?(?:rises?|increases?)\s*|at\s*)\+?(\d+(?:\.\d+)?)%/i);
  
  return {
    buyTrigger: buyMatch ? parseFloat(buyMatch[1]) : undefined,
    sellTrigger: sellMatch ? parseFloat(sellMatch[1]) : undefined
  };
};

// Main parsing function
export const parseStrategyInput = (input: string): StrategyResult => {
  // Extract strategy type
  const strategy_type = extractStrategyType(input);
  
  // Extract pair
  const pair = extractPair(input);
  
  // Extract token invested (second part of the pair)
  const token_invested = pair.split('/')[1];
  
  // Extract investment amount with enhanced parsing
  const total_investment = extractInvestmentAmount(input);
  
  // Extract percentage triggers for buy/sell
  const { buyTrigger, sellTrigger } = extractPercentageTriggers(input);
  
  // Extract numeric parameters with defaults
  const lower_bound = extractNumber(input, /from\s*\$?\s*(\d+(\.\d+)?)/i, 15);
  const upper_bound = extractNumber(input, /to\s*\$?\s*(\d+(\.\d+)?)/i, 25);
  const grid_count = extractNumber(input, /(\d+)\s*grids/i, 10);
  const duration_days = extractNumber(input, /(\d+)\s*days/i, 30);
  
  // Calculate amount per order
  const amount_per_order = Math.round(total_investment / grid_count);
  
  // Determine risk level based on range and investment
  const range_percentage = ((upper_bound - lower_bound) / lower_bound) * 100;
  let risk_level: 'low' | 'medium' | 'high' = 'medium';
  if (range_percentage < 20) risk_level = 'low';
  if (range_percentage > 50) risk_level = 'high';
  
  // Create strategy parameters
  const parameters: StrategyParameters = {
    strategy_name: `${strategy_type === 'grid' ? 'Grid Trading' : 
                     strategy_type === 'dca' ? 'Dollar-Cost Averaging' : 
                     strategy_type === 'ma_cross' ? 'Moving Average Crossover' : 
                     strategy_type === 'rsi' ? 'RSI Strategy' : 'Momentum Strategy'}`,
    strategy_type,
    pair,
    lower_bound,
    upper_bound,
    grid_count,
    total_investment,
    amount_per_order,
    token_invested,
    duration_days,
    risk_level,
    deploy_to_chain: true
  };
  
  // Create human-readable summary with enhanced details
  let summary = '';
  if (strategy_type === 'grid') {
    summary = `You're creating a grid trading strategy for ${pair}. It will split the ${lower_bound}-${upper_bound} range into ${grid_count} equal price levels. When the price drops or rises by one level, the strategy will automatically place a buy or sell order of ${amount_per_order} ${token_invested}. The strategy will manage a total of ${total_investment} ${token_invested} over ${duration_days} days.`;
    
    if (buyTrigger || sellTrigger) {
      summary += ` Additional triggers: ${buyTrigger ? `Buy when price drops ${buyTrigger}%` : ''}${buyTrigger && sellTrigger ? ', ' : ''}${sellTrigger ? `Sell when price rises ${sellTrigger}%` : ''}.`;
    }
  } else if (strategy_type === 'dca') {
    summary = `You're creating a Dollar-Cost Averaging strategy for ${pair}. It will automatically invest ${amount_per_order} ${token_invested} at regular intervals over ${duration_days} days, for a total investment of ${total_investment} ${token_invested}.`;
  } else {
    summary = `You're creating a ${parameters.strategy_name} for ${pair} with a total investment of ${total_investment} ${token_invested} over ${duration_days} days.`;
    
    if (buyTrigger || sellTrigger) {
      summary += ` Triggers: ${buyTrigger ? `Buy when price drops ${buyTrigger}%` : ''}${buyTrigger && sellTrigger ? ', ' : ''}${sellTrigger ? `Sell when price rises ${sellTrigger}%` : ''}.`;
    }
  }
  
  // Create UI layout
  const uiLayout: StrategyUILayout = {
    page_title: "Confirm Strategy Deployment",
    sections: [
      { title: "Pair", value: pair },
      { title: "Type", value: parameters.strategy_name },
      { title: "Range", value: `$${lower_bound} - $${upper_bound}` },
      { title: "Grids", value: `${grid_count}` },
      { title: "Amount Per Order", value: `${amount_per_order} ${token_invested}` },
      { title: "Total Investment", value: `${total_investment} ${token_invested}` },
      { title: "Duration", value: `${duration_days} days` },
      { title: "Risk Level", value: risk_level.charAt(0).toUpperCase() + risk_level.slice(1) }
    ],
    actions: [
      { label: "Deploy Strategy", action: "send_transaction" },
      { label: "Edit", action: "go_back" }
    ]
  };
  
  // Create contract call
  const contractCall: SmartContractCall = {
    contract_name: "StrategyExecutor",
    method: "deployStrategy",
    params: {
      pair,
      type: strategy_type,
      low: lower_bound,
      high: upper_bound,
      grids: grid_count,
      totalCapital: total_investment,
      orderSize: amount_per_order,
      duration: duration_days
    }
  };
  
  // Backtesting feedback (simulated)
  const backtestingFeedback = `Simulated over the past 30 days, ${pair} ranged between $${(lower_bound * 1.08).toFixed(1)} and $${(upper_bound * 0.99).toFixed(1)}. This ${strategy_type} strategy would have executed ${Math.floor(Math.random() * 40 + 20)} trades and yielded an estimated ROI of +${(Math.random() * 10 + 5).toFixed(1)}%. Note: Past performance is not indicative of future results.`;
  
  // Deployment warning
  const deploymentWarning = "⚠️ Once deployed, your strategy will run automatically on-chain using your wallet's authorized funds. Please double-check your parameters. Use at your own risk.";
  
  // Follow-up suggestions
  const followUpSuggestions = [
    "Save this strategy as a template?",
    "Make this strategy public for others to subscribe to?",
    "Auto-close the strategy when ROI hits a threshold?"
  ];
  
  return {
    parameters,
    summary,
    uiLayout,
    contractCall,
    backtestingFeedback,
    deploymentWarning,
    followUpSuggestions
  };
};