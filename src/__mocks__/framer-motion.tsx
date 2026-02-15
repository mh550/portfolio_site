/**
 * Shared manual mock for framer-motion.
 * Strips animation props to avoid React DOM warnings in tests.
 * Place jest.mock('framer-motion') calls in individual test files,
 * or configure moduleNameMapper to use this file automatically.
 */
import React from 'react';

const MOTION_PROPS = new Set([
  'initial', 'animate', 'exit', 'whileHover', 'whileTap', 'whileFocus',
  'whileInView', 'viewport', 'transition', 'variants', 'custom',
  'layout', 'layoutId', 'drag', 'dragConstraints', 'dragElastic',
  'onAnimationStart', 'onAnimationComplete', 'onDragStart', 'onDragEnd',
]);

function stripMotionProps(props: Record<string, unknown>) {
  const clean: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(props)) {
    if (!MOTION_PROPS.has(key)) clean[key] = val;
  }
  return clean;
}

type AnyProps = Record<string, unknown> & { children?: React.ReactNode };

const makeMotionComponent = (Tag: keyof React.JSX.IntrinsicElements) =>
  // eslint-disable-next-line react/display-name
  React.forwardRef(({ children, ...props }: AnyProps, ref) => {
    const clean = stripMotionProps(props);
    return React.createElement(Tag, { ...clean, ref }, children);
  });

export const motion = {
  div: makeMotionComponent('div'),
  span: makeMotionComponent('span'),
  p: makeMotionComponent('p'),
  h1: makeMotionComponent('h1'),
  h2: makeMotionComponent('h2'),
  section: makeMotionComponent('section'),
  nav: makeMotionComponent('nav'),
  ul: makeMotionComponent('ul'),
  li: makeMotionComponent('li'),
  button: makeMotionComponent('button'),
  a: makeMotionComponent('a'),
};

export const AnimatePresence = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const useReducedMotion = () => false;
export const useInView = () => true;
export const useAnimation = () => ({ start: jest.fn(), stop: jest.fn() });
export const useMotionValue = (initial: unknown) => ({ get: () => initial, set: jest.fn() });
export const useTransform = (_: unknown, __: unknown, output: unknown[]) => ({ get: () => output[0] });
