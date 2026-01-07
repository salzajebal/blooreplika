const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop";

type ImageSize = "thumb" | "medium" | "large" | "mobile";

const SIZE_CONFIG: Record<ImageSize, { width: number; quality: number }> = {
  mobile: { width: 200, quality: 60 },
  thumb: { width: 400, quality: 70 },
  medium: { width: 800, quality: 75 },
  large: { width: 1200, quality: 80 },
};

export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

export function getProxiedImageUrl(
  imageUrl: string | null | undefined,
  size: ImageSize = "thumb"
): string {
  if (!imageUrl) return DEFAULT_IMAGE;
  
  const config = SIZE_CONFIG[size];
  
  if (imageUrl.includes("cdamdong.co.kr")) {
    return `/api/image-proxy?url=${encodeURIComponent(imageUrl)}&w=${config.width}&q=${config.quality}`;
  }
  
  if (imageUrl.includes("cdn.shopify.com")) {
    return `/api/image-proxy?url=${encodeURIComponent(imageUrl)}&w=${config.width}&q=${config.quality}`;
  }
  
  return imageUrl;
}

export { DEFAULT_IMAGE };
