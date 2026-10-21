/** @jest-environment node */
import { GET, dynamic } from '@/app/michael-herron.vcf/route';
import { buildVCard } from '@/lib/vcard';
import { profile } from '@/lib/data';

describe('/michael-herron.vcf route', () => {
  it('exports dynamic = force-static', () => {
    expect(dynamic).toBe('force-static');
  });

  it('GET returns 200', () => {
    expect(GET().status).toBe(200);
  });

  it('content-type is text/vcard; charset=utf-8', () => {
    expect(GET().headers.get('content-type')).toBe('text/vcard; charset=utf-8');
  });

  it('content-disposition is inline; filename="michael-herron.vcf"', () => {
    expect(GET().headers.get('content-disposition')).toBe('inline; filename="michael-herron.vcf"');
  });

  it('body equals buildVCard(profile)', async () => {
    expect(await GET().text()).toBe(buildVCard(profile));
  });

  it('carries the v3 positioning as the vCard TITLE (D76)', async () => {
    expect(await GET().text()).toContain('TITLE:Agentic Systems Engineer\r\n');
  });
});
