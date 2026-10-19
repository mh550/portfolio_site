import { render } from '@testing-library/react';
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

  // Keyboard users skip the seven nav links on every page (M2-06)
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
});

