export type StrategyType = 'grid' | 'dca' | 'ma_cross' | 'rsi' | 'momentum';

export interface StrategyParameters {
  strategy_name: string;
  strategy_type: StrategyType;
  pair: string;
  lower_bound?: number;
  upper_bound?: number;
  grid_count?: number;
  total_investment: number;
  amount_per_order?: number;
  token_invested: string;
  duration_days: number;
  risk_level: 'low' | 'medium' | 'high';
  deploy_to_chain: boolean;
}

export interface StrategyUISection {
  title: string;
  value: string;
}

export interface StrategyUIAction {
  label: string;
  action: string;
}

export interface StrategyUILayout {
  page_title: string;
  sections: StrategyUISection[];
  actions: StrategyUIAction[];
}

export interface SmartContractCall {
  contract_name: string;
  method: string;
  params: Record<string, any>;
}

export interface StrategyResult {
  id?: string;
  parameters: StrategyParameters;
  summary: string;
  uiLayout: StrategyUILayout;
  contractCall: SmartContractCall;
  backtestingFeedback?: string;
  deploymentWarning: string;
  followUpSuggestions: string[];
  status?: 'draft' | 'active' | 'paused' | 'stopped';
  deployedAt?: Date;
  txHash?: string;
  performance?: StrategyPerformance;
  isPublished?: boolean;
  publishedAt?: Date;
  subscribers?: number;
  creator?: string;
}

export interface StrategyPerformance {
  roi: number;
  tradeCount: number;
  totalVolume: number;
  winRate: number;
  currentValue: number;
  pnl: number;
  lastUpdated: Date;
}

export interface TradeHistory {
  id: string;
  timestamp: Date;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  txHash: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface UserProfile {
  walletAddress: string;
  totalStrategies: number;
  activeStrategies: number;
  totalReturns: number;
  totalVolume: number;
  joinedAt: Date;
  lastActive: Date;
}

export interface WalletConnection {
  isConnected: boolean;
  address: string | null;
  chainId?: number;
  balance?: number;
}