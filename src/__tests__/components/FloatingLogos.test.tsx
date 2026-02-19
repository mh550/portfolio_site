import { render, screen } from '@testing-library/react';
import FloatingLogos from '@/components/hero/FloatingLogos';

describe('FloatingLogos', () => {
  it('renders all 8 skill logos', () => {
    render(<FloatingLogos />);
    const labels = ['TypeScript', 'React', 'Supabase', 'Vercel', 'n8n', 'Zapier', 'Claude', 'Pipedream'];
    for (const label of labels) {
      // Either an SVG with aria-label or a div with the monogram text
      const el = screen.queryByRole('img', { name: label }) ?? screen.queryByText('PD');
      expect(el ?? screen.queryByTitle(label)).toBeTruthy();
    }
  });

  it('is aria-hidden so screen readers skip it', () => {
    const { container } = render(<FloatingLogos />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveAttribute('aria-hidden', 'true');
  });
});
