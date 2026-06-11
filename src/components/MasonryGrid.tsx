'use client'

import Masonry from 'react-masonry-css'
import type { Artwork } from '@/data/catalog'
import ArtworkCard from './ArtworkCard'
import styles from './MasonryGrid.module.css'

const breakpointCols = { default: 3, 1024: 2, 640: 1 }

type Props = { artworks: Artwork[] }

export default function MasonryGrid({ artworks }: Props) {
  return (
    <Masonry
      breakpointCols={breakpointCols}
      className={styles.grid}
      columnClassName={styles.column}
    >
      {artworks.map(artwork => (
        <ArtworkCard key={artwork.slug} artwork={artwork} />
      ))}
    </Masonry>
  )
}
