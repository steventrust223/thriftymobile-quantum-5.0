/**
 * Deal and listing type definitions
 */

import { Device, DeviceGrade } from './Device';

export enum Platform {
  FACEBOOK = 'Facebook Marketplace',
  OFFERUP = 'OfferUp',
  CRAIGSLIST = 'Craigslist',
  EBAY = 'eBay',
  MERCARI = 'Mercari',
  LETGO = '5miles/LetGo',
  OTHER = 'Other'
}

export enum DealVerdict {
  STRONG_BUY = 'STRONG BUY',
  BUY = 'BUY',
  NEGOTIATE = 'NEGOTIATE',
  WATCH = 'WATCH',
  PASS = 'PASS'
}

export enum DealStatus {
  NEW = 'New',
  CONTACTED = 'Contacted',
  NEGOTIATING = 'Negotiating',
  AGREED = 'Agreed',
  MEETING_SCHEDULED = 'Meeting Scheduled',
  PURCHASED = 'Purchased',
  PASSED = 'Passed',
  LOST = 'Lost'
}

export interface SellerInfo {
  name?: string;
  phone?: string;
  email?: string;
  location: string;
  zip?: string;
  responseTime?: string;
  isHotSeller?: boolean;
  previousDeals?: number;
  rating?: number;
}

export interface PricingData {
  askingPrice: number;
  estimatedResaleValue: number;
  partnerBuybackPrice: number;
  totalDeductions: number;
  maxAllowableOffer: number;
  suggestedOffer: number;
  profitDollar: number;
  profitPercent: number;
}

export interface AIAnalysis {
  verdict: DealVerdict;
  confidenceScore: number;
  riskScore: number;
  marketAdvantageScore: number;
  salesVelocityScore: number;
  suggestedMessage: string;
  negotiationStrategy: string;
  notes: string[];
  redFlags: string[];
}

export interface Deal {
  // Source Data
  id: string;
  timestamp: Date;
  platform: Platform;
  listingUrl: string;
  title: string;
  description: string;
  rawPrice: string;

  // Parsed Data
  device: Device;
  seller: SellerInfo;

  // Calculated Pricing
  pricing: PricingData;

  // AI Intelligence
  aiAnalysis: AIAnalysis;

  // Status & Tracking
  status: DealStatus;
  assignedTo?: string;
  lastContactedAt?: Date;
  notes?: string;

  // Quality Flags
  isProfitable: boolean;
  profitTier: 'low' | 'medium' | 'high' | 'exceptional';
  isUrgent: boolean;

  // Data Quality
  dataQuality: 'high' | 'medium' | 'low';
  missingFields: string[];
  confidenceLevel: number;
}

export interface ImportedListing {
  timestamp: string;
  platform: string;
  title: string;
  price: string;
  description: string;
  location: string;
  url: string;
  sellerName?: string;
  images?: string[];
  scrapedAt: Date;
}
