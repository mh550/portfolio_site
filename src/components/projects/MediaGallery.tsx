import Image from 'next/image';
import type { ProjectMedia } from '@/lib/data';

/** Screenshot / screen-recording gallery. Renders nothing until assets exist. */
export default function MediaGallery({ media }: { media?: ProjectMedia[] }) {
  if (!media || media.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {media.map((item) => (
        <figure key={item.src} className="space-y-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-[var(--color-surface-alt)]">
            {item.type === 'video' ? (
              <video
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 h-full w-full object-cover"
                aria-label={item.alt}
              >
                <source src={item.src} type="video/mp4" />
              </video>
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
