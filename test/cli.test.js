import { describe, it, expect } from 'vitest';
import { normalizeUrl } from '../src/cli.js';

describe('normalizeUrl', () => {
  it('accepts https URL', () => {
    expect(normalizeUrl('https://example.com')).toBe('https://example.com');
  });
  it('accepts http URL', () => {
    expect(normalizeUrl('http://localhost:3000')).toBe('http://localhost:3000');
  });
  it('accepts local IP with port', () => {
    expect(normalizeUrl('http://192.168.0.10:13378')).toBe('http://192.168.0.10:13378');
  });
  it('prepends https:// when protocol is missing', () => {
    expect(normalizeUrl('www.google.com')).toBe('https://www.google.com');
  });
  it('prepends https:// for bare domain', () => {
    expect(normalizeUrl('example.com')).toBe('https://example.com');
  });
  it('rejects file:// protocol', () => {
    expect(() => normalizeUrl('file:///etc/passwd')).toThrow(/http/i);
  });
  it('rejects invalid URL', () => {
    expect(() => normalizeUrl('not a url')).toThrow();
  });
});
