import { render, screen } from '@testing-library/react';
import SiteChrome from '@/components/SiteChrome';

let mockPath = '/';
jest.mock('next/navigation', () => ({ usePathname: () => mockPath }));

function renderAt(pathname: string) {
  mockPath = pathname;
  return render(
    <SiteChrome>
      <p>child</p>
    </SiteChrome>
  );
}

describe('SiteChrome', () => {
  it('/card: renders children only, no nav, no footer, no pt-16 wrapper', () => {
    const { container, getByText } = renderAt('/card');
    expect(getByText('child')).toBeInTheDocument();
    expect(container.querySelector('nav')).toBeNull();
    expect(container.querySelector('footer')).toBeNull();
    expect(container.querySelector('.pt-16')).toBeNull();
  });

  it('/card/qr: renders children only', () => {
    const { container, getByText } = renderAt('/card/qr');
    expect(getByText('child')).toBeInTheDocument();
    expect(container.querySelector('nav')).toBeNull();
    expect(container.querySelector('footer')).toBeNull();
    expect(container.querySelector('.pt-16')).toBeNull();
  });

  it('/: nav, offset and footer (D19)', () => {
    const { container, getByText } = renderAt('/');
    expect(container.querySelector('nav')).not.toBeNull();
    expect(container.querySelector('.pt-16')).toContainElement(getByText('child'));
    expect(container.querySelector('footer')).not.toBeNull();
  });

  it('/about: nav, offset and footer', () => {
    const { container, getByText } = renderAt('/about');
    expect(container.querySelector('nav')).not.toBeNull();
    expect(container.querySelector('.pt-16')).toContainElement(getByText('child'));
    expect(container.querySelector('footer')).not.toBeNull();
  });

  it('/cardigan: keeps the chrome', () => {
    const { container } = renderAt('/cardigan');
    expect(container.querySelector('nav')).not.toBeNull();
    expect(container.querySelector('.pt-16')).not.toBeNull();
    expect(container.querySelector('footer')).not.toBeNull();
  });

  // Keyboard users skip the eight nav links on every page (M2-06)
  it('/: a skip link to the content comes first', () => {
    const { container, getByRole } = renderAt('/');
    const skip = getByRole('link', { name: 'Skip to content' });
    expect(skip).toHaveAttribute('href', '#content');
    expect(container.querySelector('a')).toBe(skip);
    const target = container.querySelector('#content');
    expect(target).toContainElement(container.querySelector('p'));
    expect(target).toHaveAttribute('tabindex', '-1');
  });

  it('/card: no skip link', () => {
    const { queryByRole } = renderAt('/card');
    expect(queryByRole('link', { name: 'Skip to content' })).toBeNull();
  });
  // VC4-03, D61: the floating link to /talk, last in the chrome, everywhere but /talk and /card*
  const widget = () => screen.queryByRole('link', { name: 'Talk to my voice concierge' });

  it.each(['/', '/about', '/projects/agent-harness'])('%s: the voice widget comes after the Footer', (path) => {
    const { container } = renderAt(path);
    const link = widget();
    expect(link).not.toBeNull();
    expect(link).toHaveAttribute('href', '/talk');
    const footer = container.querySelector('footer')!;
    expect(footer.compareDocumentPosition(link!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(footer).not.toContainElement(link);
  });

  it('/talk: no voice widget, Navbar and Footer kept', () => {
    const { container } = renderAt('/talk');
    expect(widget()).toBeNull();
    expect(container.querySelector('nav')).not.toBeNull();
    expect(container.querySelector('footer')).not.toBeNull();
  });

  it.each(['/card', '/card/qr'])('%s: no voice widget', (path) => {
    renderAt(path);
    expect(widget()).toBeNull();
  });
});
