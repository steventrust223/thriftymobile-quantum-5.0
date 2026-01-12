/**
 * Claude API Integration
 * Connects to Anthropic's Claude API for AI-powered analysis
 */

import { Config } from '../main/Config';

export interface ClaudeRequest {
  model: string;
  max_tokens: number;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  system?: string;
}

export interface ClaudeResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class ClaudeAPI {
  private static readonly API_URL = 'https://api.anthropic.com/v1/messages';
  private static readonly API_VERSION = '2023-06-01';
  private static readonly DEFAULT_TIMEOUT = 30000;

  /**
   * Send a request to Claude API
   */
  public static sendRequest(
    prompt: string,
    systemPrompt?: string,
    temperature = 1.0
  ): string | null {
    try {
      const config = Config.getClaudeConfig();

      if (!config.apiKey) {
        Logger.log('Error: Claude API key not configured');
        return null;
      }

      const payload: ClaudeRequest = {
        model: config.model,
        max_tokens: config.maxTokens,
        temperature,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      };

      if (systemPrompt) {
        payload.system = systemPrompt;
      }

      const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
        method: 'post',
        contentType: 'application/json',
        headers: {
          'x-api-key': config.apiKey,
          'anthropic-version': this.API_VERSION
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };

      const response = UrlFetchApp.fetch(this.API_URL, options);
      const responseCode = response.getResponseCode();

      if (responseCode !== 200) {
        Logger.log(`Claude API error: ${responseCode} - ${response.getContentText()}`);
        return null;
      }

      const responseData: ClaudeResponse = JSON.parse(response.getContentText());

      if (responseData.content && responseData.content.length > 0) {
        return responseData.content[0].text;
      }

      return null;
    } catch (error) {
      Logger.log(`Error calling Claude API: ${error}`);
      return null;
    }
  }

  /**
   * Analyze a deal using Claude
   */
  public static analyzeDeal(dealContext: any): any {
    const systemPrompt = `You are an expert phone buyback analyst helping to evaluate device acquisition opportunities.
Your role is to:
1. Assess deal quality and profitability
2. Identify potential risks and red flags
3. Suggest negotiation strategies
4. Recommend optimal action (BUY, NEGOTIATE, WATCH, PASS)

Respond in JSON format with the following structure:
{
  "verdict": "STRONG BUY" | "BUY" | "NEGOTIATE" | "WATCH" | "PASS",
  "confidenceScore": 0-100,
  "riskScore": 0-10,
  "marketAdvantageScore": 0-10,
  "salesVelocityScore": 0-10,
  "suggestedMessage": "text message to send seller",
  "negotiationStrategy": "negotiation approach",
  "notes": ["observation 1", "observation 2"],
  "redFlags": ["red flag 1", "red flag 2"]
}`;

    const prompt = this.buildDealAnalysisPrompt(dealContext);
    const response = this.sendRequest(prompt, systemPrompt, 0.7);

    if (!response) {
      return this.getDefaultAnalysis();
    }

    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      Logger.log('Could not parse Claude response as JSON');
      return this.getDefaultAnalysis();
    } catch (error) {
      Logger.log(`Error parsing Claude response: ${error}`);
      return this.getDefaultAnalysis();
    }
  }

  /**
   * Build deal analysis prompt
   */
  private static buildDealAnalysisPrompt(deal: any): string {
    return `Analyze this phone buyback deal:

DEVICE:
- Model: ${deal.model || 'Unknown'}
- Storage: ${deal.storage || 'Unknown'}
- Carrier: ${deal.carrier || 'Unknown'}
- Condition: ${deal.condition || 'Unknown'}

PRICING:
- Asking Price: $${deal.askingPrice || 0}
- Partner Buyback: $${deal.partnerBuybackPrice || 0}
- Deductions: $${deal.totalDeductions || 0}
- MAO: $${deal.maxAllowableOffer || 0}
- Expected Profit: $${deal.profitDollar || 0} (${deal.profitPercent ? (deal.profitPercent * 100).toFixed(1) : 0}%)

LISTING DETAILS:
- Platform: ${deal.platform || 'Unknown'}
- Title: ${deal.title || 'N/A'}
- Description: ${deal.description || 'N/A'}
- Location: ${deal.location || 'Unknown'}

DETECTED ISSUES:
${deal.issues?.length > 0 ? deal.issues.map((i: any) => `- ${i.type}: -$${i.deduction}`).join('\n') : '- None detected'}

Analyze this deal and provide your assessment.`;
  }

  /**
   * Generate seller message
   */
  public static generateSellerMessage(deal: any, offerAmount: number): string {
    const systemPrompt = `You are a professional phone buyer crafting friendly, conversational text messages to sellers.
Keep messages:
- Short (2-3 sentences max)
- Professional but casual
- Direct about interest and offer
- Respectful
Do not use emojis or special characters.`;

    const prompt = `Generate a text message to a seller about their ${deal.model || 'phone'} listed for $${deal.askingPrice || 0}.
You want to offer $${offerAmount}.
Location: ${deal.location || 'local area'}
Platform: ${deal.platform || 'marketplace'}

Write the message now:`;

    const response = this.sendRequest(prompt, systemPrompt, 0.9);

    if (!response) {
      return `Hi, I'm interested in your ${deal.model}. Would you consider $${offerAmount}? I can meet today with cash. Let me know, thanks!`;
    }

    return response.trim();
  }

  /**
   * Get default analysis when API fails
   */
  private static getDefaultAnalysis(): any {
    return {
      verdict: 'NEGOTIATE',
      confidenceScore: 50,
      riskScore: 5,
      marketAdvantageScore: 5,
      salesVelocityScore: 5,
      suggestedMessage: 'AI analysis unavailable',
      negotiationStrategy: 'Standard negotiation approach',
      notes: ['AI analysis unavailable - using fallback'],
      redFlags: []
    };
  }

  /**
   * Batch analyze multiple deals
   */
  public static batchAnalyze(deals: any[], maxBatchSize = 5): any[] {
    const results: any[] = [];

    for (let i = 0; i < deals.length; i += maxBatchSize) {
      const batch = deals.slice(i, i + maxBatchSize);

      for (const deal of batch) {
        const analysis = this.analyzeDeal(deal);
        results.push({ dealId: deal.id, analysis });

        // Rate limiting - wait 1 second between requests
        Utilities.sleep(1000);
      }
    }

    return results;
  }

  /**
   * Test API connection
   */
  public static testConnection(): boolean {
    const response = this.sendRequest('Reply with OK if you can read this.', undefined, 0);
    return response !== null && response.toLowerCase().includes('ok');
  }
}
