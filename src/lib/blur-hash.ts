import { getPlaiceholder } from 'plaiceholder';

/**
 * Generate blur data URL for Next.js Image placeholder
 * @param src - Image source (local path or URL)
 * @returns Base64 blur data URL
 */
export async function getBlurDataURL(src: string): Promise<string> {
  try {
    // For remote images, fetch first
    if (src.startsWith('http')) {
      const response = await globalThis.fetch(src);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = globalThis.Buffer.from(arrayBuffer);
      const { base64 } = await getPlaiceholder(buffer);
      return base64;
    }

    // For local images
    const { base64 } = await getPlaiceholder(src);
    return base64;
  } catch {
    // Fallback: solid gray blur
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  }
}

/**
 * Generate blur data URLs for multiple images in parallel
 */
export async function getBlurDataURLs(
  sources: string[]
): Promise<Record<string, string>> {
  const results = await Promise.allSettled(
    sources.map(async (src) => {
      const blurDataURL = await getBlurDataURL(src);
      return { src, blurDataURL };
    })
  );

  const blurMap: Record<string, string> = {};
  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      blurMap[result.value.src] = result.value.blurDataURL;
    }
  });

  return blurMap;
}
