import Image from 'next/image';
import type { ProjectMedia } from '@/lib/data';
import LoopingVideo from '@/components/LoopingVideo';

// Only images are shown uncropped at their own ratio; a video always fills a 4:3 box.
const isSized = (item: ProjectMedia) =>
  item.type === 'image' && item.width !== undefined && item.height !== undefined;
const isPortrait = (item: ProjectMedia) => isSized(item) && item.height! > item.width!;

/**
 * Screenshot / screen-recording gallery. Renders nothing until assets exist. Items with `width`/`height` show
 * uncropped at their own ratio; a list of phone screens sits three to a row from sm (D29).
 */
export default function MediaGallery({ media }: { media?: ProjectMedia[] }) {
  if (!media || media.length === 0) return null;
  const allPortrait = media.every(isPortrait);

  return (
    <div className={`grid grid-cols-1 gap-5 ${allPortrait ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
      {media.map((item) => (
        <figure key={item.src} className="space-y-2">
          <div
            className={`${isSized(item) ? '' : 'relative aspect-[4/3] '}overflow-hidden rounded-xl border border-white/10 bg-[var(--color-surface-alt)]`}
          >
            {item.type === 'video' ? (
              <LoopingVideo src={item.src} label={item.alt} className="absolute inset-0 h-full w-full object-cover" />
            ) : isSized(item) ? (
              <Image
                src={item.src}
                alt={item.alt}
                width={item.width}
                height={item.height}
                className="h-auto w-full"
                sizes={allPortrait ? '(max-width: 640px) 100vw, 240px' : '(max-width: 640px) 100vw, 384px'}
              />
            ) : (
              <Image
                src={item.src}
                alt={item.alt}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 50vw"
              />
            )}
          </div>
          {item.caption && (
            <figcaption className="text-xs leading-snug text-[var(--color-muted)]">
              {item.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}
