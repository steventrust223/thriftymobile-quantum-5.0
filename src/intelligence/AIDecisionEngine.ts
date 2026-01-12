/**
 * AI Decision Engine - Uses Claude to make intelligent deal decisions
 */

import { Deal, DealVerdict } from '../types/Deal';
import { ClaudeAPI } from './ClaudeAPI';
import { Config } from '../main/Config';
import { ProfitEngine } from '../calculations/ProfitEngine';

export class AIDecisionEngine {
  /**
   * Analyze a single deal with AI
   */
  public static analyzeDeal(deal: Deal): Deal {
    const config = Config.getAutomationConfig();

    if (!config.enableAI) {
      Logger.log('AI analysis disabled in settings');
      return this.applyRuleBasedAnalysis(deal);
    }

    try {
      const dealContext = this.prepareDealContext(deal);
      const aiResponse = ClaudeAPI.analyzeDeal(dealContext);

      // Update deal with AI analysis
      deal.aiAnalysis = {
        verdict: this.parseVerdict(aiResponse.verdict),
        confidenceScore: aiResponse.confidenceScore / 100,
        riskScore: aiResponse.riskScore,
        marketAdvantageScore: aiResponse.marketAdvantageScore,
        salesVelocityScore: aiResponse.salesVelocityScore,
        suggestedMessage: aiResponse.suggestedMessage || this.generateFallbackMessage(deal),
        negotiationStrategy: aiResponse.negotiationStrategy || 'Standard approach',
        notes: aiResponse.notes || [],
        redFlags: aiResponse.redFlags || []
      };

      // Enrich with profit score
      const profitScore = ProfitEngine.calculateDealScore(
        deal.pricing,
        {
          dataQuality: deal.confidenceLevel,
          sellerRating: deal.seller.rating
        }
      );

      deal.aiAnalysis.confidenceScore = Math.max(
        deal.aiAnalysis.confidenceScore,
        profitScore / 100
      );

      return deal;
    } catch (error) {
      Logger.log(`Error in AI analysis: ${error}`);
      return this.applyRuleBasedAnalysis(deal);
    }
  }

  /**
   * Prepare deal context for AI
   */
  private static prepareDealContext(deal: Deal): any {
    return {
      id: deal.id,
      model: `${deal.device.brand} ${deal.device.model}`,
      storage: deal.device.storage,
      carrier: deal.device.carrier,
      condition: deal.device.condition,
      askingPrice: deal.pricing.askingPrice,
      partnerBuybackPrice: deal.pricing.partnerBuybackPrice,
      totalDeductions: deal.pricing.totalDeductions,
      maxAllowableOffer: deal.pricing.maxAllowableOffer,
      profitDollar: deal.pricing.profitDollar,
      profitPercent: deal.pricing.profitPercent,
      platform: deal.platform,
      title: deal.title,
      description: deal.description.substring(0, 500),
      location: deal.seller.location,
      issues: deal.device.issues,
      dataQuality: deal.dataQuality,
      isHotSeller: deal.seller.isHotSeller
    };
  }

  /**
   * Parse verdict string to enum
   */
  private static parseVerdict(verdict: string): DealVerdict {
    const normalized = verdict.toUpperCase().replace(/\s/g, '_');

    switch (normalized) {
      case 'STRONG_BUY':
        return DealVerdict.STRONG_BUY;
      case 'BUY':
        return DealVerdict.BUY;
      case 'NEGOTIATE':
        return DealVerdict.NEGOTIATE;
      case 'WATCH':
        return DealVerdict.WATCH;
      case 'PASS':
        return DealVerdict.PASS;
      default:
        return DealVerdict.NEGOTIATE;
    }
  }

