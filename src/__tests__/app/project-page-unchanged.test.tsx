import { render } from '@testing-library/react';
import ProjectDetailPage from '@/app/projects/[slug]/page';

jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

// Written before M3-04 moved the page body into ProjectDetail: proof that a project without a caseStudy renders
// exactly as before. A fixed list, so projects added by M4–M6 don't change it. Update it only for a deliberate
// change to a non-case-study page, and say so in the progress entry.
const SLUGS = [
  'ghl-jobtread-integration',
  'linear-ai-workflow',
  'ringcentral-jobtread-integration',
  'paint-estimator',
  'mirrored-google-calendars',
  'cherished',
];

describe('/projects/[slug] without a caseStudy', () => {
  it.each(SLUGS)('%s renders unchanged', async (slug) => {
    const { container } = render(await ProjectDetailPage({ params: Promise.resolve({ slug }) }));
    expect(container.innerHTML).toMatchSnapshot();
  });
});
