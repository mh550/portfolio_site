import type { ReactNode } from 'react';

/** Every h2 on a project page, case study or not. */
export const sectionHeadingClass = 'text-2xl font-bold mb-4';

/** The one section wrapper every case-study block shares: an anchorable section labelled by its h2. */
export default function CaseStudySection({
  id,
  heading,
  children,
}: {
  id: string;
  heading: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-24">
      <h2 id={`${id}-heading`} className={sectionHeadingClass}>
        {heading}
      </h2>
      {children}
    </section>
  );
}
