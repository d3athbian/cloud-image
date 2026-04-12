import { memo, useCallback, KeyboardEvent } from 'react';
import { CloudImage } from '@cloudimage/cloud';
import type { PicsumImage } from '../types/images';
import styles from '../styles/app.module.css';

interface ImageGridProps {
  images: PicsumImage[];
}

export const ImageGrid = memo(function ImageGrid({ images }: ImageGridProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const target = e.currentTarget as HTMLDivElement;
      target.click();
    }
  }, []);

  return (
    <div 
      className={styles.grid} 
      role="list" 
      aria-label="Image gallery"
    >
      {images.map((img, index) => (
        <div
          key={img.id}
          className={styles.imageWrapper}
          role="listitem"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          aria-label={`Image by ${img.author}`}
        >
          <CloudImage
            src={img.download_url}
            width={400}
            height={300}
            alt={`${img.author} - ${img.id}`}
            priority={index === 0 ? 'high' : undefined}
            loading={index < 6 ? 'eager' : 'lazy'}
          />
        </div>
      ))}
    </div>
  );
});