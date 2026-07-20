import { RequestType, Priority } from '@prisma/client';

interface ParsedMessage {
  type: RequestType;
  priority: Priority;
  keywords: string[];
  confidence: number;
}

const REQUEST_PATTERNS = {
  QUOTE: [
    /preventivo|quotation|quote|prezzo|price|costo|cost|tariff|tariffa/i,
    /puoi\s+(fare|farmi|inviare)\s+un\s+preventivo/i,
    /quanto\s+costa|how much|qual\s+è\s+il\s+prezzo/i,
  ],
  BOOKING: [
    /prenotazione|booking|prenota|book|reserve|prenotare|appuntamento|appointment|date/i,
    /puoi\s+prenotarmi|can\s+you\s+book|voglio\s+prenotare/i,
    /quando\s+sei\s+disponibile|availability|available/i,
  ],
  SUPPORT: [
    /aiuto|help|problema|problem|issue|errore|error|bug|assistenza|support/i,
    /non\s+funziona|doesn't\s+work|guasto|broken|non\s+va/i,
    /come\s+posso|how\s+can|domanda|question/i,
  ],
};

const PRIORITY_PATTERNS = {
  URGENT: [
    /urgente|urgent|asap|subito|immediately|emergency|emergenza|critical|critico/i,
    /veloce|quickly|quick|fast|presto|in\s+fretta/i,
  ],
  HIGH: [
    /importante|important|priority|prioritario|primaria|alta\s+priorità/i,
    /oggi|today|domani|tomorrow|this\s+week/i,
  ],
  MEDIUM: [
    /appena\s+possibile|as\s+soon\s+as\s+possible|quando\s+puoi|when\s+you\s+can/i,
  ],
};

export function parseMessage(text: string): ParsedMessage {
  const lowerText = text.toLowerCase();

  let detectedType: RequestType = 'OTHER';
  let maxMatchCount = 0;
  const matchedKeywords: string[] = [];

  // Check each request type
  for (const [type, patterns] of Object.entries(REQUEST_PATTERNS)) {
    let matchCount = 0;
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        matchCount += matches.length;
        matchedKeywords.push(...matches);
      }
    }
    if (matchCount > maxMatchCount) {
      maxMatchCount = matchCount;
      detectedType = type as RequestType;
    }
  }

  // Determine priority
  let priority: Priority = 'MEDIUM';
  for (const [prio, patterns] of Object.entries(PRIORITY_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        priority = prio as Priority;
        break;
      }
    }
  }

  // Calculate confidence
  const confidence = Math.min(1, maxMatchCount / 3);

  return {
    type: detectedType,
    priority,
    keywords: [...new Set(matchedKeywords)],
    confidence,
  };
}

export function extractPhoneNumber(waId: string): string {
  // WhatsApp IDs typically come with country code, ensure format is clean
  const cleanId = waId.replace(/\D/g, '');
  return `+${cleanId}` || waId;
}
