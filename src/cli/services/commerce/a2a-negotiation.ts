/**
 * A2A (Agent-to-Agent) Negotiation Protocol
 *
 * Enables AI buyer agents to negotiate prices with seller agents.
 * Implements structured negotiation protocol with constraints and rules.
 */

import { createClient } from '@supabase/supabase-js';
import { ConfigManager } from '../../utils/config-manager.js';
import Anthropic from '@anthropic-ai/sdk';

export interface NegotiationSession {
  id: string;
  buyerAgentId: string;
  sellerAgentId: string;
  productId: string;
  sku: string;
  status: 'active' | 'accepted' | 'rejected' | 'expired';
  startedAt: string;
  completedAt?: string;
  finalPrice?: number;
}

export interface NegotiationOffer {
  id: string;
  sessionId: string;
  agentId: string;
  agentType: 'buyer' | 'seller';
  offerPrice: number;
  message: string;
  constraints?: NegotiationConstraints;
  timestamp: string;
}

export interface NegotiationConstraints {
  minPrice?: number;
  maxPrice?: number;
  quantity?: number;
  paymentTerms?: string;
  deliveryDate?: string;
  bundleDiscount?: number;
}

export interface NegotiationRules {
  minPriceFloor: number;
  maxIterations: number;
  timeoutMinutes: number;
  allowCounterOffers: boolean;
  requireJustification: boolean;
}

export interface TestNegotiationOptions {
  agentId: string;
  targetSku: string;
  startingBid?: number;
  maxBid?: number;
  quantity?: number;
}

export interface TestNegotiationResult {
  session: NegotiationSession;
  offers: NegotiationOffer[];
  outcome: 'accepted' | 'rejected' | 'timeout';
  finalPrice?: number;
  iterations: number;
  duration: number;
  savings?: number;
}

export class A2ANegotiationService {
  private supabase;
  private workspaceId: string;
  private anthropic: Anthropic;

