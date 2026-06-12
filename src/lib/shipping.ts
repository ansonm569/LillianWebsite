import type { Artwork } from '@/data/catalog'

// Flat domestic (US) shipping rates in cents, by how the piece ships
// (see the Shipping & delivery section on /commissions):
// - works on paper roll into rigid archival tubes
// - canvas and board pieces ship flat in crates or reinforced flat packs
//
// Adjust these two numbers to change what buyers are charged.
const PAPER_TUBE_CENTS = 2500 // $25
const CRATE_CENTS = 7500 // $75

export function shippingCents(artwork: Pick<Artwork, 'medium'>): number {
  return /paper/i.test(artwork.medium) ? PAPER_TUBE_CENTS : CRATE_CENTS
}
