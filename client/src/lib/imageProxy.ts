const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop";

export function getProxiedImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) return DEFAULT_IMAGE;
  if (imageUrl.includes("cdamdong.co.kr")) {
    return `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`;
  }
  return imageUrl;
}

export { DEFAULT_IMAGE };
