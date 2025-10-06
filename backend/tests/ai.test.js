/**
 * Unit tests for the AI service module (lib/ai.js)
 */

const { getAIResponse } = require('../lib/ai');
const { safeFetch } = require('../lib/utils');

jest.mock('../lib/utils.js', () => ({
  ...jest.requireActual('../lib/utils.js'),
  safeFetch: jest.fn(),
}));

const originalEnv = process.env;

describe('AI Service (lib/ai.js)', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    safeFetch.mockClear();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should handle greetings without calling AI providers', async () => {
    const result = await getAIResponse('article', 'hello there');

    expect(result.model).toBe('greeting-handler');
    expect(result.answer).toBe('Hello! How can I help you with this article?');
    expect(safeFetch).not.toHaveBeenCalled();
  });

  it('should return a Gemini response when Gemini is configured', async () => {
    process.env.GEMINI_API_KEY = 'valid-gemini-key';
    safeFetch.mockResolvedValue({
      success: true,
      data: { candidates: [{ content: { parts: [{ text: 'Gemini says hello' }] } }] },
    });

    const result = await getAIResponse('article', 'question');

    expect(result.model).toBe('gemini-pro');
    expect(result.answer).toBe('Gemini says hello');
    expect(safeFetch).toHaveBeenCalledWith(expect.stringContaining('googleapis'), expect.any(Object));
  });

  it('should return a Groq response when Gemini fails and Groq is configured', async () => {
    process.env.GEMINI_API_KEY = 'valid-gemini-key';
    process.env.GROQ_API_KEY = 'valid-groq-key';

    // Make Gemini fail and Groq succeed
    safeFetch.mockImplementation((url) => {
      if (url.includes('googleapis')) {
        return Promise.resolve({ success: false, error: 'Gemini failed' });
      }
      if (url.includes('groq')) {
        return Promise.resolve({
          success: true,
          data: { choices: [{ message: { content: 'Groq says hello' } }] },
        });
      }
      return Promise.resolve({ success: false, error: 'Unexpected call' });
    });

    const result = await getAIResponse('article', 'question');

    expect(result.model).toBe('groq');
    expect(result.answer).toBe('Groq says hello');
  });

  it('should use fallback when all AI providers fail', async () => {
    process.env.GEMINI_API_KEY = 'valid-gemini-key';
    process.env.GROQ_API_KEY = 'valid-groq-key';
    safeFetch.mockResolvedValue({ success: false, error: 'All APIs failed' });

    const result = await getAIResponse('article text.', 'question');

    expect(result.model).toBe('extractive-fallback');
    expect(result.answer).toContain('[FALLBACK]');
  });

  it('should use fallback when no AI providers are configured', async () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GROQ_API_KEY;

    const result = await getAIResponse('article text.', 'question');

    expect(result.model).toBe('extractive-fallback');
    expect(safeFetch).not.toHaveBeenCalled();
  });
});