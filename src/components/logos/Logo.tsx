import { extraPaths, type ExtraKey } from './extra';
import { logoPaths, type LogoKey } from './paths';

const marks: Record<LogoKey | ExtraKey, { title: string; path: string; fillRule?: 'evenodd' }> = {
  ...logoPaths,
  ...extraPaths,
};

interface LogoProps {
  name: LogoKey | ExtraKey;
  /** Hidden from assistive tech, with no <title> (for marks next to their own label) */
  decorative?: boolean;
  className?: string;
}

// One mark from the generated paths (D78) or the authored ones in extra.ts (D97); Server-Component-safe
export default function Logo({ name, decorative = false, className }: LogoProps) {
  const { title, path, fillRule } = marks[name];
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...(decorative ? { 'aria-hidden': true } : { role: 'img' })}
    >
      {decorative ? null : <title>{title}</title>}
      <path d={path} fillRule={fillRule} />
    </svg>
  );
}
