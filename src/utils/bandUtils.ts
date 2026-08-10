export function cleanBandId(bandId?: string): string {
  if (!bandId) return 'bakandeya';
  return bandId.replace(/^(band|reg)-/, '');
}

export function isSameBandId(id1?: string, id2?: string): boolean {
  if (!id1 && !id2) return true;
  if (!id1 || !id2) return false;
  if (id1 === id2) return true;
  return cleanBandId(id1) === cleanBandId(id2);
}
