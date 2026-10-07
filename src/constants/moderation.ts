export const REPORT_REASON_KEYS = ['spam', 'offensive', 'fake', 'irrelevant', 'incorrect_info', 'other'] as const;
export const REPORT_REASONS_REVIEW = [
  { key: 'spam', label: 'Spam or advertising' },
  { key: 'offensive', label: 'Offensive or hateful' },
  { key: 'fake', label: 'Fake or misleading' },
  { key: 'irrelevant', label: 'Not about this shop' },
  { key: 'other', label: 'Other' },
] as const;
export const REPORT_REASONS_LISTING = [
  { key: 'incorrect_info', label: 'Incorrect information' },
  { key: 'fake', label: 'Fake or misleading' },
  { key: 'spam', label: 'Spam or advertising' },
  { key: 'offensive', label: 'Offensive or hateful' },
  { key: 'other', label: 'Other' },
] as const;
export const REMOVAL_REASONS = [
  ...REPORT_REASONS_REVIEW.filter((reason) => reason.key !== 'other'),
  { key: 'other', label: 'Other policy violation' },
];
export const MAX_REPORT_DETAILS = 300;
export const MAX_REPORT_SHOP_NAME = 120;
export const REPORT_RESOLUTION_BATCH_SIZE = 10;
export const REPORTS_PAGE_LIMIT = 100;
