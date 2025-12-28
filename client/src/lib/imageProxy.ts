const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=500&h=500&fit=crop";

export function getProxiedImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) return DEFAULT_IMAGE;
  if (imageUrl.includes("cdamdong.co.kr")) {
    return `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`;
  }
  return imageUrl;
}

export { DEFAULT_IMAGE };
