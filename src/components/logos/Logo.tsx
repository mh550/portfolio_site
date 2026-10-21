import { logoPaths, type LogoKey } from './paths';

interface LogoProps {
  name: LogoKey;
  /** Hidden from assistive tech, with no <title> (for marks next to their own label) */
  decorative?: boolean;
  className?: string;
}

// One brand mark from the generated paths (D78); Server-Component-safe
export default function Logo({ name, decorative = false, className }: LogoProps) {
  const { title, path } = logoPaths[name];
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...(decorative ? { 'aria-hidden': true } : { role: 'img' })}
    >
      {decorative ? null : <title>{title}</title>}
      <path d={path} />
    </svg>
  );
}
