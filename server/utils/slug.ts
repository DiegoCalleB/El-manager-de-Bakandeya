export function slugify(text: string): string {
  return String(text || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents/diacritics
    .replace(/[^a-z0-9]+/g, "-")     // Replace non-alphanumeric chars with hyphen
    .replace(/^-+|-+$/g, "");        // Trim leading/trailing hyphens
}

export function generateUniqueSlugId(prefix: string, rawName: string, existingIds: Set<string>): string {
  const baseSlug = slugify(rawName) || "id";
  let candidate = `${prefix}-${baseSlug}`;
  let counter = 1;
  while (existingIds.has(candidate)) {
    counter++;
    candidate = `${prefix}-${baseSlug}-${counter}`;
  }
  return candidate;
}