  /**
   * Apply rule-based analysis (fallback when AI is disabled)
   */
  private static applyRuleBasedAnalysis(deal: Deal): Deal {
    const pricing = deal.pricing;
    let verdict: DealVerdict;
    let confidenceScore = 0.5;
    const notes: string[] = [];
    const redFlags: string[] = [];

    // Rule-based decision logic
    if (!pricing.isProfitable) {
      verdict = DealVerdict.PASS;
      notes.push('Not profitable at current asking price');
    } else if (pricing.profitTier === 'exceptional') {
      verdict = DealVerdict.STRONG_BUY;
      confidenceScore = 0.9;
      notes.push('Exceptional profit margin detected');
    } else if (pricing.profitTier === 'high' && pricing.askingPrice <= pricing.maxAllowableOffer) {
      verdict = DealVerdict.BUY;
      confidenceScore = 0.8;
      notes.push('Strong deal with good profit margin');
    } else if (pricing.askingPrice <= pricing.maxAllowableOffer * 1.2) {
      verdict = DealVerdict.NEGOTIATE;
      confidenceScore = 0.6;
      notes.push('Good potential with negotiation');
    } else if (pricing.askingPrice <= pricing.maxAllowableOffer * 1.5) {
      verdict = DealVerdict.WATCH;
      confidenceScore = 0.4;
      notes.push('Watch for price drops');
    } else {
      verdict = DealVerdict.PASS;
      confidenceScore = 0.3;
      notes.push('Asking price too high');
    }

    // Check for red flags
    if (deal.device.isBlacklisted) {
      redFlags.push('Device is blacklisted');
      verdict = DealVerdict.PASS;
    }
    if (deal.device.iCloudLocked) {
      redFlags.push('iCloud activation locked');
      verdict = DealVerdict.PASS;
    }
    if (deal.dataQuality === 'low') {
      redFlags.push('Low data quality - missing information');
      confidenceScore *= 0.8;
    }

    deal.aiAnalysis = {
      verdict,
      confidenceScore,
      riskScore: redFlags.length * 2,
      marketAdvantageScore: 5,
      salesVelocityScore: 5,
      suggestedMessage: this.generateFallbackMessage(deal),
      negotiationStrategy: ProfitEngine.getNegotiationStrategy(pricing).strategy,
      notes,
      redFlags
    };

    return deal;
  }

  /**
   * Generate fallback message when AI is unavailable
   */
  private static generateFallbackMessage(deal: Deal): string {
    const model = `${deal.device.brand} ${deal.device.model}`;
    const offer = deal.pricing.suggestedOffer;

    return `Hi! I'm interested in your ${model}. Would you consider $${offer}? I can meet today with cash. Thanks!`;
  }

  /**
   * Batch analyze multiple deals
   */
  public static analyzeMultipleDeals(deals: Deal[]): Deal[] {
    Logger.log(`Starting AI analysis for ${deals.length} deals...`);

    const analyzed: Deal[] = [];

    for (let i = 0; i < deals.length; i++) {
      const deal = deals[i];
      Logger.log(`Analyzing deal ${i + 1}/${deals.length}: ${deal.id}`);

      const analyzedDeal = this.analyzeDeal(deal);
      analyzed.push(analyzedDeal);

      // Rate limiting
      if (i < deals.length - 1) {
        Utilities.sleep(1000);
      }
    }

    Logger.log('AI analysis complete!');
    return analyzed;
  }

  /**
   * Re-analyze deals based on new market conditions
   */
  public static reanalyzeDeals(filter?: (deal: Deal) => boolean): void {
    // TODO: Implement reading from Master Database
    Logger.log('Re-analysis functionality to be implemented');
  }

  /**
   * Generate AI insights summary
   */
  public static generateInsightsSummary(deals: Deal[]): string {
    const strongBuys = deals.filter(d => d.aiAnalysis.verdict === DealVerdict.STRONG_BUY).length;
    const buys = deals.filter(d => d.aiAnalysis.verdict === DealVerdict.BUY).length;
    const negotiate = deals.filter(d => d.aiAnalysis.verdict === DealVerdict.NEGOTIATE).length;
    const watch = deals.filter(d => d.aiAnalysis.verdict === DealVerdict.WATCH).length;
    const pass = deals.filter(d => d.aiAnalysis.verdict === DealVerdict.PASS).length;

    const avgConfidence = deals.reduce((sum, d) => sum + d.aiAnalysis.confidenceScore, 0) / deals.length;
    const avgRisk = deals.reduce((sum, d) => sum + d.aiAnalysis.riskScore, 0) / deals.length;

    return `
AI Analysis Summary (${deals.length} deals):

📊 Verdict Distribution:
   🔥 STRONG BUY: ${strongBuys}
   ✅ BUY: ${buys}
   💬 NEGOTIATE: ${negotiate}
   👀 WATCH: ${watch}
   ❌ PASS: ${pass}

📈 Average Metrics:
   Confidence: ${(avgConfidence * 100).toFixed(1)}%
   Risk Score: ${avgRisk.toFixed(1)}/10

🎯 Actionable Deals: ${strongBuys + buys}
    `.trim();
  }
}
