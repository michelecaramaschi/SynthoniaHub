import { format, formatDistance, isToday, isYesterday } from 'date-fns';
import { it } from 'date-fns/locale';

export function formatDate(date: Date, formatStr: string = 'dd/MM/yyyy'): string {
  return format(date, formatStr, { locale: it });
}

export function formatDateTime(date: Date): string {
  return format(date, 'dd/MM/yyyy HH:mm', { locale: it });
}

export function formatRelativeDate(date: Date): string {
  if (isToday(date)) {
    return format(date, 'HH:mm', { locale: it });
  }
  if (isYesterday(date)) {
    return 'Ieri';
  }
  return formatDistance(date, new Date(), {
    addSuffix: true,
    locale: it,
  });
}

export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatPhoneNumber(phone: string): string {
  // Remove non-digits
  const digits = phone.replace(/\D/g, '');
  // Format as +39 XXXX XXXXXX if it's an Italian number
  if (digits.startsWith('39')) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`;
  }
  return phone;
}

export function truncateText(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
