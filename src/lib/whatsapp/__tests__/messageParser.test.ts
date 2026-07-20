import { parseMessage, extractPhoneNumber } from '../messageParser';

describe('messageParser', () => {
  describe('parseMessage', () => {
    it('should detect QUOTE requests', () => {
      const text = 'Puoi farmi un preventivo?';
      const result = parseMessage(text);
      expect(result.type).toBe('QUOTE');
    });

    it('should detect BOOKING requests', () => {
      const text = 'Voglio fare una prenotazione per domani';
      const result = parseMessage(text);
      expect(result.type).toBe('BOOKING');
    });

    it('should detect SUPPORT requests', () => {
      const text = 'Ho un problema con il servizio';
      const result = parseMessage(text);
      expect(result.type).toBe('SUPPORT');
    });

    it('should detect URGENT priority', () => {
      const text = 'Urgente! Preventivo subito';
      const result = parseMessage(text);
      expect(result.priority).toBe('URGENT');
    });

    it('should detect HIGH priority', () => {
      const text = 'Preventivo importante per oggi';
      const result = parseMessage(text);
      expect(result.priority).toBe('HIGH');
    });

    it('should default to OTHER type and MEDIUM priority for unknown text', () => {
      const text = 'Ciao, come stai?';
      const result = parseMessage(text);
      expect(result.type).toBe('OTHER');
      expect(result.priority).toBe('MEDIUM');
    });

    it('should extract keywords', () => {
      const text = 'Preventivo e prezzo per il progetto';
      const result = parseMessage(text);
      expect(result.keywords.length).toBeGreaterThan(0);
    });

    it('should calculate confidence score', () => {
      const text = 'Preventivo urgente';
      const result = parseMessage(text);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('extractPhoneNumber', () => {
    it('should format WhatsApp ID to phone number', () => {
      const waId = '393331234567';
      const result = extractPhoneNumber(waId);
      expect(result).toBe('+393331234567');
    });

    it('should handle already formatted numbers', () => {
      const waId = '+393331234567';
      const result = extractPhoneNumber(waId);
      expect(result).toContain('39');
    });
  });
});
