import { describe, it, expect } from 'vitest'
import {
  escapeHtml,
  sanitizeInput,
  isValidEmail,
  evaluatePasswordStrength,
  generateCsrfToken,
  generateSecureId,
  secureCompare,
  hashForLogging,
  isSafeUrl,
  redactSensitiveData,
} from './security'

describe('escapeHtml', () => {
  it('escapes ampersands', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b')
  })

  it('escapes less-than and greater-than signs', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;')
  })

  it('escapes double quotes', () => {
    expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;')
  })

  it('escapes single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#039;s')
  })

  it('returns safe string unchanged', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World')
  })

  it('escapes a full XSS payload', () => {
    const xss = '<img src="x" onerror="alert(\'xss\')">'
    const escaped = escapeHtml(xss)
    expect(escaped).not.toContain('<')
    expect(escaped).not.toContain('>')
    expect(escaped).not.toContain('"')
  })
})

describe('sanitizeInput', () => {
  it('removes < and > characters', () => {
    expect(sanitizeInput('<hello>')).toBe('hello')
  })

  it("removes quotes and backticks", () => {
    expect(sanitizeInput("it's a \"test\";`")).toBe('its a test')
  })

  it('trims whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello')
  })

  it('removes semicolons', () => {
    expect(sanitizeInput('DROP TABLE;')).toBe('DROP TABLE')
  })

  it('leaves safe characters unchanged', () => {
    expect(sanitizeInput('user@example.com')).toBe('user@example.com')
  })
})

describe('isValidEmail', () => {
  it('accepts a valid email', () => {
    expect(isValidEmail('user@example.com')).toBe(true)
  })

  it('accepts email with subdomain', () => {
    expect(isValidEmail('user@mail.example.co.uk')).toBe(true)
  })

  it('rejects email without @', () => {
    expect(isValidEmail('invalidemail.com')).toBe(false)
  })

  it('rejects email without domain', () => {
    expect(isValidEmail('user@')).toBe(false)
  })

  it('rejects email longer than 254 characters', () => {
    const longEmail = 'a'.repeat(250) + '@b.com'
    expect(longEmail.length).toBeGreaterThan(254)
    expect(isValidEmail(longEmail)).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isValidEmail('')).toBe(false)
  })
})

describe('evaluatePasswordStrength', () => {
  it('rates a very weak password with score 0', () => {
    const result = evaluatePasswordStrength('abc')
    expect(result.score).toBe(0)
    expect(result.label).toBe('Muy débil')
  })

  it('rates a strong password with score 4', () => {
    const result = evaluatePasswordStrength('MyP@ssw0rd!2024')
    expect(result.score).toBe(4)
    expect(result.label).toBe('Muy fuerte')
  })

  it('includes suggestions for weak passwords', () => {
    const result = evaluatePasswordStrength('short')
    expect(result.suggestions.length).toBeGreaterThan(0)
  })

  it('score is within 0-4 range', () => {
    const passwords = ['a', 'abcdefgh', 'Abcdefgh1', 'Abcdefgh1!', 'Abcdefgh1!@#longer']
    for (const p of passwords) {
      const result = evaluatePasswordStrength(p)
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(4)
    }
  })
})

describe('generateCsrfToken', () => {
  it('returns a 64-character hex string', () => {
    const token = generateCsrfToken()
    expect(token).toHaveLength(64)
    expect(token).toMatch(/^[0-9a-f]+$/)
  })

  it('generates unique tokens', () => {
    const token1 = generateCsrfToken()
    const token2 = generateCsrfToken()
    expect(token1).not.toBe(token2)
  })
})

describe('generateSecureId', () => {
  it('returns a 32-character hex string', () => {
    const id = generateSecureId()
    expect(id).toHaveLength(32)
    expect(id).toMatch(/^[0-9a-f]+$/)
  })

  it('generates unique IDs', () => {
    const id1 = generateSecureId()
    const id2 = generateSecureId()
    expect(id1).not.toBe(id2)
  })
})

describe('secureCompare', () => {
  it('returns true for identical strings', () => {
    expect(secureCompare('hello', 'hello')).toBe(true)
  })

  it('returns false for different strings of same length', () => {
    expect(secureCompare('hello', 'world')).toBe(false)
  })

  it('returns false for strings of different lengths', () => {
    expect(secureCompare('short', 'longer string')).toBe(false)
  })

  it('returns true for empty strings', () => {
    expect(secureCompare('', '')).toBe(true)
  })
})

describe('hashForLogging', () => {
  it('returns a non-empty hex string', async () => {
    const hash = await hashForLogging('test@example.com')
    expect(hash).toMatch(/^[0-9a-f]+$/)
    expect(hash.length).toBeGreaterThan(0)
  })

  it('returns consistent hash for same input', async () => {
    const hash1 = await hashForLogging('user@test.com')
    const hash2 = await hashForLogging('user@test.com')
    expect(hash1).toBe(hash2)
  })

  it('returns different hash for different inputs', async () => {
    const hash1 = await hashForLogging('user1@test.com')
    const hash2 = await hashForLogging('user2@test.com')
    expect(hash1).not.toBe(hash2)
  })
})

describe('isSafeUrl', () => {
  it('accepts https URLs', () => {
    expect(isSafeUrl('https://example.com')).toBe(true)
  })

  it('accepts http URLs', () => {
    expect(isSafeUrl('http://example.com')).toBe(true)
  })

  it('rejects javascript: URLs', () => {
    expect(isSafeUrl('javascript:alert(1)')).toBe(false)
  })

  it('rejects data: URLs', () => {
    expect(isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false)
  })

  it('accepts relative URLs (resolved against origin)', () => {
    expect(isSafeUrl('/dashboard')).toBe(true)
  })
})

describe('redactSensitiveData', () => {
  it('redacts password fields', () => {
    const result = redactSensitiveData({ email: 'user@test.com', password: 'secret' })
    expect(result.password).toBe('[REDACTADO]')
    expect(result.email).toBe('user@test.com')
  })

  it('redacts token fields', () => {
    const result = redactSensitiveData({ accessToken: 'abc123', userId: '1' })
    expect(result.accessToken).toBe('[REDACTADO]')
    expect(result.userId).toBe('1')
  })

  it('redacts custom sensitive keys', () => {
    const result = redactSensitiveData({ ssn: '123-45-6789', name: 'John' }, ['ssn'])
    expect(result.ssn).toBe('[REDACTADO]')
    expect(result.name).toBe('John')
  })

  it('leaves non-sensitive fields intact', () => {
    const result = redactSensitiveData({ email: 'user@test.com', rol: 'admin' })
    expect(result.email).toBe('user@test.com')
    expect(result.rol).toBe('admin')
  })
})
