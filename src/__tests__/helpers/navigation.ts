// P3-08 (plan docs/plans/2026-10-21-P3-concierge-in-site.md § Tests): ConciergeProvider calls useRouter(), which
// throws outside a mounted app router, so every test that renders the provider mocks next/navigation with this:
//
//   jest.mock('next/navigation', () => jest.requireActual<NavigationMock>('@/__tests__/helpers/navigation').mockNavigation);
//
// `navigation.pathname` is what usePathname() returns (set it before rendering); `mockRouter.push` records the usher.
// No imports, so the factory can load it before anything else.
export const navigation = { pathname: '/' };

export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
};

export const mockNavigation = {
  usePathname: () => navigation.pathname,
  useRouter: () => mockRouter,
};

// For a beforeEach: the pathname back to '/', the router's calls forgotten.
export function resetNavigation(pathname = '/') {
  navigation.pathname = pathname;
  for (const fn of Object.values(mockRouter)) fn.mockReset();
}

export type NavigationMock = typeof import('./navigation');
