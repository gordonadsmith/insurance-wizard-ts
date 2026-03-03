import { ToneKey, ToneConfig, CarrierMap, QuoteSettings, Resource, Issue } from '../types';

export const API_URL = "/api";
export const USE_LOCAL_STORAGE: boolean = true;
export const DISABLE_AUTH: boolean = true;

export const JERRY_PINK = "#E9406A";
export const JERRY_BG = "#FDF2F4";
export const SLATE = "#475569";
export const BORDER = "#E5E7EB";
export const COMPLIANCE_ORANGE = "#F59E0B";

export const ISSUE_CATEGORIES: string[] = ['Sales', 'Service', 'Technical', 'Billing', 'Claims', 'Policy Changes', 'Other'];

export const DEFAULT_CARRIERS: CarrierMap = {
  "1": { 
    id: "1", 
    name: "Progressive", 
    scripts: {
      "Quote": "<p><strong>Quote Process:</strong></p><p>Verify garaging address matches license.</p><p><strong>Phone:</strong> 1-800-776-4737</p>",
      "Sale": "<p><strong>Sale Process:</strong></p><p>Confirm down payment and start date.</p><p><strong>Phone:</strong> 1-800-776-4737</p>",
      "Billing": "<p><strong>Billing Support:</strong></p><p>Verify payment method on file.</p><p><strong>Phone:</strong> 1-800-776-4737</p>"
    }
  },
};

export const DEFAULT_CALL_TYPES: string[] = ["Quote", "Sale", "Billing", "Service", "Claims", "Other"];

export const DEFAULT_RESOURCES: Resource[] = [
  { id: '1', title: 'Callback Script', type: 'text', content: '<p>Hi, this is [Name] from Jerry.</p><p>I was working on your quote...</p>' },
  { id: '2', title: 'Carrier Matrix', type: 'link', content: 'https://google.com' }
];

export const DEFAULT_ISSUES: Issue[] = [
  { id: '1', title: 'Customer refuses quote', category: 'Sales', keywords: 'refuse reject decline no thanks', solution: '<p><strong>Best Practice:</strong></p><ul><li>Ask what concerns they have</li><li>Address specific objections</li><li>Offer to email quote for review</li><li>Schedule callback time</li></ul>' },
  { id: '2', title: 'Payment processing fails', category: 'Service', keywords: 'payment declined card error processing', solution: '<p><strong>Steps:</strong></p><ol><li>Verify card number and expiration</li><li>Try a different payment method</li><li>Contact carrier billing: [Number]</li><li>Offer to call back after they check with bank</li></ol>' },
  { id: '3', title: 'Customer claims better price elsewhere', category: 'Sales', keywords: 'cheaper price better rate competition', solution: '<p><strong>Response:</strong></p><p>Ask what the other quote includes to ensure apples-to-apples comparison. Often our coverage is more comprehensive.</p><p>Highlight our service advantages and claim support.</p>' },
];


export const DEFAULT_QUOTE_SETTINGS: QuoteSettings = {
  coverages: [
    { id: 'bi_pd', label: 'Bodily Injury Liability', hasInput: true, placeholder: 'e.g. 100/300', isPolicyLevel: true, format: "<b>{label}</b> at {value}" },
    { id: 'uim', label: 'Uninsured Motorist', hasInput: true, placeholder: 'e.g. 30/60', isPolicyLevel: true, format: "<b>{label}</b> at {value}" },
    { id: 'pip', label: 'PIP', hasInput: false, isPolicyLevel: true, format: "standard <b>{label}</b>" },
    { id: 'towing', label: 'Roadside', hasInput: false, isPolicyLevel: true, format: "<b>{label}</b>" },
    { id: 'comp', label: 'Comprehensive', hasInput: true, placeholder: 'e.g. $500 Ded', isPolicyLevel: false, format: "<b>{label}</b> with a {value}" },
    { id: 'coll', label: 'Collision', hasInput: true, placeholder: 'e.g. $500 Ded', isPolicyLevel: false, format: "<b>{label}</b> with a {value}" },
    { id: 'rental', label: 'Rental', hasInput: true, placeholder: 'e.g. $1200', isPolicyLevel: false, format: "{value} for <b>{label}</b>" },
  ],
  coverageFormat: "<b>{label}</b> with {value}", 
  vehicleTemplate: "for {name}, we have {coverages}",
  template: "<p>Excellent news, I found a great rate with <strong>{carrier}</strong>.</p><p>{policy}</p><p>Then {vehicles}.</p><p>I will get this started today for <strong>{down} down</strong> and <strong>{monthly} a month</strong>.</p><p>{closing}</p>"
};


export const TONES: Record<ToneKey, ToneConfig> = {
  neutral: {
    label: 'Neutral',
    color: '#f3f4f6',
    textColor: '#1f2937',
    borderColor: '#d1d5db',
    description: 'Professional and balanced'
  },
  fun: {
    label: 'Fun',
    color: '#fef3c7',
    textColor: '#92400e',
    borderColor: '#fbbf24',
    description: 'Friendly and energetic'
  },
  efficient: {
    label: 'Efficient',
    color: '#dbeafe',
    textColor: '#1e3a8a',
    borderColor: '#3b82f6',
    description: 'Direct and concise'
  },
  detailed: {
    label: 'Detail-Oriented',
    color: '#e0e7ff',
    textColor: '#3730a3',
    borderColor: '#6366f1',
    description: 'Thorough and comprehensive'
  }
};

