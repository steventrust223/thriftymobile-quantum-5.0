/**
 * Profit Engine - Calculates profitability and maximum allowable offers
 */

import { Config } from '../main/Config';

export interface ProfitCalculation {
  askingPrice: number;
  partnerBuybackPrice: number;
  totalDeductions: number;
  adjustedBuybackPrice: number;
  maxAllowableOffer: number;
  suggestedOffer: number;
  profitDollar: number;
  profitPercent: number;
  profitTier: 'low' | 'medium' | 'high' | 'exceptional';
  isProfitable: boolean;
  breakEvenPrice: number;
}

export class ProfitEngine {
  private static readonly NEGOTIATION_BUFFER = 0.85; // Offer 85% of asking price
  private static readonly MIN_PROFIT_MARGIN = 0.25; // 25% minimum
  private static readonly TRANSACTION_COSTS = 10; // Gas, time, etc.

  /**
   * Calculate profit metrics for a deal
   */
  public static calculateProfit(
    askingPrice: number,
    partnerBuybackPrice: number,
    totalDeductions: number
  ): ProfitCalculation {
    // Adjust buyback price for deductions
    const adjustedBuybackPrice = Math.max(0, partnerBuybackPrice - totalDeductions);

    // Calculate maximum allowable offer (MAO)
    const thresholds = Config.getProfitThresholds();
    const minProfitPercent = thresholds.minimum / 100;

    const maxAllowableOffer = this.calculateMAO(adjustedBuybackPrice, minProfitPercent);

    // Calculate suggested offer (negotiate down from asking)
    const suggestedOffer = this.calculateSuggestedOffer(askingPrice, maxAllowableOffer);

    // Calculate profit at suggested offer price
    const profitDollar = adjustedBuybackPrice - suggestedOffer - this.TRANSACTION_COSTS;
    const profitPercent = suggestedOffer > 0 ? profitDollar / suggestedOffer : 0;

    // Determine profit tier
    const profitTier = this.determineProfitTier(profitPercent);

    // Check if profitable
    const isProfitable = profitDollar > 0 && profitPercent >= minProfitPercent;

    // Calculate break-even price
    const breakEvenPrice = adjustedBuybackPrice - this.TRANSACTION_COSTS;

    return {
      askingPrice,
      partnerBuybackPrice,
      totalDeductions,
      adjustedBuybackPrice,
      maxAllowableOffer,
      suggestedOffer,
      profitDollar,
      profitPercent,
      profitTier,
      isProfitable,
      breakEvenPrice
    };
  }

  /**
   * Calculate Maximum Allowable Offer (MAO)
   */
  private static calculateMAO(buybackPrice: number, minProfitMargin: number): number {
    // MAO = Buyback Price / (1 + Min Profit Margin) - Transaction Costs
    const mao = (buybackPrice / (1 + minProfitMargin)) - this.TRANSACTION_COSTS;
    return Math.max(0, Math.floor(mao));
  }

  /**
   * Calculate suggested offer based on asking price and MAO
   */
  private static calculateSuggestedOffer(askingPrice: number, mao: number): number {
    // Start with negotiation buffer (85% of asking)
    let offer = askingPrice * this.NEGOTIATION_BUFFER;

    // Cap at MAO
    offer = Math.min(offer, mao);

    // Round to nearest $5
    offer = Math.floor(offer / 5) * 5;

    return Math.max(0, offer);
  }

  /**
   * Determine profit tier
   */
  private static determineProfitTier(profitPercent: number): 'low' | 'medium' | 'high' | 'exceptional' {
    const thresholds = Config.getProfitThresholds();

    if (profitPercent >= (thresholds.exceptional / 100)) return 'exceptional';
    if (profitPercent >= (thresholds.target / 100)) return 'high';
    if (profitPercent >= (thresholds.minimum / 100)) return 'medium';
    return 'low';
  }

  /**
   * Calculate negotiation strategy
   */
  public static getNegotiationStrategy(calc: ProfitCalculation): {
    strategy: string;
    openingOffer: number;
    walkAwayPrice: number;
    idealPrice: number;
  } {
    const margin = calc.maxAllowableOffer - calc.suggestedOffer;
    const openingOffer = Math.max(calc.suggestedOffer - 50, calc.suggestedOffer * 0.85);

    return {
      strategy: this.determineStrategy(calc),
      openingOffer: Math.floor(openingOffer / 5) * 5,
      walkAwayPrice: calc.maxAllowableOffer,
      idealPrice: calc.suggestedOffer
    };
  }

  /**
   * Determine negotiation strategy
   */
  private static determineStrategy(calc: ProfitCalculation): string {
    if (!calc.isProfitable) {
      return 'PASS - Not profitable at asking price';
    }

    if (calc.profitTier === 'exceptional') {
      return 'STRONG BUY - Exceptional profit margin, move fast';
    }

    if (calc.profitTier === 'high') {
      return 'BUY - Strong profit margin, negotiate gently';
    }

    if (calc.askingPrice <= calc.suggestedOffer) {
      return 'BUY NOW - Asking price at or below target';
    }

    const askingVsMAO = calc.askingPrice / calc.maxAllowableOffer;

    if (askingVsMAO < 1.1) {
      return 'NEGOTIATE - Asking price close to MAO, negotiate down 10-15%';
    }

    if (askingVsMAO < 1.3) {
      return 'NEGOTIATE - Asking price high, negotiate down 20-30%';
    }

    return 'WATCH - Asking price too high, watch for price drops';
  }

  /**
   * Calculate deal score (0-100)
   */
  public static calculateDealScore(calc: ProfitCalculation, otherFactors: {
    dataQuality: number;
    sellerRating?: number;
    distanceMiles?: number;
  }): number {
    let score = 0;

    // Profit component (50 points max)
    if (calc.isProfitable) {
      score += Math.min(50, calc.profitPercent * 50);
    }

    // Price competitiveness (20 points max)
    const askingVsMAO = calc.askingPrice / calc.maxAllowableOffer;
    if (askingVsMAO <= 1.0) {
      score += 20;
    } else if (askingVsMAO <= 1.2) {
      score += 15;
    } else if (askingVsMAO <= 1.4) {
      score += 10;
    }

    // Data quality (15 points max)
    score += (otherFactors.dataQuality / 100) * 15;

    // Seller rating (10 points max)
    if (otherFactors.sellerRating) {
      score += (otherFactors.sellerRating / 5) * 10;
    }

    // Distance factor (5 points max)
    if (otherFactors.distanceMiles !== undefined) {
      const maxDistance = Config.getGeographicConfig().maxRadiusMiles;
      const distanceFactor = Math.max(0, 1 - (otherFactors.distanceMiles / maxDistance));
      score += distanceFactor * 5;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Format profit metrics for display
   */
  public static formatProfitMetrics(calc: ProfitCalculation): string {
    return `
💰 Profit Analysis:
   Asking: $${calc.askingPrice.toFixed(2)}
   Buyback: $${calc.adjustedBuybackPrice.toFixed(2)}
   MAO: $${calc.maxAllowableOffer.toFixed(2)}
   Suggested Offer: $${calc.suggestedOffer.toFixed(2)}

   Expected Profit: $${calc.profitDollar.toFixed(2)} (${(calc.profitPercent * 100).toFixed(1)}%)
   Tier: ${calc.profitTier.toUpperCase()}
   Status: ${calc.isProfitable ? '✅ PROFITABLE' : '❌ NOT PROFITABLE'}
    `.trim();
  }
}
