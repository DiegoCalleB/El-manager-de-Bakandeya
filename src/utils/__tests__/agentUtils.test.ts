import { describe, it, expect } from 'vitest';
import {
  sanitizeAIResponse,
  buildPitchPrompt,
  buildPressReleasePrompt,
  buildReelScriptPrompt,
} from '../agentUtils';

describe('agentUtils', () => {
  it('sanitizes code blocks from AI markdown response', () => {
    const raw = '```json\n{"status": "ok"}\n```';
    expect(sanitizeAIResponse(raw)).toBe('{"status": "ok"}');

    const rawCode = '```\nSome plain text response\n```';
    expect(sanitizeAIResponse(rawCode)).toBe('Some plain text response');
  });

  it('builds booking pitch prompt correctly', () => {
    const prompt = buildPitchPrompt('Apolo', 'Barcelona', 500, 'Indie/Rock', 'Banda de Ska Fusion', 900);
    expect(prompt).toContain('Apolo');
    expect(prompt).toContain('Barcelona');
    expect(prompt).toContain('500 pax');
    expect(prompt).toContain('900€');
  });

  it('builds press release prompt correctly', () => {
    const prompt = buildPressReleasePrompt('Bakandeya', 'Cacharros', '2025-09-01', 'Ska', 'Videoclip grabado en directo');
    expect(prompt).toContain('Bakandeya');
    expect(prompt).toContain('Cacharros');
    expect(prompt).toContain('Nota de Prensa');
  });

  it('builds reel script prompt correctly', () => {
    const prompt = buildReelScriptPrompt('Cacharros', 'Humor en la prueba de sonido', 'TikTok');
    expect(prompt).toContain('Cacharros');
    expect(prompt).toContain('TikTok');
    expect(prompt).toContain('HOOK');
  });
});
