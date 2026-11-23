import { createContext, useContext } from 'react';
import { buildSlugIndex } from './slug';
import { withReviewedContent } from './catalogueContent';

export type PublicHack = {
  id: string; title: string; created_at: string;
  author: string; description: string; base_game: string; platform: string;
  status: string; rating: number; cover_image: string; download_link: string;
  screenshots: unknown; features: unknown;
};
export const CatalogueContext = createContext<PublicHack[] | null>(null);
export const useCatalogue = () => useContext(CatalogueContext);
export const catalogueIndex = (rows: PublicHack[]) => buildSlugIndex(rows.map(row => ({ ...row, createdAt: row.created_at })));
export function catalogueCards(rows: PublicHack[]) {
  const index = catalogueIndex(rows);
  return rows.map(withReviewedContent).map(h => ({
    id: h.id, slug: index.get(h.id), title: h.title, author: h.author || '',
    description: h.description || '', rating: h.rating || 0, baseGame: h.base_game || '',
    platform: h.platform || '', status: h.status || '', coverImage: h.cover_image || '', createdAt: h.created_at,
  }));
}
