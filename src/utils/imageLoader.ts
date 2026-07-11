const images = import.meta.glob<{ default: string }>('../assets/images/*.jpg', { eager: true });

/**
 * Given a path, filename, legacy url, or hashed url,
 * resolves it dynamically to the current build's bundled asset URL,
 * or falls back to a clean public/images path.
 * This completely heals any old hashed URLs stored in the user's localStorage!
 */
export const getImageUrl = (pathOrUrl: string): string => {
  if (!pathOrUrl) return "";

  // 1. If it's a data URL, blob, or an external HTTP/S URL (not from our assets folder or localhost), return it.
  if (pathOrUrl.startsWith('data:') || pathOrUrl.startsWith('blob:')) {
    return pathOrUrl;
  }

  const isHttp = pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://');
  const isInternalAsset = isHttp && (pathOrUrl.includes('/assets/') || pathOrUrl.includes('/images/'));

  if (isHttp && !isInternalAsset) {
    // True external HTTP URL, return as is
    return pathOrUrl;
  }

  // 2. Extract and sanitize the filename
  let filename = pathOrUrl.split('/').pop() || "";
  
  // Clean query parameters or hashes in the filename
  filename = filename.split('?')[0].split('#')[0];

  // Self-healing: Strip Vite build-time hashes (e.g., "filename-Cqy6kx94.jpg" -> "filename.jpg")
  filename = filename.replace(/-[a-zA-Z0-9]{8}\.jpg$/i, '.jpg');
  filename = filename.replace(/-[a-zA-Z0-9]{8}\.png$/i, '.png');

  // 3. Look up the sanitized filename in Vite's compiled asset glob!
  // This is extremely robust because Vite generates absolute, correct URLs relative to the base directory.
  const matchKey = Object.keys(images).find(p => p.toLowerCase().endsWith(`/${filename.toLowerCase()}`));
  if (matchKey) {
    const imgModule = images[matchKey];
    if (imgModule) {
      if (typeof imgModule === 'object' && 'default' in imgModule) {
        return imgModule.default;
      }
      if (typeof imgModule === 'string') {
        return imgModule;
      }
    }
  }

  // 4. Fallback: If not found in the bundler glob, build a dynamically-resolved URL to the public folder.
  let baseUrl = '';
  try {
    const metaUrl = import.meta.url;
    if (metaUrl.includes('/assets/')) {
      baseUrl = metaUrl.split('/assets/')[0];
    } else if (metaUrl.includes('/src/')) {
      baseUrl = metaUrl.split('/src/')[0];
    } else {
      baseUrl = window.location.origin + window.location.pathname.replace(/\/?[^\/]*$/, '');
    }
  } catch (e) {
    baseUrl = '';
  }

  if (baseUrl && !baseUrl.endsWith('/')) {
    baseUrl += '/';
  }

  return `${baseUrl}images/${filename}`;
};
