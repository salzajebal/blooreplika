const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop";

type ImageSize = "thumb" | "medium" | "large" | "mobile";

const SIZE_CONFIG: Record<ImageSize, { width: number; quality: number }> = {
  mobile: { width: 400, quality: 75 },
  thumb: { width: 500, quality: 75 },
  medium: { width: 800, quality: 80 },
  large: { width: 1200, quality: 85 },
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
  
  // Auto-select mobile size for smaller screens if not explicitly set
  const effectiveSize = size === "thumb" && isMobile() ? "mobile" : size;
  const config = SIZE_CONFIG[effectiveSize];
  
  if (imageUrl.includes("cdamdong.co.kr")) {
    return `/api/image-proxy?url=${encodeURIComponent(imageUrl)}&w=${config.width}&q=${config.quality}`;
  }
  
  if (imageUrl.includes("cdn.shopify.com")) {
    return `/api/image-proxy?url=${encodeURIComponent(imageUrl)}&w=${config.width}&q=${config.quality}`;
  }

  if (imageUrl.includes("pliki.wisacdn.com")) {
    return `/api/image-proxy?url=${encodeURIComponent(imageUrl)}&w=1600&q=95`;
  }

  if (imageUrl.includes("bagstyle.site")) {
    return `/api/image-proxy?url=${encodeURIComponent(imageUrl)}&w=${config.width}&q=${config.quality}`;
  }
  
  return imageUrl;
}

export { DEFAULT_IMAGE };
