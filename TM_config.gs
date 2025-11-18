/**
 * ===== FILE: TM_config.gs =====
 * 📱💰 Thrifty Mobile Quantum 5.0 - Configuration & Constants
 *
 * This file contains all global constants, sheet names, headers,
 * thresholds, color schemes, and configuration objects.
 */

// =============================================================================
// SHEET NAMES
// =============================================================================

const TM_SHEETS = {
  // Import / Staging Sheets
  IMPORT_FB: 'IMPORT_FB',
  IMPORT_CL: 'IMPORT_CL',
  IMPORT_OU: 'IMPORT_OU',
  IMPORT_EBAY: 'IMPORT_EBAY',
  IMPORT_OTHER: 'IMPORT_OTHER',

  // Core System Sheets
  MASTER_DEVICE_DB: 'MASTER_DEVICE_DB',
  GRADING_ENGINE: 'GRADING_ENGINE',
  BUYBACK_MATCH: 'BUYBACK_MATCH',
  MAO_ENGINE: 'MAO_ENGINE',
  VERDICT: 'VERDICT',

  // Reference / Partner Sheets
  BUYBACK_PARTNER_PRICING: 'BUYBACK_PARTNER_PRICING',

  // Supporting Sheets
  LEADS_TRACKER: 'LEADS_TRACKER',
  CRM_INTEGRATION: 'CRM_INTEGRATION',
  SETTINGS: 'SETTINGS',
  SYSTEM_LOG: 'SYSTEM_LOG',
  DASHBOARD_ANALYTICS: 'DASHBOARD_ANALYTICS'
};

// List of all import sheets for iteration
const TM_IMPORT_SHEETS = [
  TM_SHEETS.IMPORT_FB,
  TM_SHEETS.IMPORT_CL,
  TM_SHEETS.IMPORT_OU,
  TM_SHEETS.IMPORT_EBAY,
  TM_SHEETS.IMPORT_OTHER
];

// =============================================================================
// COLUMN HEADERS
// =============================================================================

// Common headers for all IMPORT sheets
const TM_HEADERS_IMPORT = [
  'Timestamp',
  'Platform',
  'Listing URL',
  'Title',
  'Asking Price',
  'Location',
  'Device Type',
  'Brand',
  'Model',
  'Storage',
  'Carrier',
  'Condition (Raw)',
  'Description',
  'Images',
  'Seller Name',
  'Seller Contact',
  'Scrape Job Link',
  'Source Sheet',
  'Seller ZIP / Location'
];

// Headers for MASTER_DEVICE_DB
const TM_HEADERS_MASTER = [
  'ID',
  'Platform',
  'Listing URL',
  'Device Type',
  'Brand',
  'Model',
  'Variant',
  'Storage',
  'Carrier',
  'Condition (Raw)',
  'Condition (Normalized)',
  'Guessed Grade',
  'Manual Grade',
  'Final Grade',
  'Asking Price',
  'Estimated Resale Value',
  'Partner Base Price (Matched)',
  'Applied Deductions',
  'Matched Buyback Value',
  'MAO',
  'Offer Target',
  'Expected Profit',
  'Profit Margin %',
  'Risk Score',
  'Deal Class',
  'Hot Seller?',
  'Market Advantage Score',
  'Sales Velocity Score',
  'Location',
  'Seller ZIP',
  'Distance (mi)',
  'Location Risk',
  'Device Flags',
  'Auto Notes',
  'Lead Synced?',
  'CRM Status',
  'Last Updated',
  'Title',
  'Seller Name',
  'Seller Contact'
];

// Headers for VERDICT sheet
const TM_HEADERS_VERDICT = [
  'Rank',
  'Deal Score',
  'Title',
  'Platform',
  'Grade',
  'Asking Price',
  'Offer Target',
  'Matched Buyback Value',
  'Expected Profit',
  'Profit Margin %',
  'Deal Class',
  'Risk Score',
  'Hot Seller?',
  'Market Advantage',
  'Distance (mi)',
  'Action',
  'Seller Name',
  'Seller Contact',
  'Listing URL',
  'Auto Seller Message',
  'Notes',
  'Master ID'
];

// Headers for BUYBACK_PARTNER_PRICING
const TM_HEADERS_BUYBACK_PRICING = [
  'Brand',
  'Model',
  'Variant',
  'Storage',
  'Grade A',
  'Grade B+',
  'Grade B',
  'Grade C',
  'Grade D',
  'DOA',
  'Notes'
];

// Headers for LEADS_TRACKER
const TM_HEADERS_LEADS = [
  'Lead ID',
  'Seller Name',
  'Seller Contact',
  'Platform',
  'Total Deals',
  'Hot Seller?',
  'First Seen',
  'Last Contact',
  'Contact Method',
  'Status',
  'Notes',
  'CRM ID',
  'Last Updated'
];

