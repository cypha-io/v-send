/**
 * Format currency amount with proper symbol and decimal places
 */
export const formatCurrency = (amount: number, currency: string = 'GHS'): string => {
  const symbols: { [key: string]: string } = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    NGN: '₦',
    GHS: '₵',
  };

  const symbol = symbols[currency] || currency;
  
  return `${symbol}${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');
  
  // Format as international number if it starts with country code
  if (digits.length >= 10) {
    const last4 = digits.slice(-4);
    const middle3 = digits.slice(-7, -4);
    const area3 = digits.slice(-10, -7);
    const country = digits.slice(0, -10);
    
    if (country) {
      return `+${country} ${area3} ${middle3} ${last4}`;
    } else {
      return `${area3} ${middle3} ${last4}`;
    }
  }
  
  return phoneNumber;
};

/**
 * Format transaction reference for display
 */
export const formatTransactionReference = (reference: string): string => {
  return reference.replace(/(.{3})/g, '$1 ').trim();
};

/**
 * Format date for display
 */
export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format time for display
 */
export const formatTime = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format datetime for display
 */
export const formatDateTime = (date: Date | string): string => {
  const d = new Date(date);
  const now = new Date();
  const diffInHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    return `Today, ${formatTime(d)}`;
  } else if (diffInHours < 48) {
    return `Yesterday, ${formatTime(d)}`;
  } else {
    return `${formatDate(d)}, ${formatTime(d)}`;
  }
};

/**
 * Validate phone number
 */
export const validatePhoneNumber = (phoneNumber: string): boolean => {
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');
  
  // Check if it's a valid length (10-15 digits)
  return digits.length >= 10 && digits.length <= 15;
};

/**
 * Validate PIN
 */
export const validatePin = (pin: string): boolean => {
  return /^\d{4}$/.test(pin);
};

/**
 * Validate amount
 */
export const validateAmount = (amount: string | number): { isValid: boolean; error?: string } => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return { isValid: false, error: 'Please enter a valid amount' };
  }
  
  if (numAmount <= 0) {
    return { isValid: false, error: 'Amount must be greater than 0' };
  }
  
  if (numAmount > 999999) {
    return { isValid: false, error: 'Amount too large' };
  }
  
  // Check for more than 2 decimal places
  if (amount.toString().includes('.') && amount.toString().split('.')[1].length > 2) {
    return { isValid: false, error: 'Amount can have at most 2 decimal places' };
  }
  
  return { isValid: true };
};

/**
 * Clean phone number (remove formatting)
 */
export const cleanPhoneNumber = (phoneNumber: string): string => {
  return phoneNumber.replace(/\D/g, '');
};

/**
 * Mask account number for display
 */
export const maskAccountNumber = (accountNumber: string): string => {
  if (accountNumber.length <= 4) return accountNumber;
  
  const visiblePart = accountNumber.slice(-4);
  const maskedPart = '*'.repeat(accountNumber.length - 4);
  
  return maskedPart + visiblePart;
};

/**
 * Get transaction status color
 */
export const getTransactionStatusColor = (status: string): string => {
  switch (status) {
    case 'completed':
      return '#4CAF50'; // Green
    case 'pending':
      return '#FF9800'; // Orange
    case 'failed':
    case 'cancelled':
      return '#F44336'; // Red
    default:
      return '#757575'; // Gray
  }
};

/**
 * Get transaction type icon
 */
export const getTransactionTypeIcon = (type: string): string => {
  switch (type) {
    case 'credit':
    case 'topup':
      return 'add-circle';
    case 'debit':
    case 'withdrawal':
      return 'remove-circle';
    case 'transfer':
      return 'swap-horizontal';
    default:
      return 'card';
  }
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  
  return text.slice(0, maxLength - 3) + '...';
};

/**
 * Generate initials from name
 */
export const getInitials = (firstName?: string, lastName?: string): string => {
  const first = firstName?.charAt(0)?.toUpperCase() || '';
  const last = lastName?.charAt(0)?.toUpperCase() || '';
  
  return first + last || '?';
};

/**
 * Check if string is empty or whitespace
 */
export const isEmpty = (value: string | null | undefined): boolean => {
  return !value || value.trim().length === 0;
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};
