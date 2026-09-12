/**
 * YouTube utility functions for parsing links, extracting video IDs,
 * generating responsive embed links, and generating watch links.
 */

export function parseYoutubeId(urlOrId: string | null | undefined): string | null {
  if (!urlOrId || typeof urlOrId !== "string") return null;

  const trimmed = urlOrId.trim();
  if (!trimmed) return null;

  // If already an 11-char alphanumeric/dash/underscore ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    // Check standard match patterns
    // e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ
    // e.g. https://youtu.be/dQw4w9WgXcQ?si=...
    // e.g. https://www.youtube.com/embed/dQw4w9WgXcQ
    // e.g. https://www.youtube.com/shorts/dQw4w9WgXcQ
    // e.g. https://m.youtube.com/watch?v=dQw4w9WgXcQ
    const patterns = [
      /(?:youtube\.com\/watch\?.*v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/i,
      /^([a-zA-Z0-9_-]{11})$/
    ];

    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    // Try URL parsing
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const parsed = new URL(trimmed);
      if (parsed.searchParams.has("v")) {
        const v = parsed.searchParams.get("v");
        if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
      }
    }
  } catch {
    // If URL parsing fails, fallback null
  }

  return null;
}

export function getYoutubeEmbedUrl(
  urlOrId: string | null | undefined,
  fallback = "Y7VWtTgX0Rc"
): string {
  const videoId = parseYoutubeId(urlOrId) || fallback;
  return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
}

export function getYoutubeWatchUrl(
  urlOrId: string | null | undefined,
  fallback = "Y7VWtTgX0Rc"
): string {
  const videoId = parseYoutubeId(urlOrId) || fallback;
  return `https://youtu.be/${videoId}`;
}
