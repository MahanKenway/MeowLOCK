/**
 * Stable, high-reliability image asset URL resolver for MeowLOCK.
 * Bypasses relative Vite asset bundling/hashing and resolves all assets
 * to absolute URLs pointing to the public folder.
 * This completely immunizes the application from the classic GitHub Pages
 * missing-trailing-slash bug and heals stale hashed/timestamped URLs in localStorage!
 */

const ACTUAL_FILES = [
  "alt_girl_guitar_1783522640792.jpg",
  "alt_girl_mcr_1783522601327.jpg",
  "alt_girl_silverstein_1783522621638.jpg",
  "cat_guitar_pixel_1783708296051.jpg",
  "garage_pixel_art_1783441014712.jpg",
  "pixel_autumn_treehouse_1783526999098.jpg",
  "pixel_cabin_fireplace_1783255440529.jpg",
  "pixel_cyberpunk_terminal_1783255416278.jpg",
  "pixel_greenhouse_rain_1_1783526740989.jpg",
  "pixel_laundromat_night_1_1783526896576.jpg",
  "pixel_magic_library_1783621820640.jpg",
  "pixel_magic_library_1_1783526856865.jpg",
  "pixel_misty_forest_1783255428671.jpg",
  "pixel_music_studio_true_1783620947171.jpg",
  "pixel_rain_cafe_1783255402157.jpg",
  "pixel_rainy_cafe_v1_1783524939912.jpg",
  "pixel_rainy_study_1783621791241.jpg",
  "pixel_retro_arcade_1_1783526723869.jpg",
  "pixel_rooftop_twilight_1_1783526707514.jpg",
  "pixel_snowy_cabin_v1_1783524959716.jpg",
  "pixel_space_station_1783527015716.jpg",
  "pixel_study_corner_1783255382430.jpg",
  "pixel_sunset_subway_v1_1783524979144.jpg",
  "pixel_underwater_room_1_1783526880519.jpg",
  "pixel_zen_garden_1783527032340.jpg",
  "pixel_zen_garden_1783621805799.jpg",
  "setareh_pixel_coding_v2_1783524546639.jpg",
  "setareh_pixel_relax_v2_1783524564086.jpg",
  "setareh_pixel_study_v2_1783524583594.jpg",
  "study_girl_1_1783458443182.jpg",
  "study_girl_2_1783458463989.jpg"
];

const getCleanBaseName = (file: string): string => {
  let name = file.toLowerCase();
  // Strip extension
  const dotIndex = name.lastIndexOf('.');
  if (dotIndex !== -1) {
    name = name.substring(0, dotIndex);
  }
  // Strip trailing hash/timestamp suffix like _1783524583594 or -Cqy6kx94
  // Remove 8-char Vite-style hash (e.g. -cqy6kx94)
  name = name.replace(/-[a-z0-9]{8}$/i, '');
  // Remove 10-15 digit timestamp (e.g. _1783524583594 or -1783524583594)
  name = name.replace(/[-_]\d{10,15}$/, '');
  return name;
};

export const getImageUrl = (pathOrUrl: string): string => {
  if (!pathOrUrl) return "";

  // 1. If it's a pre-resolved Vite asset, or starts with data/blob, return it immediately as is
  if (
    pathOrUrl.includes('/assets/') || 
    pathOrUrl.startsWith('assets/') || 
    pathOrUrl.startsWith('/@fs/') || 
    pathOrUrl.startsWith('data:') || 
    pathOrUrl.startsWith('blob:')
  ) {
    return pathOrUrl;
  }

  // If it is a true external URL, return it
  const isHttp = pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://');
  const isInternalAsset = isHttp && (pathOrUrl.includes('/assets/') || pathOrUrl.includes('/images/'));

  if (isHttp && !isInternalAsset) {
    return pathOrUrl;
  }

  // 2. Extract just the filename and sanitize it
  let filename = pathOrUrl.split('/').pop() || "";
  filename = filename.split('?')[0].split('#')[0];

  // Self-healing: Check for an exact filename match first to avoid colliding fallback paths
  const exactMatch = ACTUAL_FILES.find(realFile => realFile.toLowerCase() === filename.toLowerCase());
  let matchedRealFile = filename;

  if (exactMatch) {
    matchedRealFile = exactMatch;
  } else {
    // If no exact match (e.g. from a slightly modified hashed URL), fallback to clean name matching
    const cleanInput = getCleanBaseName(filename);
    const matchedReal = ACTUAL_FILES.find(realFile => {
      const cleanReal = getCleanBaseName(realFile);
      return cleanReal === cleanInput;
    });
    
    if (matchedReal) {
      matchedRealFile = matchedReal;
    } else {
      // CRITICAL FALLBACK: If the file is not found in ACTUAL_FILES at all, 
      // fallback to the default background (Setareh Study Mode) to prevent a blank/broken black background!
      matchedRealFile = "setareh_pixel_study_v2_1783524583594.jpg";
    }
  }

  // 3. Use Vite's native dynamic asset resolution (import.meta.glob)
  // This automatically compiles and bundles images from src/assets/images/ during build,
  // making them 100% compatible with GitHub Pages, custom domains, and subdirectories.
  try {
    const imageModules = import.meta.glob<{ default: string }>("../assets/images/*.{png,jpg,jpeg,gif,webp,svg}", { eager: true });
    const globKey = `../assets/images/${matchedRealFile}`;
    if (imageModules[globKey]) {
      return imageModules[globKey].default;
    }
  } catch (e) {
    console.warn("Failed to dynamically load asset via import.meta.glob:", e);
  }

  // 4. Fallback to absolute base path resolution (e.g. public/images/ folder)
  let baseUrl = "/";
  try {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
    
    if (hostname.endsWith('.github.io')) {
      const segments = pathname.split('/').filter(Boolean);
      if (segments.length > 0) {
        baseUrl = `/${segments[0]}/`;
      }
    } else if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('ais-dev') || hostname.includes('ais-pre')) {
      // Always root-level for local development and AI Studio container environments
      baseUrl = "/";
    } else {
      // For any other custom host, if it's deployed in a subdirectory, auto-detect it
      const segments = pathname.split('/').filter(Boolean);
      // If the last segment is a file, remove it
      if (segments.length > 0 && /\.[a-z0-9]+$/i.test(segments[segments.length - 1])) {
        segments.pop();
      }
      if (segments.length > 0) {
        baseUrl = `/${segments.join('/')}/`;
      }
    }
  } catch (e) {
    baseUrl = "/";
  }

  // Ensure baseUrl starts and ends with a slash
  if (!baseUrl.startsWith('/')) baseUrl = '/' + baseUrl;
  if (!baseUrl.endsWith('/')) baseUrl = baseUrl + '/';

  return `${baseUrl}images/${matchedRealFile}`;
};
