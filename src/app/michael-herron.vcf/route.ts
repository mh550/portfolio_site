import { buildVCard } from '@/lib/vcard';
import { profile } from '@/lib/data';

export const dynamic = 'force-static';

// Plain Response (not NextResponse) so the Jest node test can call GET() directly.
// inline lets iOS Safari show its "Add to Contacts" sheet instead of downloading.
export function GET() {
  return new Response(buildVCard(profile), {
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': 'inline; filename="michael-herron.vcf"',
    },
  });
}
