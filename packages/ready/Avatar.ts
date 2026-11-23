export type AvatarProps = {
  /** The accessible label of the avatar; pass "" when decorative. */
  alt: string;
  src?: string;
  /** Optional visible fallback; an empty or whitespace-only fallback uses initials. */
  fallback?: string;
};

export function resolveAvatar({ alt, src, fallback }: AvatarProps) {
  if (typeof alt !== 'string' || (alt !== '' && alt.trim() === ''))
    throw new TypeError('Ready Avatar: alt must be a non-blank label, or "" for a decorative avatar.');

  const words = alt.trim().normalize('NFC').split(/\s+/);
  const initials = (words.length > 1
    ? [Array.from(words[0])[0], Array.from(words[words.length - 1])[0]].join('')
    : Array.from(words[0]).slice(0, 2).join('')
  ).toUpperCase();

  return {
    source: src?.trim() || undefined,
    label: alt || undefined,
    text: fallback?.trim() || initials || '?',
  };
}
