/**
 * Google Sheets structure definitions
 */

export enum SheetName {
  // Import Sheets
  IMPORT_HUB = 'Import Hub',
  FACEBOOK_IMPORT = 'Facebook Import',
  OFFERUP_IMPORT = 'OfferUp Import',
  CRAIGSLIST_IMPORT = 'Craigslist Import',
  EBAY_IMPORT = 'eBay Import',

  // Core Processing Sheets
  MASTER_DATABASE = 'Master Database',
  PRICING_ENGINE = 'Pricing Engine',
  BUYBACK_MATRIX = 'Buyback Matrix',

  // Decision Sheets
  VERDICT_SHEET = 'Verdict Sheet',
  HOT_DEALS = 'Hot Deals',

  // Analytics
  DASHBOARD = 'Dashboard',
  ANALYTICS = 'Analytics',

  // Configuration
  SETTINGS = 'Settings',
  DEDUCTION_RULES = 'Deduction Rules',

  // CRM & Tracking
  SELLER_CRM = 'Seller CRM',
  DEAL_PIPELINE = 'Deal Pipeline',

  // Logs
  SYSTEM_LOG = 'System Log',
  ERROR_LOG = 'Error Log'
}

export interface SheetColumn {
  name: string;
  width?: number;
  formula?: string;
  format?: string;
  validation?: any;
}

export interface SheetSchema {
  name: SheetName;
  columns: SheetColumn[];
  frozenRows?: number;
  frozenColumns?: number;
  conditionalFormatting?: any[];
  protected?: boolean;
}

// Master Database Schema
export const MASTER_DATABASE_COLUMNS: SheetColumn[] = [
  { name: 'ID', width: 100 },
  { name: 'Timestamp', width: 140 },
  { name: 'Platform', width: 120 },
  { name: 'Status', width: 120 },

  // Raw Data
  { name: 'Title', width: 300 },
  { name: 'Description', width: 400 },
  { name: 'Asking Price', width: 100, format: '$#,##0.00' },
  { name: 'Listing URL', width: 200 },

  // Parsed Device Info
  { name: 'Brand', width: 100 },
  { name: 'Model', width: 150 },
  { name: 'Storage', width: 80 },
  { name: 'Color', width: 100 },
  { name: 'Carrier', width: 120 },
  { name: 'Condition', width: 120 },

  // Seller Info
  { name: 'Seller Name', width: 150 },
  { name: 'Location', width: 150 },
  { name: 'ZIP', width: 80 },
  { name: 'Hot Seller?', width: 100 },

  // Grading & Issues
  { name: 'Estimated Grade', width: 100 },
  { name: 'Issues Detected', width: 300 },
  { name: 'Total Deductions', width: 120, format: '$#,##0.00' },
  { name: 'Auto-Reject?', width: 100 },

  // Pricing
  { name: 'Partner Buyback Price', width: 140, format: '$#,##0.00' },
  { name: 'MAO', width: 100, format: '$#,##0.00' },
  { name: 'Suggested Offer', width: 120, format: '$#,##0.00' },
  { name: 'Profit $', width: 100, format: '$#,##0.00' },
  { name: 'Profit %', width: 100, format: '0.0%' },

  // AI Analysis
  { name: 'Verdict', width: 130 },
  { name: 'Confidence Score', width: 120, format: '0.0%' },
  { name: 'Risk Score', width: 100, format: '0.0' },
  { name: 'Market Advantage', width: 120, format: '0.0' },
  { name: 'Sales Velocity', width: 120, format: '0.0' },
  { name: 'AI Notes', width: 400 },
  { name: 'Suggested Message', width: 400 },

  // Tracking
  { name: 'Assigned To', width: 120 },
  { name: 'Last Contacted', width: 140 },
  { name: 'Notes', width: 300 },
  { name: 'Data Quality', width: 100 }
];

// Verdict Sheet Schema (filtered, ranked view)
export const VERDICT_SHEET_COLUMNS: SheetColumn[] = [
  { name: 'Rank', width: 60 },
  { name: 'Verdict', width: 130 },
  { name: 'Platform', width: 120 },
  { name: 'Model', width: 150 },
  { name: 'Asking Price', width: 100, format: '$#,##0.00' },
  { name: 'Suggested Offer', width: 120, format: '$#,##0.00' },
  { name: 'Profit $', width: 100, format: '$#,##0.00' },
  { name: 'Profit %', width: 100, format: '0.0%' },
  { name: 'Grade', width: 80 },
  { name: 'Location', width: 150 },
  { name: 'Hot Seller?', width: 100 },
  { name: 'Confidence', width: 100, format: '0.0%' },
  { name: 'Status', width: 120 },
  { name: 'URL', width: 200 },
  { name: 'ID', width: 100 }
];

// Buyback Matrix Schema (partner pricing)
export const BUYBACK_MATRIX_COLUMNS: SheetColumn[] = [
  { name: 'Brand', width: 100 },
  { name: 'Model', width: 150 },
  { name: 'Storage', width: 80 },
  { name: 'Grade A', width: 100, format: '$#,##0.00' },
  { name: 'Grade B+', width: 100, format: '$#,##0.00' },
  { name: 'Grade B', width: 100, format: '$#,##0.00' },
  { name: 'Grade C', width: 100, format: '$#,##0.00' },
  { name: 'Grade D', width: 100, format: '$#,##0.00' },
  { name: 'Last Updated', width: 140 },
  { name: 'Partner', width: 120 }
];

// Settings Schema
export const SETTINGS_COLUMNS: SheetColumn[] = [
  { name: 'Setting', width: 250 },
  { name: 'Value', width: 300 },
  { name: 'Description', width: 400 },
  { name: 'Type', width: 100 }
];

export const DEFAULT_SETTINGS = [
  ['MIN_PROFIT_PERCENT', '25', 'Minimum profit % to consider a deal', 'number'],
  ['TARGET_PROFIT_PERCENT', '50', 'Target profit % for good deals', 'number'],
  ['EXCEPTIONAL_PROFIT_PERCENT', '100', 'Exceptional deal profit threshold', 'number'],
  ['CLAUDE_API_KEY', '', 'Anthropic Claude API key', 'secret'],
  ['SMSIT_API_KEY', '', 'SMS-iT CRM API key', 'secret'],
  ['ONEHASH_API_KEY', '', 'OneHash CRM API key', 'secret'],
  ['AUTO_CONTACT_THRESHOLD', '75', 'Auto-contact deals above this confidence %', 'number'],
  ['MAX_RADIUS_MILES', '50', 'Maximum distance to travel for deals', 'number'],
  ['AUTO_REJECT_BLACKLISTED', 'TRUE', 'Auto-reject blacklisted devices', 'boolean'],
  ['AUTO_REJECT_ICLOUD_LOCKED', 'TRUE', 'Auto-reject iCloud locked devices', 'boolean'],
  ['ENABLE_AI_ANALYSIS', 'TRUE', 'Enable AI-powered deal analysis', 'boolean'],
  ['ENABLE_AUTO_MESSAGING', 'FALSE', 'Enable automatic seller contact', 'boolean'],
  ['DATA_RETENTION_DAYS', '90', 'Days to keep old deals in database', 'number']
];
