import { catalog, getArtwork } from '@/data/catalog'

describe('catalog', () => {
  test('every entry has required fields with valid values', () => {
    catalog.forEach((artwork) => {
      expect(artwork.slug).toBeTruthy()
      expect(artwork.title).toBeTruthy()
      expect(artwork.year).toBeGreaterThan(1900)
      expect(artwork.medium).toBeTruthy()
      expect(artwork.dimensions).toBeTruthy()
      expect(artwork.price).toBeGreaterThan(0)
      expect(typeof artwork.available).toBe('boolean')
      expect(artwork.image).toMatch(/^(\/images\/.+\.(jpg|jpeg|png|webp)|https:\/\/.+)$/)
      expect(artwork.imageWidth).toBeGreaterThan(0)
      expect(artwork.imageHeight).toBeGreaterThan(0)
    })
  })

  test('slugs are unique across catalog', () => {
    const slugs = catalog.map(a => a.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  test('getArtwork returns artwork by slug', () => {
    const first = catalog[0]
    expect(getArtwork(first.slug)).toEqual(first)
  })

  test('getArtwork returns undefined for unknown slug', () => {
    expect(getArtwork('does-not-exist')).toBeUndefined()
  })
})