// Headers for CRM_INTEGRATION
const TM_HEADERS_CRM = [
  'Sync ID',
  'Timestamp',
  'Action',
  'Record Type',
  'Local ID',
  'External ID',
  'Status',
  'Response',
  'Error',
  'Retry Count'
];

// Headers for SETTINGS
const TM_HEADERS_SETTINGS = [
  'Setting Name',
  'Value',
  'Description',
  'Category',
  'Last Updated'
];

// Headers for SYSTEM_LOG
const TM_HEADERS_LOG = [
  'Timestamp',
  'Type',
  'Source',
  'Message',
  'Details',
  'User'
];

// Headers for DASHBOARD_ANALYTICS
const TM_HEADERS_DASHBOARD = [
  'Metric',
  'Value',
  'Period',
  'Category',
  'Last Updated'
];

// Headers for GRADING_ENGINE
const TM_HEADERS_GRADING = [
  'Condition Keyword',
  'Maps To Grade',
  'Priority',
  'Category',
  'Notes'
];

// Headers for BUYBACK_MATCH (tracking matches)
const TM_HEADERS_BUYBACK_MATCH = [
  'Device ID',
  'Brand',
  'Model',
  'Storage',
  'Grade',
  'Partner Base Price',
  'Deductions Applied',
  'Deduction Details',
  'Final Buyback Value',
  'Match Confidence',
  'Match Notes',
  'Timestamp'
];

// Headers for MAO_ENGINE
const TM_HEADERS_MAO = [
  'Device ID',
  'Asking Price',
  'Matched Buyback Value',
  'Risk Score',
  'MAO',
  'Offer Target',
  'Expected Profit',
  'Profit Margin %',
  'Calculation Notes',
  'Timestamp'
];

// =============================================================================
// DEDUCTIONS & PRICING CONSTANTS
// =============================================================================

const TM_DEDUCTIONS = {
  CRACKED_BACK: 180,
  CRACKED_LENS: 90,
  CRICKET_CARRIER: 100,
  DEMO_DEVICE: 50,
  MISSING_STYLUS: 25,
  HEAVY_SCRATCHES: 30,
  BATTERY_HEALTH_LOW: 40,
  NO_FACE_ID: 100,
  NO_TOUCH_ID: 75
};

// Blacklist keywords - devices with these are rejected
const TM_BLACKLIST_KEYWORDS = [
  'icloud lock',
  'icloud locked',
  'activation lock',
  'frp lock',
  'blacklisted',
  'bad esn',
  'bad imei',
  'reported lost',
  'reported stolen',
  'mdm lock',
  'passcode lock',
  'disabled'
];

// =============================================================================
// GRADING MAPPINGS
// =============================================================================

// Map raw condition text to grades
const TM_CONDITION_TO_GRADE = {
  // Grade A mappings
  'like new': 'A',
  'mint': 'A',
  'brand new': 'A',
  'sealed': 'A',
  'new in box': 'A',
  'nib': 'A',
  'pristine': 'A',
  'flawless': 'A',

  // Grade B+ mappings
  'excellent': 'B+',
  'near mint': 'B+',
  'very good': 'B+',
  'great condition': 'B+',
  'almost new': 'B+',

  // Grade B mappings
  'good': 'B',
  'good condition': 'B',
  'minor wear': 'B',
  'light scratches': 'B',
  'normal wear': 'B',

  // Grade C mappings
  'fair': 'C',
  'acceptable': 'C',
  'moderate wear': 'C',
  'visible scratches': 'C',
  'cosmetic damage': 'C',
  'heavy wear': 'C',

  // Grade D mappings
  'poor': 'D',
  'rough': 'D',
  'well used': 'D',
  'heavily used': 'D',
  'damaged': 'D',

  // DOA mappings
  'broken': 'DOA',
  'for parts': 'DOA',
  'not working': 'DOA',
  'dead': 'DOA',
  'doa': 'DOA',
  'cracked screen': 'DOA',
  'shattered': 'DOA'
};

