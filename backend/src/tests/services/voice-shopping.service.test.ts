/**
 * ============================================================================
 * UNIT TESTS: VOICE SHOPPING & AUDIO TRANSCRIPTION (WHISPER & DIALECT)
 * ============================================================================
 */

import { voiceShoppingService } from '../../services/ai/voice-shopping.service';

// Mock AI provider for instant deterministic rule-based intent parsing
jest.mock('../../services/ai/ai-provider.service', () => ({
  executeAIGeneration: jest.fn().mockRejectedValue(new Error('offline-fast-test')),
  extractJsonFromResponse: jest.fn((text, fallback) => fallback),
}));

describe('VoiceShoppingService (Whisper & Dialect NLP)', () => {
  describe('1. Nigerian Pidgin & Slang Normalization', () => {
    it('normalizes colloquial market phrases into structured search tokens', () => {
      const raw = 'abeg find me fresh tomatoes sharp sharp';
      const normalized = voiceShoppingService.normalizePidginPhrases(raw);

      expect(normalized).toContain('search for');
      expect(normalized).toContain('fresh tomatoes');
      expect(normalized).toContain('express instant delivery');
    });
  });

  describe('2. Voice-to-Commerce Intent Processing', () => {
    it('accurately parses target item, budget, and zone from simulated audio query', async () => {
      const res = await voiceShoppingService.processVoiceQuery(
        { durationSeconds: 2.5 },
        'abeg find me fresh tomatoes under 10000 with delivery to Lekki'
      );

      expect(res.transcript).toBeTruthy();
      expect(res.detectedLanguage).toBe('pcm'); // Pidgin detected
      expect(res.parsedIntent.maxPrice).toBe(10000);
      expect(res.parsedIntent.keywords.length).toBeGreaterThan(0);
      expect(res.transcriptionConfidence).toBeGreaterThan(0.9);
    });

    it('processes standard English voice query with numerical pricing', async () => {
      const res = await voiceShoppingService.processVoiceQuery(
        { durationSeconds: 1.8 },
        'white sneakers under 25000 naira'
      );

      expect(res.detectedLanguage).toBe('en');
      expect(res.parsedIntent.maxPrice).toBe(25000);
    });
  });
});
