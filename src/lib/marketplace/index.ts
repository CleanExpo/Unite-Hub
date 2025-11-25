/**
 * Global Marketplace System Export Index
 *
 * Task marketplace with hybrid first-price weighted Vickrey auction model.
 * Agents bid on tasks based on capability, confidence, success rate, and load.
 */

export { taskMarketplaceEngine } from './taskMarketplaceEngine';
export type {
  MarketplaceTask,
  AgentBid,
  AuctionSession,
  BidResponse,
} from './taskMarketplaceEngine';

export { bidEvaluationModel } from './bidEvaluationModel';
export type {
  BidScoringInput,
  ScoringBreakdown,
  BidComparison,
} from './bidEvaluationModel';

export { auctionArchiveBridge } from './auctionArchiveBridge';
export type {
  AuctionArchiveEntry,
  MarketplacePattern,
  MarketplaceAnalytics,
} from './auctionArchiveBridge';
