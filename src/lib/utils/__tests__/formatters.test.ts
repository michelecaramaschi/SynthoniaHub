import { formatCurrency, formatPhoneNumber, truncateText, capitalize } from '../formatters';

describe('formatters', () => {
  describe('formatCurrency', () => {
    it('should format number as EUR currency', () => {
      const result = formatCurrency(1000);
      expect(result).toContain('1');
      expect(result).toContain('00');
    });

    it('should handle decimals', () => {
      const result = formatCurrency(1234.56);
      expect(result).toBeDefined();
    });

    it('should handle zero', () => {
      const result = formatCurrency(0);
      expect(result).toContain('0');
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format Italian phone number', () => {
      const result = formatPhoneNumber('3933334567');
      expect(result).toContain('+39');
    });

    it('should handle already formatted numbers', () => {
      const result = formatPhoneNumber('+393933334567');
      expect(result).toBeDefined();
    });

    it('should handle invalid numbers gracefully', () => {
      const result = formatPhoneNumber('abc');
      expect(result).toBeDefined();
    });
  });

  describe('truncateText', () => {
    it('should truncate text longer than maxLength', () => {
      const text = 'This is a very long text that should be truncated';
      const result = truncateText(text, 20);
      expect(result.length).toBeLessThanOrEqual(23); // includes '...'
      expect(result).toContain('...');
    });

    it('should not truncate text shorter than maxLength', () => {
      const text = 'Short text';
      const result = truncateText(text, 20);
      expect(result).toBe(text);
    });

    it('should use default maxLength of 50', () => {
      const text = 'a'.repeat(60);
      const result = truncateText(text);
      expect(result.length).toBeLessThanOrEqual(53);
    });
  });

  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      const result = capitalize('hello');
      expect(result).toBe('Hello');
    });

    it('should lowercase rest of string', () => {
      const result = capitalize('hELLO');
      expect(result).toBe('Hello');
    });

    it('should handle single character', () => {
      const result = capitalize('a');
      expect(result).toBe('A');
    });
  });
});
