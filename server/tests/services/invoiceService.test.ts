import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock pdf-lib
vi.mock('pdf-lib', () => ({
  PDFDocument: {
    create: vi.fn().mockResolvedValue({
      addPage: vi.fn().mockReturnValue({
        getSize: () => ({ width: 595, height: 842 }),
        drawText: vi.fn(),
        drawRectangle: vi.fn(),
        drawLine: vi.fn(),
      }),
      embedFont: vi.fn().mockResolvedValue({}),
      save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
    }),
  },
  StandardFonts: { Helvetica: 'Helvetica', HelveticaBold: 'Helvetica-Bold' },
  rgb: vi.fn().mockReturnValue({}),
}));

// Mock env
vi.mock('../../src/config/env.js', () => ({
  env: {
    BUSINESS_NAME: 'Test S.L.',
    BUSINESS_NIF: 'B12345678',
    BUSINESS_ADDRESS: 'Calle Test',
    BUSINESS_EMAIL: 'test@test.com',
    BUSINESS_PHONE: '+34 600 000 000',
  },
}));

// Mock Supabase
const mockFrom = vi.fn();

vi.mock('../../src/config/supabase.js', () => ({
  supabaseAdmin: {
    from: (...args: any[]) => mockFrom(...args),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: 'https://example.com/signed-url' },
        }),
      }),
    },
  },
}));

import { getInvoiceDownloadUrl } from '../../src/services/invoiceService.js';

describe('invoiceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getInvoiceDownloadUrl', () => {
    it('returns signed URL for existing invoice', async () => {
      const chain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { file_path: 'invoices/2026/FIS-2026-00001.pdf' },
          error: null,
        }),
      };
      mockFrom.mockReturnValueOnce(chain);

      const url = await getInvoiceDownloadUrl('ord-1');
      expect(url).toBe('https://example.com/signed-url');
    });

    it('returns null when no invoice exists', async () => {
      const chain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      mockFrom.mockReturnValueOnce(chain);

      const url = await getInvoiceDownloadUrl('ord-nonexistent');
      expect(url).toBeNull();
    });
  });
});
