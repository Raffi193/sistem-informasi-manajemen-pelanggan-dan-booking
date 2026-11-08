const IMAGE_EXTENSION_RE = /\.(avif|gif|jpe?g|png|webp)(?:[?#].*)?$/i;

export function isImageUrl(value: string | null | undefined): value is string {
  return Boolean(value && IMAGE_EXTENSION_RE.test(value));
}
