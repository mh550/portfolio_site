import ProjectDetailPage, { generateMetadata, generateStaticParams } from '@/app/projects/[slug]/page';
import { notFound } from 'next/navigation';
import { getProjectBySlug, projects } from '@/lib/data';

jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

describe('/projects/[slug] metadata and params', () => {
  it('titles a project page "<title> — Michael Herron" with its shortDescription', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'ghl-jobtread-integration' }) });
    expect(meta.title).toBe('GoHighLevel ↔ JobTread Integration — Michael Herron');
    expect(meta.description).toBe(getProjectBySlug('ghl-jobtread-integration')!.shortDescription);
  });

  it('titles an unknown slug "Project Not Found"', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'no-such-project' }) });
    expect(meta.title).toBe('Project Not Found');
  });

  it('generates one static param per project', async () => {
    expect(await generateStaticParams()).toEqual(projects.map((p) => ({ slug: p.slug })));
  });

  it('calls notFound for an unknown slug', async () => {
    await expect(ProjectDetailPage({ params: Promise.resolve({ slug: 'no-such-project' }) })).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );
    expect(notFound).toHaveBeenCalled();
  });
});
