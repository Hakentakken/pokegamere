import { catalogueDescriptionRevisions } from '../data/catalogueDescriptions.js';

type ContentRow = { id: string; title?: string | null; description?: string | null; status?: string | null };
const revisions = new Map(catalogueDescriptionRevisions.map(revision => [revision.id, revision]));

/** Apply reviewed copy only to the exact version reviewed. New admin copy wins.
 * Never replaces a row or touches its media, links, features, rating or identity.
 * Partial projections (e.g. sitemaps) are returned without adding extra fields. */
export function withReviewedContent<T extends ContentRow>(row: T): T {
  const revision = revisions.get(row.id);
  if (!revision || row.title !== revision.title || row.description !== revision.previousDescription) return row;
  return {
    ...row,
    description: revision.description,
    ...(revision.status && row.status === revision.previousStatus ? { status: revision.status } : {}),
  };
}