  constructor() {
    const config = ConfigManager.getInstance();
    this.workspaceId = config.getWorkspaceId();

    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async testNegotiation(options: TestNegotiationOptions): Promise<TestNegotiationResult> {
    console.log(`[A2A] Starting negotiation test: ${options.agentId} → ${options.targetSku}`);

    const startTime = Date.now();

    // Step 1: Get product and current price
    const product = await this.getProduct(options.targetSku);
    if (!product) {
      throw new Error(`Product not found: ${options.targetSku}`);
    }

    // Step 2: Create negotiation session
    const session = await this.createSession(options.agentId, product);

    // Step 3: Define negotiation rules
    const rules: NegotiationRules = {
      minPriceFloor: product.price * 0.7, // 30% max discount
      maxIterations: 5,
      timeoutMinutes: 10,
      allowCounterOffers: true,
      requireJustification: true,
    };

    // Step 4: Run negotiation loop
    const offers: NegotiationOffer[] = [];
    let currentPrice = product.price;
    let outcome: 'accepted' | 'rejected' | 'timeout' = 'rejected';
    let iterations = 0;

    // Initial buyer offer
    const buyerStartingBid = options.startingBid || product.price * 0.85;
    const buyerMaxBid = options.maxBid || product.price * 0.95;

    let buyerOffer = await this.generateBuyerOffer(
      session.id,
      options.agentId,
      product,
      buyerStartingBid,
      options.quantity
    );
    offers.push(buyerOffer);
    iterations++;

    console.log(`[A2A] Buyer offers: $${buyerOffer.offerPrice} (${((buyerOffer.offerPrice / product.price - 1) * 100).toFixed(1)}%)`);

    // Negotiation loop
    while (iterations < rules.maxIterations) {
      // Seller response
      const sellerResponse = await this.generateSellerResponse(
        session.id,
        product,
        buyerOffer,
        rules
      );
      offers.push(sellerResponse);
      iterations++;

      console.log(`[A2A] Seller counters: $${sellerResponse.offerPrice} (${((sellerResponse.offerPrice / product.price - 1) * 100).toFixed(1)}%)`);

      // Check if offer accepted
      if (this.isOfferAcceptable(sellerResponse.offerPrice, buyerMaxBid)) {
        currentPrice = sellerResponse.offerPrice;
        outcome = 'accepted';
        console.log(`[A2A] ✓ Deal accepted at $${currentPrice}`);
        break;
      }

      // Buyer counter-offer
      const buyerCounter = await this.generateBuyerCounterOffer(
        session.id,
        options.agentId,
        product,
        sellerResponse,
        buyerMaxBid
      );
      offers.push(buyerCounter);
      iterations++;

      console.log(`[A2A] Buyer counters: $${buyerCounter.offerPrice} (${((buyerCounter.offerPrice / product.price - 1) * 100).toFixed(1)}%)`);

      // Check if seller accepts
      if (this.isOfferAcceptable(buyerCounter.offerPrice, sellerResponse.offerPrice)) {
        currentPrice = buyerCounter.offerPrice;
        outcome = 'accepted';
        console.log(`[A2A] ✓ Deal accepted at $${currentPrice}`);
        break;
      }
    }

    // Step 5: Complete session
    await this.completeSession(session.id, outcome, currentPrice);

    // Step 6: Store offers
    for (const offer of offers) {
      await this.storeOffer(offer);
    }

    const duration = Date.now() - startTime;
    const savings = outcome === 'accepted' ? product.price - currentPrice : 0;

    const result: TestNegotiationResult = {
      session: { ...session, status: outcome, completedAt: new Date().toISOString(), finalPrice: currentPrice },
      offers,
      outcome,
      finalPrice: outcome === 'accepted' ? currentPrice : undefined,
      iterations,
      duration,
      savings: savings > 0 ? savings : undefined,
    };

    console.log(`[A2A] Negotiation ${outcome} after ${iterations} iterations (${duration}ms)`);
    if (savings > 0) {
      console.log(`[A2A] Savings: $${savings.toFixed(2)} (${((savings / product.price) * 100).toFixed(1)}%)`);
    }

    return result;
  }

  private async getProduct(sku: string): Promise<any> {
    const { data } = await this.supabase
      .from('shopify_products')
      .select('*')
      .eq('workspace_id', this.workspaceId)
      .eq('sku', sku)
      .limit(1);

    if (!data || data.length === 0) return null;

    return {
      id: data[0].shopify_product_id,
      sku: data[0].sku,
      title: data[0].title,
      price: data[0].price,
      currency: data[0].currency,
      inventory: data[0].inventory,
    };
  }

  private async createSession(buyerAgentId: string, product: any): Promise<NegotiationSession> {
    const session: NegotiationSession = {
      id: `session-${Date.now()}`,
      buyerAgentId,
      sellerAgentId: 'synthex-seller-agent',
      productId: product.id,
      sku: product.sku,
      status: 'active',
      startedAt: new Date().toISOString(),
    };

    return session;
  }

  private async generateBuyerOffer(
    sessionId: string,
    agentId: string,
    product: any,
    offerPrice: number,
    quantity?: number
  ): Promise<NegotiationOffer> {
    // Generate buyer offer with AI justification
    const message = await this.generateOfferMessage('buyer', product, offerPrice, quantity);

    return {
      id: `offer-${Date.now()}-buyer`,
      sessionId,
      agentId,
      agentType: 'buyer',
      offerPrice,
      message,
      constraints: {
        maxPrice: product.price * 0.95,
        quantity: quantity || 1,
      },
      timestamp: new Date().toISOString(),
    };
  }

  private async generateSellerResponse(
    sessionId: string,
    product: any,
    buyerOffer: NegotiationOffer,
    rules: NegotiationRules
  ): Promise<NegotiationOffer> {
    // Seller counter-offer strategy
    const minAcceptable = Math.max(rules.minPriceFloor, product.price * 0.75);
    const targetPrice = product.price * 0.9; // Seller aims for 10% discount

    let counterPrice: number;
    if (buyerOffer.offerPrice >= targetPrice) {
      // Accept if close to target
      counterPrice = buyerOffer.offerPrice;
    } else if (buyerOffer.offerPrice < minAcceptable) {
      // Counter with minimum acceptable
      counterPrice = minAcceptable + (targetPrice - minAcceptable) * 0.5;
    } else {
      // Meet halfway
      counterPrice = (buyerOffer.offerPrice + targetPrice) / 2;
    }

    const message = await this.generateOfferMessage('seller', product, counterPrice);

    return {
      id: `offer-${Date.now()}-seller`,
      sessionId,
      agentId: 'synthex-seller-agent',
      agentType: 'seller',
      offerPrice: parseFloat(counterPrice.toFixed(2)),
      message,
      constraints: {
        minPrice: rules.minPriceFloor,
      },
      timestamp: new Date().toISOString(),
    };
  }

  private async generateBuyerCounterOffer(
    sessionId: string,
    agentId: string,
    product: any,
    sellerOffer: NegotiationOffer,
    maxBid: number
  ): Promise<NegotiationOffer> {
    // Buyer counter-offer strategy: increase bid gradually
    const currentBid = sellerOffer.offerPrice;
    const gap = maxBid - currentBid;
    const newBid = Math.min(currentBid + gap * 0.5, maxBid);

    const message = await this.generateOfferMessage('buyer', product, newBid);

    return {
      id: `offer-${Date.now()}-buyer-counter`,
      sessionId,
      agentId,
      agentType: 'buyer',
      offerPrice: parseFloat(newBid.toFixed(2)),
      message,
      timestamp: new Date().toISOString(),
    };
  }

  private async generateOfferMessage(
    agentType: 'buyer' | 'seller',
    product: any,
    offerPrice: number,
    quantity?: number
  ): Promise<string> {
    // Generate AI-powered negotiation message
    const systemPrompt =
      agentType === 'buyer'
        ? `You are a professional buyer agent negotiating price. Be polite but firm. Provide brief business justification for your offer.`
        : `You are a professional seller agent. Be accommodating but protect margins. Explain value proposition briefly.`;

    const userPrompt =
      agentType === 'buyer'
        ? `Generate a brief (1-2 sentences) negotiation message for offering $${offerPrice} for ${product.title} (list price: $${product.price})${quantity ? ` for quantity ${quantity}` : ''}.`
        : `Generate a brief (1-2 sentences) counter-offer message for $${offerPrice} for ${product.title}.`;

    const message = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 150,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') return 'Price offer as stated.';

    return content.text.trim();
  }

  private isOfferAcceptable(offer: number, threshold: number): boolean {
    // Accept if within 2% of threshold
    return Math.abs(offer - threshold) / threshold <= 0.02;
  }

  private async completeSession(
    sessionId: string,
    outcome: 'accepted' | 'rejected' | 'timeout',
    finalPrice?: number
  ): Promise<void> {
    // Mark session as complete
    console.log(`[A2A] Session ${sessionId} completed with outcome: ${outcome}`);
  }

  private async storeOffer(offer: NegotiationOffer): Promise<void> {
    const record = {
      id: offer.id,
      workspace_id: this.workspaceId,
      session_id: offer.sessionId,
      agent_id: offer.agentId,
      agent_type: offer.agentType,
      offer_price: offer.offerPrice,
      message: offer.message,
      constraints: offer.constraints,
      timestamp: offer.timestamp,
    };

    await this.supabase.from('a2a_offers').insert(record);
  }

  async getSessions(limit: number = 20): Promise<NegotiationSession[]> {
    const { data } = await this.supabase
      .from('a2a_sessions')
      .select('*')
      .eq('workspace_id', this.workspaceId)
      .order('started_at', { ascending: false })
      .limit(limit);

    return data || [];
  }

  async getSessionOffers(sessionId: string): Promise<NegotiationOffer[]> {
    const { data } = await this.supabase
      .from('a2a_offers')
      .select('*')
      .eq('workspace_id', this.workspaceId)
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true });

    return data || [];
  }
}