// Keywords that indicate specific issues (for deductions)
const TM_ISSUE_KEYWORDS = {
  CRACKED_BACK: ['cracked back', 'back cracked', 'back glass cracked', 'rear glass cracked', 'shattered back'],
  CRACKED_LENS: ['cracked lens', 'camera cracked', 'lens cracked', 'camera lens broken'],
  CRICKET: ['cricket', 'cricket wireless'],
  DEMO: ['demo', 'display model', 'store display', 'demo unit', 'demo mode'],
  MISSING_STYLUS: ['no stylus', 'missing stylus', 'stylus not included', 'no s pen', 'missing s pen'],
  HEAVY_SCRATCHES: ['deep scratches', 'heavy scratches', 'scratched badly'],
  BATTERY_LOW: ['battery health', 'battery low', 'poor battery', 'bad battery'],
  NO_FACE_ID: ['face id broken', 'no face id', 'face id not working'],
  NO_TOUCH_ID: ['touch id broken', 'no touch id', 'fingerprint not working']
};

// =============================================================================
// DEAL CLASSIFICATION THRESHOLDS
// =============================================================================

const TM_DEAL_THRESHOLDS = {
  // Profit margin thresholds (as decimals)
  HOT_DEAL_MARGIN: 0.35,      // 35% or higher
  SOLID_DEAL_MARGIN: 0.20,    // 20-35%
  MARGINAL_DEAL_MARGIN: 0.10, // 10-20%
  // Below 10% = PASS

  // Minimum profit amounts ($)
  HOT_DEAL_MIN_PROFIT: 100,
  SOLID_DEAL_MIN_PROFIT: 50,
  MARGINAL_DEAL_MIN_PROFIT: 25,

  // Risk score thresholds (lower is better, 1-10 scale)
  MAX_ACCEPTABLE_RISK: 7,
  LOW_RISK: 3,
  MEDIUM_RISK: 5,
  HIGH_RISK: 7,

  // Distance thresholds (miles)
  LOCAL_DISTANCE: 25,
  REGIONAL_DISTANCE: 50,
  MAX_DISTANCE: 100,

  // Hot seller threshold (minimum deals from same seller)
  HOT_SELLER_MIN_DEALS: 3
};

// =============================================================================
// MAO CALCULATION PARAMETERS
// =============================================================================

const TM_MAO_PARAMS = {
  // Target profit margins
  DEFAULT_TARGET_MARGIN: 0.25,    // 25% target margin
  MIN_ACCEPTABLE_MARGIN: 0.15,    // 15% minimum margin

  // Risk adjustments (multipliers)
  LOW_RISK_MULTIPLIER: 1.05,      // Can offer 5% more for low risk
  HIGH_RISK_MULTIPLIER: 0.90,     // Offer 10% less for high risk

  // Hot seller bonus
  HOT_SELLER_BONUS: 0.03,         // 3% higher offer for hot sellers

  // Market advantage bonus
  MARKET_ADV_BONUS_THRESHOLD: 20, // % below market to trigger bonus
  MARKET_ADV_BONUS: 0.02,         // 2% bonus for great market deals

  // Offer vs MAO ratio
  OFFER_TO_MAO_RATIO: 0.85        // First offer is 85% of MAO
};

// =============================================================================
// DEAL SCORING WEIGHTS
// =============================================================================

const TM_SCORE_WEIGHTS = {
  PROFIT_MARGIN: 0.30,      // 30%
  PROFIT_AMOUNT: 0.25,      // 25%
  RISK_INVERSE: 0.20,       // 20%
  MARKET_ADVANTAGE: 0.15,   // 15%
  HOT_SELLER: 0.10          // 10%
};

// =============================================================================
// COLOR SCHEME
// =============================================================================

const TM_COLORS = {
  // Primary colors
  PRIMARY: '#1a73e8',        // Google Blue
  PRIMARY_LIGHT: '#4285f4',
  PRIMARY_DARK: '#0d47a1',

  // Header colors
  HEADER_BG: '#1a73e8',
  HEADER_TEXT: '#ffffff',

  // Deal class colors
  HOT_DEAL: '#00c853',       // Green
  HOT_DEAL_BG: '#c8e6c9',
  SOLID_DEAL: '#2196f3',     // Blue
  SOLID_DEAL_BG: '#bbdefb',
  MARGINAL_DEAL: '#ff9800',  // Orange
  MARGINAL_DEAL_BG: '#ffe0b2',
  PASS_DEAL: '#f44336',      // Red
  PASS_DEAL_BG: '#ffcdd2',

  // Status colors
  SUCCESS: '#4caf50',
  WARNING: '#ff9800',
  ERROR: '#f44336',
  INFO: '#2196f3',

  // Alternating row colors
  ROW_EVEN: '#ffffff',
  ROW_ODD: '#f8f9fa',

  // Sheet-specific colors
  IMPORT_HEADER: '#6d4c41',    // Brown
  MASTER_HEADER: '#1a73e8',    // Blue
  VERDICT_HEADER: '#00695c',   // Teal
  SETTINGS_HEADER: '#5e35b1',  // Purple
  LOG_HEADER: '#424242',       // Gray

  // Risk colors
  LOW_RISK: '#c8e6c9',
  MEDIUM_RISK: '#fff9c4',
  HIGH_RISK: '#ffcdd2'
};

