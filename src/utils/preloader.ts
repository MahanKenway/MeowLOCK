/**
 * High-performance progressive pre-caching mechanism for Workspace Studio.
 * Preloads pixel-art backgrounds and expressive typography fonts in a non-blocking sequence,
 * preventing layout shift, flash of unstyled text (FOUT), and mode-switching visual flicker.
 */

// List of font families used in clock styles
export const FONT_FAMILIES = [
  "Outfit",
  "Playfair Display",
  "Share Tech Mono",
  "Righteous",
  "Audiowide",
  "VT323",
  "Press Start 2P",
  "Monoton",
  "Rubik Glitch",
  "UnifrakturMaguntia",
  "Sacramento",
  "Pacifico",
  "Silkscreen",
  "Comfortaa",
  "Abril Fatface",
  "Creepster",
  "Architects Daughter",
  "Sedgwick Ave",
  "Major Mono Display",
  "Special Elite",
  "Londrina Outline",
  "DotGothic16",
  "Kablammo",
  "Bebas Neue",
  "Cinzel",
  "Lobster",
  "DM Serif Display"
];

// Fallback list of preset backgrounds if not dynamic
export const PRESET_BACKGROUNDS = [
  "./images/setareh_pixel_study_v2_1783524583594.jpg",
  "./images/setareh_pixel_coding_v2_1783524546639.jpg",
  "./images/setareh_pixel_relax_v2_1783524564086.jpg",
  "./images/pixel_rainy_cafe_v1_1783524939912.jpg",
  "./images/pixel_snowy_cabin_v1_1783524959716.jpg",
  "./images/pixel_sunset_subway_v1_1783524979144.jpg",
  "./images/pixel_rooftop_twilight_1_1783526707514.jpg",
  "./images/pixel_retro_arcade_1_1783526723869.jpg",
  "./images/pixel_greenhouse_rain_1_1783526740989.jpg",
  "./images/pixel_magic_library_1_1783526856865.jpg",
  "./images/pixel_underwater_room_1_1783526880519.jpg",
  "./images/pixel_laundromat_night_1_1783526896576.jpg",
  "./images/pixel_autumn_treehouse_1783526999098.jpg",
  "./images/pixel_space_station_1783527015716.jpg",
  "./images/pixel_zen_garden_1783527032340.jpg",
  "./images/garage_pixel_art_1783441014712.jpg",
  "./images/study_girl_1_1783458443182.jpg",
  "./images/study_girl_2_1783458463989.jpg",
  "./images/pixel_study_corner_1783255382430.jpg",
  "./images/pixel_rain_cafe_1783255402157.jpg",
  "./images/pixel_cyberpunk_terminal_1783255416278.jpg",
  "./images/pixel_misty_forest_1783255428671.jpg",
  "./images/pixel_cabin_fireplace_1783255440529.jpg",
  "./images/pixel_music_studio_true_1783620947171.jpg",
  "./images/pixel_rainy_study_1783621791241.jpg",
  "./images/pixel_zen_garden_1783621805799.jpg",
  "./images/pixel_magic_library_1783621820640.jpg"
];

/**
 * Preloads a single image asset using browser Image object.
 */
export function preloadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (!url) {
      resolve(new Image());
      return;
    }
    const img = new Image();
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.warn(`[Preloader] Failed to cache image: ${url}`);
      // Resolve anyway to prevent blocking the sequence queue
      resolve(img);
    };
  });
}

/**
 * Preloads a single font face family by prompting the FontFaceSet.
 */
export async function preloadFont(family: string): Promise<boolean> {
  if (typeof window === "undefined" || !("fonts" in document)) {
    return false;
  }
  try {
    // Generates a mock render request to force browser to load custom Google Web Font WOFF2
    await (document as any).fonts.load(`1em "${family}"`);
    return true;
  } catch (e) {
    console.warn(`[Preloader] Failed to cache font family: ${family}`, e);
    return false;
  }
}

interface PreloadOptions {
  activeBgUrl?: string;
  activeFontClass?: string;
  onImagePreloaded?: (url: string) => void;
  onFontPreloaded?: (family: string) => void;
}

/**
 * Asynchronously pre-caches all critical assets and fonts.
 * Prioritizes active items first, then loads the rest sequentially using micro-tasks.
 */
export async function preloadAppAssets(options: PreloadOptions = {}) {
  // 1. Prioritized Phase: Active Background & Active Fonts
  const activeBg = options.activeBgUrl;
  const activeFontFamily = options.activeFontClass 
    ? FONT_FAMILIES.find(f => options.activeFontClass?.includes(f.toLowerCase().replace(/\s+/g, "")))
    : null;

  const priorityPromises: Promise<any>[] = [];

  if (activeBg) {
    priorityPromises.push(
      preloadImage(activeBg).then(() => {
        if (options.onImagePreloaded) options.onImagePreloaded(activeBg);
      })
    );
  }

  if (activeFontFamily) {
    priorityPromises.push(
      preloadFont(activeFontFamily).then(() => {
        if (options.onFontPreloaded) options.onFontPreloaded(activeFontFamily);
      })
    );
  }

  // Always load a couple of highly common core fallback fonts quickly
  const commonFonts = ["Outfit", "Playfair Display", "Share Tech Mono", "VT323"];
  commonFonts.forEach(f => {
    if (f !== activeFontFamily) {
      priorityPromises.push(
        preloadFont(f).then(() => {
          if (options.onFontPreloaded) options.onFontPreloaded(f);
        })
      );
    }
  });

  // Await priority assets first so they render immediately without flicker
  await Promise.all(priorityPromises);

  // 2. Progressive Phase: Load remaining assets in non-blocking chunks
  // We schedule them on requestIdleCallback or setTimeout to keep the main thread fluid.
  const scheduleJob = typeof window !== "undefined" && "requestIdleCallback" in window
    ? (window as any).requestIdleCallback
    : (cb: any) => setTimeout(cb, 100);

  scheduleJob(async () => {
    // Pre-cache fonts sequentially
    for (const font of FONT_FAMILIES) {
      if (font !== activeFontFamily && !commonFonts.includes(font)) {
        await preloadFont(font);
        if (options.onFontPreloaded) options.onFontPreloaded(font);
      }
    }

    // Pre-cache remaining background images in progressive chunks
    const remainingBgs = PRESET_BACKGROUNDS.filter(bg => bg !== activeBg);
    
    // Load images in small batches of 3 to prevent network throttling
    const batchSize = 3;
    for (let i = 0; i < remainingBgs.length; i += batchSize) {
      const batch = remainingBgs.slice(i, i + batchSize);
      await Promise.all(batch.map(bg => 
        preloadImage(bg).then(() => {
          if (options.onImagePreloaded) options.onImagePreloaded(bg);
        })
      ));
      
      // Yield to main thread for 150ms before fetching the next batch
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    
    console.log("[Preloader] Progressive background caching completed successfully.");
  });
}
