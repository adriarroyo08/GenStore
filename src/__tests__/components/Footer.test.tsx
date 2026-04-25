import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Mock fetch used in Footer's useEffect for business info
const mockFetch = vi.fn().mockResolvedValue({
  json: () => Promise.resolve({ razon_social: 'TestCorp S.L.', cif: 'B12345678' }),
});
vi.stubGlobal('fetch', mockFetch);

vi.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    language: 'es',
    setLanguage: vi.fn(),
  }),
}));

vi.mock('../../components/GenStoreLogo', () => ({
  GenStoreLogo: ({ size, showText, textVariant }: any) => (
    <div data-testid="genstore-logo" data-size={size} data-show-text={showText} data-variant={textVariant} />
  ),
}));

import { Footer } from '../../components/Footer';

const defaultProps = {
  onAboutClick: vi.fn(),
  onContactClick: vi.fn(),
  onSupportClick: vi.fn(),
  onFAQClick: vi.fn(),
  onCategoryClick: vi.fn(),
  onShippingInfoClick: vi.fn(),
  onReturnsClick: vi.fn(),
  onPrivacyClick: vi.fn(),
  onTermsClick: vi.fn(),
  onHomeClick: vi.fn(),
};

function renderFooter(overrides: Partial<typeof defaultProps> = {}) {
  return render(<Footer {...defaultProps} {...overrides} />);
}

describe('Footer', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the GenStore logo', () => {
    renderFooter();
    expect(screen.getByTestId('genstore-logo')).toBeInTheDocument();
  });

  it('renders all 4 navigation sections', () => {
    renderFooter();
    // Categories section
    expect(screen.getByRole('navigation', { name: 'Comprar' })).toBeInTheDocument();
    // Support section
    expect(screen.getByRole('navigation', { name: 'Soporte' })).toBeInTheDocument();
    // Legal section
    expect(screen.getByRole('navigation', { name: 'Legal' })).toBeInTheDocument();
    // Brand section (logo area is the 4th column, no specific nav role but it's there)
  });

  it('renders social links (Instagram, Facebook, Twitter)', () => {
    renderFooter();
    expect(screen.getByRole('link', { name: 'Instagram' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Facebook' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Twitter' })).toBeInTheDocument();
  });

  it('social links have correct href attributes', () => {
    renderFooter();
    expect(screen.getByRole('link', { name: 'Instagram' })).toHaveAttribute('href', 'https://instagram.com');
    expect(screen.getByRole('link', { name: 'Facebook' })).toHaveAttribute('href', 'https://facebook.com');
    expect(screen.getByRole('link', { name: 'Twitter' })).toHaveAttribute('href', 'https://x.com');
  });

  it('social links open in new tab', () => {
    renderFooter();
    const instagramLink = screen.getByRole('link', { name: 'Instagram' });
    expect(instagramLink).toHaveAttribute('target', '_blank');
    expect(instagramLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders category buttons in Shop section', () => {
    renderFooter();
    // These are i18n keys rendered by t() which returns the key itself
    expect(screen.getByText('categories.electrotherapy')).toBeInTheDocument();
    expect(screen.getByText('categories.massage')).toBeInTheDocument();
    expect(screen.getByText('categories.skincare')).toBeInTheDocument();
    expect(screen.getByText('categories.beautyTech')).toBeInTheDocument();
  });

  it('calls onCategoryClick when category button is clicked', () => {
    const onCategoryClick = vi.fn();
    renderFooter({ onCategoryClick });
    fireEvent.click(screen.getByText('categories.electrotherapy'));
    expect(onCategoryClick).toHaveBeenCalledWith('electrotherapy');
  });

  it('calls onShippingInfoClick when shipping button is clicked', () => {
    const onShippingInfoClick = vi.fn();
    renderFooter({ onShippingInfoClick });
    fireEvent.click(screen.getByText('footer.shipping'));
    expect(onShippingInfoClick).toHaveBeenCalledTimes(1);
  });

  it('calls onReturnsClick when returns button is clicked', () => {
    const onReturnsClick = vi.fn();
    renderFooter({ onReturnsClick });
    fireEvent.click(screen.getByText('footer.returns'));
    expect(onReturnsClick).toHaveBeenCalledTimes(1);
  });

  it('calls onSupportClick when support button is clicked', () => {
    const onSupportClick = vi.fn();
    renderFooter({ onSupportClick });
    fireEvent.click(screen.getByText('general.support'));
    expect(onSupportClick).toHaveBeenCalledTimes(1);
  });

  it('calls onFAQClick when FAQ button is clicked', () => {
    const onFAQClick = vi.fn();
    renderFooter({ onFAQClick });
    fireEvent.click(screen.getByText('general.faq'));
    expect(onFAQClick).toHaveBeenCalledTimes(1);
  });

  it('calls onAboutClick when about button is clicked', () => {
    const onAboutClick = vi.fn();
    renderFooter({ onAboutClick });
    fireEvent.click(screen.getByText('general.about'));
    expect(onAboutClick).toHaveBeenCalledTimes(1);
  });

  it('calls onContactClick when contact button is clicked', () => {
    const onContactClick = vi.fn();
    renderFooter({ onContactClick });
    fireEvent.click(screen.getByText('nav.contact'));
    expect(onContactClick).toHaveBeenCalledTimes(1);
  });

  it('calls onPrivacyClick when privacy button is clicked', () => {
    const onPrivacyClick = vi.fn();
    renderFooter({ onPrivacyClick });
    fireEvent.click(screen.getByText('footer.privacy'));
    expect(onPrivacyClick).toHaveBeenCalledTimes(1);
  });

  it('calls onTermsClick when terms button is clicked', () => {
    const onTermsClick = vi.fn();
    renderFooter({ onTermsClick });
    fireEvent.click(screen.getByText('footer.terms'));
    expect(onTermsClick).toHaveBeenCalledTimes(1);
  });

  it('renders copyright with current year', () => {
    renderFooter();
    const year = new Date().getFullYear().toString();
    // Copyright text is in the bottom section
    expect(screen.getByText(/footer\.allRightsReserved/)).toBeInTheDocument();
    const footer = document.querySelector('footer');
    expect(footer?.textContent).toContain(year);
  });

  it('renders Legal section heading', () => {
    renderFooter();
    expect(screen.getByText('Legal')).toBeInTheDocument();
  });
});