// =============================================================================
// DEFAULT SETTINGS
// =============================================================================

const TM_DEFAULT_SETTINGS = [
  ['MIN_PROFIT_MARGIN', '0.15', 'Minimum acceptable profit margin (decimal)', 'Profit', ''],
  ['MIN_PROFIT_AMOUNT', '25', 'Minimum acceptable profit in dollars', 'Profit', ''],
  ['TARGET_PROFIT_MARGIN', '0.25', 'Target profit margin for offers', 'Profit', ''],
  ['MAX_RISK_SCORE', '7', 'Maximum acceptable risk score (1-10)', 'Risk', ''],
  ['HOT_SELLER_MIN_DEALS', '3', 'Minimum deals to qualify as hot seller', 'Sellers', ''],
  ['LOCAL_DISTANCE_MILES', '25', 'Maximum distance for local deals', 'Location', ''],
  ['MAX_DISTANCE_MILES', '100', 'Maximum distance to consider', 'Location', ''],
  ['OFFER_TO_MAO_RATIO', '0.85', 'First offer as ratio of MAO', 'Offers', ''],
  ['AUTO_SYNC_ENABLED', 'FALSE', 'Enable automatic sync on edit', 'System', ''],
  ['DEDUCTION_CRACKED_BACK', '180', 'Deduction for cracked back glass', 'Deductions', ''],
  ['DEDUCTION_CRACKED_LENS', '90', 'Deduction for cracked camera lens', 'Deductions', ''],
  ['DEDUCTION_CRICKET', '100', 'Deduction for Cricket carrier devices', 'Deductions', ''],
  ['DEDUCTION_DEMO', '50', 'Deduction for demo/display units', 'Deductions', ''],
  ['DEFAULT_SELLER_MESSAGE', 'Hi! I\'m interested in your {device}. Would you consider ${offer} for it? I can pick up today and pay cash. Let me know!', 'Template for auto-generated seller messages', 'Outreach', '']
];

// =============================================================================
// PLATFORM MAPPINGS
// =============================================================================

const TM_PLATFORMS = {
  FACEBOOK: {name: 'Facebook', code: 'FB', sheet: 'IMPORT_FB'},
  CRAIGSLIST: {name: 'Craigslist', code: 'CL', sheet: 'IMPORT_CL'},
  OFFERUP: {name: 'OfferUp', code: 'OU', sheet: 'IMPORT_OU'},
  EBAY: {name: 'eBay', code: 'EBAY', sheet: 'IMPORT_EBAY'},
  OTHER: {name: 'Other', code: 'OTHER', sheet: 'IMPORT_OTHER'}
};

// =============================================================================
// DEVICE TYPE MAPPINGS
// =============================================================================

const TM_DEVICE_TYPES = [
  'iPhone',
  'Samsung Galaxy',
  'Google Pixel',
  'OnePlus',
  'iPad',
  'Samsung Tablet',
  'MacBook',
  'Apple Watch',
  'Samsung Watch',
  'AirPods',
  'Other'
];

// =============================================================================
// BRAND MAPPINGS
// =============================================================================

const TM_BRANDS = [
  'Apple',
  'Samsung',
  'Google',
  'OnePlus',
  'Motorola',
  'LG',
  'Sony',
  'Huawei',
  'Xiaomi',
  'Other'
];

// =============================================================================
// ACTION TYPES FOR VERDICT
// =============================================================================

const TM_ACTIONS = {
  CALL: 'CALL',
  TEXT: 'TEXT',
  PASS: 'PASS',
  HOLD: 'HOLD',
  CONTACTED: 'CONTACTED',
  SCHEDULED: 'SCHEDULED',
  PURCHASED: 'PURCHASED',
  REJECTED: 'REJECTED'
};

// =============================================================================
// LOG EVENT TYPES
// =============================================================================

const TM_LOG_TYPES = {
  INFO: 'INFO',
  SUCCESS: 'SUCCESS',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  SYNC: 'SYNC',
  ANALYSIS: 'ANALYSIS',
  OUTREACH: 'OUTREACH',
  SYSTEM: 'SYSTEM'
};

// =============================================================================
// VERSION INFO
// =============================================================================

const TM_VERSION = {
  NAME: 'Thrifty Mobile Quantum',
  VERSION: '5.0',
  FULL_NAME: '📱💰 Thrifty Mobile Quantum 5.0',
  BUILD_DATE: '2025-01-01',
  AUTHOR: 'Thrifty Mobile Systems'
};
