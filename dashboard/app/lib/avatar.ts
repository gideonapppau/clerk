/** Deterministic avatars via https://navii.dev — seed with stable user id or email. */
export function naviiAvatarUrl(seed: string, size = 96): string {
  const encoded = encodeURIComponent(seed)
  return `https://api.navii.dev/avatar/${encoded}.png?size=${size}&mood=happy&background=ring`
}

/** Friendly label from email local-part (e.g. gideonad.codez → Gideonad Codez). */
export function displayNameFromEmail(email?: string | null, fallback = 'there'): string {
  if (!email?.includes('@')) return fallback
  const local = email.split('@')[0] ?? email
  return local
    .replace(/[._-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}
