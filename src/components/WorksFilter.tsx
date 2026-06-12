'use client'

import { useState, useMemo } from 'react'
import type { Artwork } from '@/data/catalog'
import MasonryGrid from './MasonryGrid'
import styles from './WorksFilter.module.css'

type Props = { artworks: Artwork[] }

type SortKey = 'default' | 'year-desc' | 'year-asc' | 'size-desc' | 'size-asc'

function parseArea(dimensions: string): number {
  const match = dimensions.match(/([\d.]+)\s*[×x]\s*([\d.]+)/)
  if (!match) return 0
  return parseFloat(match[1]) * parseFloat(match[2])
}

function mediumGroup(medium: string): string {
  const m = medium.toLowerCase()
  if (m.includes('oil')) return 'Oil'
  if (m.includes('charcoal')) return 'Charcoal'
  if (m.includes('graphite')) return 'Graphite'
  if (m.includes('ink')) return 'Ink'
  return 'Other'
}

export default function WorksFilter({ artworks }: Props) {
  const [medium, setMedium] = useState('All')
  const [year, setYear] = useState('All')
  const [sort, setSort] = useState<SortKey>('default')

  const mediumGroups = useMemo(() => {
    const seen = new Set<string>()
    artworks.forEach(a => seen.add(mediumGroup(a.medium)))
    return ['All', ...Array.from(seen).sort()]
  }, [artworks])

  const years = useMemo(() => {
    const seen = new Set<number>()
    artworks.forEach(a => seen.add(a.year))
    return ['All', ...Array.from(seen).sort((a, b) => b - a).map(String)]
  }, [artworks])

  const filtered = useMemo(() => {
    let result = artworks.filter(a => {
      if (medium !== 'All' && mediumGroup(a.medium) !== medium) return false
      if (year !== 'All' && String(a.year) !== year) return false
      return true
    })

    if (sort === 'year-desc') result = [...result].sort((a, b) => b.year - a.year)
    else if (sort === 'year-asc') result = [...result].sort((a, b) => a.year - b.year)
    else if (sort === 'size-desc') result = [...result].sort((a, b) => parseArea(b.dimensions) - parseArea(a.dimensions))
    else if (sort === 'size-asc') result = [...result].sort((a, b) => parseArea(a.dimensions) - parseArea(b.dimensions))

    return result
  }, [artworks, medium, year, sort])

  const activeFilters = (medium !== 'All' ? 1 : 0) + (year !== 'All' ? 1 : 0)

  return (
    <>
      <div className={styles.controls}>
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel} htmlFor="filter-medium">Medium</label>
            <select
              id="filter-medium"
              className={styles.select}
              value={medium}
              onChange={e => setMedium(e.target.value)}
            >
              {mediumGroups.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel} htmlFor="filter-year">Year</label>
            <select
              id="filter-year"
              className={styles.select}
              value={year}
              onChange={e => setYear(e.target.value)}
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {activeFilters > 0 && (
            <button
              className={styles.clearBtn}
              onClick={() => { setMedium('All'); setYear('All') }}
            >
              Clear filters
            </button>
          )}
        </div>

        <div className={styles.sortGroup}>
          <label className={styles.filterLabel} htmlFor="sort">Sort</label>
          <select
            id="sort"
            className={styles.select}
            value={sort}
            onChange={e => setSort(e.target.value as SortKey)}
          >
            <option value="default">Default</option>
            <option value="year-desc">Year: newest first</option>
            <option value="year-asc">Year: oldest first</option>
            <option value="size-desc">Size: largest first</option>
            <option value="size-asc">Size: smallest first</option>
          </select>
        </div>
      </div>

      <div className={styles.resultCount}>
        {filtered.length === artworks.length
          ? `${artworks.length} pieces`
          : `${filtered.length} of ${artworks.length} pieces`}
      </div>

      {filtered.length === 0
        ? <p className={styles.empty}>No pieces match the selected filters.</p>
        : <MasonryGrid artworks={filtered} />
      }
    </>
  )
}
