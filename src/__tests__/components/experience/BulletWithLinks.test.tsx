import { render, screen } from '@testing-library/react';
import BulletWithLinks from '@/components/experience/BulletWithLinks';
import { focusRing } from '@/components/focusRing';

describe('BulletWithLinks (P2-01)', () => {
  it('renders a plain bullet as text with no link', () => {
    const { container } = render(<BulletWithLinks bullet="Shipped features." />);
    expect(container).toHaveTextContent('Shipped features.');
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('renders an internal link with next/link in the same tab', () => {
    const { container } = render(
      <BulletWithLinks
        bullet={{ text: 'Built a contractor estimating app.', links: [{ text: 'contractor estimating app', href: '/projects/paint-estimator' }] }}
      />,
    );
    const link = screen.getByRole('link', { name: 'contractor estimating app' });
    expect(link).toHaveAttribute('href', '/projects/paint-estimator');
    expect(link).not.toHaveAttribute('target');
    expect(link.className).toContain(focusRing);
    expect(container).toHaveTextContent('Built a contractor estimating app.');
  });

  it('renders an external link in a new tab with noopener noreferrer, announced as such', () => {
    render(
      <BulletWithLinks
        bullet={{ text: 'See the repo.', links: [{ text: 'repo', href: 'https://github.com/mh550/agent-harness' }] }}
      />,
    );
    // The sr-only cue the Footer, /card and ProjectLinks give every new-tab link (P2-04 review).
    const link = screen.getByRole('link', { name: 'repo (opens in new tab)' });
    expect(link).toHaveAttribute('href', 'https://github.com/mh550/agent-harness');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link.className).toContain(focusRing);
  });

  it('renders a link span missing from the text as plain text, losing no words', () => {
    const { container } = render(
      <BulletWithLinks bullet={{ text: 'Shipped the app.', links: [{ text: 'missing phrase', href: '/projects/agent-harness' }] }} />,
    );
    expect(container).toHaveTextContent('Shipped the app.');
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('keeps the text around a mid-sentence link, and several links in text order', () => {
    const text = 'Integrated CRM, incl. a unified per-job communications log, saving time; then the integration platform shipped.';
    const { container } = render(
      <BulletWithLinks
        bullet={{
          text,
          links: [
            { text: 'integration platform', href: '/projects/ghl-jobtread-integration' },
            { text: 'unified per-job communications log', href: '/projects/ringcentral-jobtread-integration' },
          ],
        }}
      />,
    );
    expect(container).toHaveTextContent(text);
    expect(screen.getAllByRole('link').map((a) => a.textContent)).toEqual([
      'unified per-job communications log',
      'integration platform',
    ]);
    expect(container.firstElementChild?.tagName).toBe('SPAN');
  });
});
