import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Rocket,
  Calendar,
  Clock,
  MapPin,
  Map,
  Award,
  DollarSign,
  Users,
  Globe,
  Building,
  TrendingUp,
  Compass,
  Satellite,
  Activity,
  Video,
  Volume2,
  VolumeX,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Info,
  CheckCircle2,
  XCircle,
  HelpCircle
} from "lucide-react";

// Types for SpaceX Dashboard Data
interface NextLaunch {
  name: string;
  rocket: string;
  rocketName?: string;
  date_utc: string;
  launchpad: string;
  launchpadName?: string;
  details: string;
  patch: string;
  webcast: string;
  wikipedia: string;
  id: string;
}

interface RocketInfo {
  id: string;
  name: string;
  images: string[];
  height: { meters: number; feet: number };
  diameter: { meters: number; feet: number };
  mass: { kg: number; lb: number };
  stages: number;
  success_rate: number;
  cost_per_launch: number;
  wikipedia: string;
  description: string;
}

interface CompanyStats {
  founded: number;
  ceo: string;
  employees: number;
  valuation: number;
  headquarters: { address: string; city: string; state: string };
  launches: number;
}

interface LaunchpadInfo {
  id: string;
  name: string;
  full_name: string;
  locality: string;
  region: string;
  latitude: number;
  longitude: number;
  images: string[];
  details: string;
}

interface StarlinkStats {
  total: number;
  active: number;
  avgAltitude: number;
  avgVelocity: number;
}

interface RecentLaunch {
  id: string;
  name: string;
  patch: string;
  success: boolean | null;
  rocketName: string;
  date_utc: string;
}

interface SpaceXData {
  nextLaunch: NextLaunch;
  upcomingLaunches: NextLaunch[];
  rockets: RocketInfo[];
  company: CompanyStats;
  launchpads: LaunchpadInfo[];
  starlink: StarlinkStats;
  recentLaunches: RecentLaunch[];
}

// Robust Fallback Data in case the API is offline
const FALLBACK_SPACEX_DATA: SpaceXData = {
  nextLaunch: {
    name: "Crew-12",
    rocket: "5e9d0d95eda69973a809d1ec",
    rocketName: "Falcon 9",
    date_utc: "2026-08-28T14:30:00.000Z", // Scheduled for August 2026 (relative to current date July 2026)
    launchpad: "5e9e4502f509094188566f88",
    launchpadName: "KSC LC-39A",
    details: "SpaceX's twelfth operational Crew Dragon mission to the International Space Station, carrying a multinational crew of four astronauts to continue vital scientific research.",
    patch: "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?auto=format&fit=crop&w=120&q=80",
    webcast: "https://www.youtube.com/spacex",
    wikipedia: "https://en.wikipedia.org/wiki/SpaceX_Crew-12",
    id: "crew-12-fallback"
  },
  upcomingLaunches: [
    {
      name: "Crew-12",
      rocket: "5e9d0d95eda69973a809d1ec",
      rocketName: "Falcon 9",
      date_utc: "2026-08-28T14:30:00.000Z",
      launchpad: "5e9e4502f509094188566f88",
      launchpadName: "KSC LC-39A",
      details: "SpaceX's twelfth operational Crew Dragon mission to the International Space Station, carrying a multinational crew of four astronauts to continue vital scientific research.",
      patch: "",
      webcast: "https://www.youtube.com/spacex",
      wikipedia: "https://en.wikipedia.org/wiki/SpaceX_Crew-12",
      id: "crew-12-fallback"
    },
    {
      name: "Starlink Group 8-1",
      rocket: "5e9d0d95eda69973a809d1ec",
      rocketName: "Falcon 9",
      date_utc: "2026-09-24T06:12:00.000Z",
      launchpad: "5e9e4501f509094ba4566f84",
      launchpadName: "CCSFS SLC-40",
      details: "A batch of Starlink satellites to the low Earth orbit constellation to expand orbital internet coverage globally.",
      patch: "",
      webcast: "https://www.youtube.com/spacex",
      wikipedia: "https://en.wikipedia.org/wiki/Starlink",
      id: "starlink-8-1-upcoming"
    },
    {
      name: "USSF-44 Mission",
      rocket: "5e9d0d95eda69973a809d1ed",
      rocketName: "Falcon Heavy",
      date_utc: "2026-10-05T18:00:00.000Z",
      launchpad: "5e9e4502f509094188566f88",
      launchpadName: "KSC LC-39A",
      details: "Classified payload launch for the United States Space Force utilizing the massive lift capacity of Falcon Heavy.",
      patch: "",
      webcast: "https://www.youtube.com/spacex",
      wikipedia: "https://en.wikipedia.org/wiki/Falcon_Heavy",
      id: "ussf44-upcoming"
    }
  ],
  rockets: [
    {
      id: "falcon9",
      name: "Falcon 9",
      images: ["https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?auto=format&fit=crop&w=800&q=80"],
      height: { meters: 70, feet: 229.6 },
      diameter: { meters: 3.7, feet: 12 },
      mass: { kg: 549054, lb: 1207920 },
      stages: 2,
      success_rate: 98.9,
      cost_per_launch: 67000000,
      wikipedia: "https://en.wikipedia.org/wiki/Falcon_9",
      description: "Falcon 9 is a reusable, two-stage rocket designed and manufactured by SpaceX for the reliable and safe transport of people and payloads into Earth orbit and beyond."
    },
    {
      id: "falconheavy",
      name: "Falcon Heavy",
      images: ["https://images.unsplash.com/photo-1610296669228-602fa827fc1f?auto=format&fit=crop&w=800&q=80"],
      height: { meters: 70, feet: 229.6 },
      diameter: { meters: 12.2, feet: 39.9 },
      mass: { kg: 1420788, lb: 3125735 },
      stages: 2,
      success_rate: 100,
      cost_per_launch: 97000000,
      wikipedia: "https://en.wikipedia.org/wiki/Falcon_Heavy",
      description: "Falcon Heavy is the most powerful operational rocket in the world by a factor of two, with the ability to lift into orbit nearly 64 metric tons."
    },
    {
      id: "starship",
      name: "Starship",
      images: ["https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?auto=format&fit=crop&w=800&q=80"],
      height: { meters: 121, feet: 397 },
      diameter: { meters: 9, feet: 29.5 },
      mass: { kg: 5000000, lb: 11000000 },
      stages: 2,
      success_rate: 75,
      cost_per_launch: 20000000,
      wikipedia: "https://en.wikipedia.org/wiki/SpaceX_Starship",
      description: "SpaceX's Starship spacecraft and Super Heavy rocket represent a fully reusable transportation system designed to carry both crew and cargo to Earth orbit, the Moon, Mars and beyond."
    }
  ],
  company: {
    founded: 2002,
    ceo: "Elon Musk",
    employees: 13000,
    valuation: 180000000000,
    headquarters: { address: "Rocket Road", city: "Hawthorne", state: "California" },
    launches: 380
  },
  launchpads: [
    {
      id: "vandenberg",
      name: "SLC-4E",
      full_name: "Vandenberg Space Force Base Space Launch Complex 4E",
      locality: "Vandenberg AFB",
      region: "California",
      latitude: 34.632093,
      longitude: -120.610829,
      images: ["https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&w=600&q=80"],
      details: "SpaceX's West Coast launch site, used for polar orbit launches including many Starlink missions."
    },
    {
      id: "ksc_39a",
      name: "LC-39A",
      full_name: "Kennedy Space Center Launch Complex 39A",
      locality: "Cape Canaveral",
      region: "Florida",
      latitude: 28.6082268,
      longitude: -80.6042818,
      images: ["https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?auto=format&fit=crop&w=600&q=80"],
      details: "Historic launch pad from which Apollo 11 and numerous Space Shuttle missions took off, now leased by SpaceX for Falcon 9 and Falcon Heavy launches."
    }
  ],
  starlink: {
    total: 5800,
    active: 5740,
    avgAltitude: 550,
    avgVelocity: 7.6
  },
  recentLaunches: [
    {
      id: "recent-1",
      name: "Starlink G7-10",
      patch: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=80&q=80",
      success: true,
      rocketName: "Falcon 9",
      date_utc: "2026-07-13T10:00:00.000Z"
    },
    {
      id: "recent-2",
      name: "USSF-124",
      patch: "",
      success: true,
      rocketName: "Falcon 9",
      date_utc: "2026-07-09T10:00:00.000Z"
    },
    {
      id: "recent-3",
      name: "PACE Mission",
      patch: "",
      success: true,
      rocketName: "Falcon 9",
      date_utc: "2026-07-03T10:00:00.000Z"
    }
  ]
};

// Caching helper
const CACHE_KEY = "zen_spacex_dashboard_cache";
const CACHE_EXPIRY = 300000; // 5 minutes cache

export default function SpaceXDashboard() {
  const [data, setData] = useState<SpaceXData | null>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.payload) {
          return parsed.payload;
        }
      }
    } catch (e) {
      console.log("Error loading synchronous SpaceX cache", e);
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.payload) {
          return false; // Cache loaded, no need to show loading skeleton
        }
      }
    } catch (e) {}
    return true;
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Sound Synth State
  const [isSoundOn, setIsSoundOn] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillator1Ref = useRef<OscillatorNode | null>(null);
  const oscillator2Ref = useRef<OscillatorNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Active tab inside SpaceX Dashboard
  const [activeSection, setActiveSection] = useState<"next" | "rockets" | "stats" | "launchpads" | "starlink">("next");

  // Specific view selectors
  const [selectedRocketIdx, setSelectedRocketIdx] = useState<number>(0);
  const [selectedLaunchpadIdx, setSelectedLaunchpadIdx] = useState<number>(0);
  const [selectedUpcomingId, setSelectedUpcomingId] = useState<string | null>(null);

  // Countdown timer State
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [launchTriggered, setLaunchTriggered] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.timestamp) {
          return new Date(parsed.timestamp);
        }
      }
    } catch (e) {}
    return null;
  });

  // Computed launch to preview/track
  const currentLaunch = data
    ? (data.upcomingLaunches?.find(l => l.id === selectedUpcomingId) || data.nextLaunch)
    : FALLBACK_SPACEX_DATA.nextLaunch;

  // Fetch API with caching (stale-while-revalidate strategy)
  const fetchSpaceXData = async (force = false) => {
    setIsRefreshing(true);
    setErrorMsg(null);

    // 1. STALE: Try to load from localStorage cache immediately to keep UI responsive
    let cachePayload: SpaceXData | null = null;
    let cacheTimestamp = 0;
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        cachePayload = parsed.payload;
        cacheTimestamp = parsed.timestamp;
        if (cachePayload) {
          setData(cachePayload);
          setIsLoading(false);
          setIsUsingFallback(false);
          if (cacheTimestamp) {
            setLastUpdated(new Date(cacheTimestamp));
          }
        }
      } catch (e) {
        console.error("SpaceX Cache reading error:", e);
      }
    }

    // 2. REVALIDATE: Determine if we need to hit the network
    const isCacheFresh = cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_EXPIRY);
    const shouldFetch = !isCacheFresh || force || !cachePayload;

    if (!shouldFetch) {
      setIsRefreshing(false);
      return;
    }

    try {
      // Fetch concurrent requests from official v5 api for launches (and v4 for other resources)
      const [nextRes, upcomingRes, rocketsRes, companyRes, launchpadsRes, starlinkRes, pastLaunchesRes] = await Promise.all([
        fetch("https://api.spacexdata.com/v5/launches/next").then(r => r.ok ? r.json() : null).catch(() => null),
        fetch("https://api.spacexdata.com/v5/launches/upcoming").then(r => r.ok ? r.json() : null).catch(() => null),
        fetch("https://api.spacexdata.com/v4/rockets").then(r => r.ok ? r.json() : null).catch(() => null),
        fetch("https://api.spacexdata.com/v4/company").then(r => r.ok ? r.json() : null).catch(() => null),
        fetch("https://api.spacexdata.com/v4/launchpads").then(r => r.ok ? r.json() : null).catch(() => null),
        fetch("https://api.spacexdata.com/v4/starlink").then(r => r.ok ? r.json() : null).catch(() => null),
        fetch("https://api.spacexdata.com/v5/launches/past").then(r => r.ok ? r.json() : null).catch(() => null)
      ]);

      // Process upcoming launches first to find the best candidate for the next launch
      let resolvedNextLaunch: NextLaunch = FALLBACK_SPACEX_DATA.nextLaunch;
      let mappedUpcoming: NextLaunch[] = [];

      if (upcomingRes && Array.isArray(upcomingRes)) {
        // Sort ascending by date
        const sortedUpcoming = [...upcomingRes]
          .filter(l => l.date_utc)
          .sort((a, b) => new Date(a.date_utc).getTime() - new Date(b.date_utc).getTime());

        // Find first launch in the future relative to local clock
        const nowMs = Date.now();
        let bestUpcomingCandidate = sortedUpcoming.find(
          l => new Date(l.date_utc).getTime() > nowMs
        );

        // If no future launch found, take the first upcoming one
        if (!bestUpcomingCandidate && sortedUpcoming.length > 0) {
          bestUpcomingCandidate = sortedUpcoming[0];
        }

        // If we found a candidate, let's use it. Otherwise, fallback to nextRes.
        const nextLaunchData = bestUpcomingCandidate || nextRes;

        if (nextLaunchData) {
          let rName = "Falcon 9";
          if (rocketsRes && Array.isArray(rocketsRes)) {
            const foundR = rocketsRes.find((r: any) => r.id === nextLaunchData.rocket);
            if (foundR) rName = foundR.name;
          }

          let lName = "LC-39A";
          if (launchpadsRes && Array.isArray(launchpadsRes)) {
            const foundL = launchpadsRes.find((lp: any) => lp.id === nextLaunchData.launchpad);
            if (foundL) lName = foundL.name;
          }

          resolvedNextLaunch = {
            name: nextLaunchData.name || "Next SpaceX Mission",
            rocket: nextLaunchData.rocket || "",
            rocketName: rName,
            date_utc: nextLaunchData.date_utc || new Date().toISOString(),
            launchpad: nextLaunchData.launchpad || "",
            launchpadName: lName,
            details: nextLaunchData.details || "Details are classified or will be announced soon.",
            patch: nextLaunchData.links?.patch?.small || nextLaunchData.links?.patch?.large || "",
            webcast: nextLaunchData.links?.webcast || "https://www.youtube.com/spacex",
            wikipedia: nextLaunchData.links?.wikipedia || "https://en.wikipedia.org/wiki/SpaceX",
            id: nextLaunchData.id || "next-launch-id"
          };
        }

        // Map the upcoming launches list for schedule (limit to 6)
        mappedUpcoming = sortedUpcoming.slice(0, 6).map((l: any) => {
          let rName = "Falcon 9";
          if (rocketsRes && Array.isArray(rocketsRes)) {
            const foundR = rocketsRes.find((r: any) => r.id === l.rocket);
            if (foundR) rName = foundR.name;
          }

          let lName = "LC-39A";
          if (launchpadsRes && Array.isArray(launchpadsRes)) {
            const foundL = launchpadsRes.find((lp: any) => lp.id === l.launchpad);
            if (foundL) lName = foundL.name;
          }

          return {
            name: l.name || "SpaceX Mission",
            rocket: l.rocket || "",
            rocketName: rName,
            date_utc: l.date_utc || new Date().toISOString(),
            launchpad: l.launchpad || "",
            launchpadName: lName,
            details: l.details || "Details are classified or will be announced soon.",
            patch: l.links?.patch?.small || l.links?.patch?.large || "",
            webcast: l.links?.webcast || "https://www.youtube.com/spacex",
            wikipedia: l.links?.wikipedia || "https://en.wikipedia.org/wiki/SpaceX",
            id: l.id || "upcoming-launch-id"
          };
        });
      } else {
        // Fallback if upcomingRes failed but nextRes worked
        if (nextRes) {
          let rName = "Falcon 9";
          if (rocketsRes && Array.isArray(rocketsRes)) {
            const foundR = rocketsRes.find((r: any) => r.id === nextRes.rocket);
            if (foundR) rName = foundR.name;
          }

          let lName = "LC-39A";
          if (launchpadsRes && Array.isArray(launchpadsRes)) {
            const foundL = launchpadsRes.find((lp: any) => lp.id === nextRes.launchpad);
            if (foundL) lName = foundL.name;
          }

          resolvedNextLaunch = {
            name: nextRes.name || "Next SpaceX Mission",
            rocket: nextRes.rocket || "",
            rocketName: rName,
            date_utc: nextRes.date_utc || new Date().toISOString(),
            launchpad: nextRes.launchpad || "",
            launchpadName: lName,
            details: nextRes.details || "Details are classified or will be announced soon.",
            patch: nextRes.links?.patch?.small || nextRes.links?.patch?.large || "",
            webcast: nextRes.links?.webcast || "https://www.youtube.com/spacex",
            wikipedia: nextRes.links?.wikipedia || "https://en.wikipedia.org/wiki/SpaceX",
            id: nextRes.id || "next-launch-id"
          };
        }
        mappedUpcoming = [resolvedNextLaunch];
      }

      // Map rockets list
      let resolvedRockets: RocketInfo[] = FALLBACK_SPACEX_DATA.rockets;
      if (rocketsRes && Array.isArray(rocketsRes)) {
        resolvedRockets = rocketsRes.map((r: any) => ({
          id: r.id,
          name: r.name || "Unknown Rocket",
          images: r.flickr_images || [],
          height: r.height || { meters: 0, feet: 0 },
          diameter: r.diameter || { meters: 0, feet: 0 },
          mass: r.mass || { kg: 0, lb: 0 },
          stages: r.stages || 0,
          success_rate: r.success_rate_pct || 0,
          cost_per_launch: r.cost_per_launch || 0,
          wikipedia: r.wikipedia || "",
          description: r.description || ""
        }));
      }

      // Map company stats
      let resolvedCompany: CompanyStats = FALLBACK_SPACEX_DATA.company;
      if (companyRes) {
        resolvedCompany = {
          founded: companyRes.founded || 2002,
          ceo: companyRes.ceo || "Elon Musk",
          employees: companyRes.employees || 13000,
          valuation: companyRes.valuation || 180000000000,
          headquarters: companyRes.headquarters || { address: "", city: "", state: "" },
          launches: pastLaunchesRes?.length || companyRes.launches || 380
        };
      }

      // Map launchpads
      let resolvedLaunchpads: LaunchpadInfo[] = FALLBACK_SPACEX_DATA.launchpads;
      if (launchpadsRes && Array.isArray(launchpadsRes)) {
        resolvedLaunchpads = launchpadsRes.map((lp: any) => ({
          id: lp.id,
          name: lp.name || "",
          full_name: lp.full_name || "",
          locality: lp.locality || "",
          region: lp.region || "",
          latitude: lp.latitude || 0,
          longitude: lp.longitude || 0,
          images: lp.images?.large || [],
          details: lp.details || ""
        }));
      }

      // Map Starlink
      let resolvedStarlink: StarlinkStats = FALLBACK_SPACEX_DATA.starlink;
      if (starlinkRes && Array.isArray(starlinkRes)) {
        const total = starlinkRes.length;
        const active = starlinkRes.filter((s: any) => s.spaceTrack && !s.spaceTrack.DECAY_DATE).length;
        
        // Calculate averages for valid payloads
        const withAltitude = starlinkRes.filter((s: any) => s.height_km !== null && s.height_km !== undefined);
        const avgAltitude = withAltitude.length > 0 
          ? Math.round(withAltitude.reduce((acc, curr) => acc + curr.height_km, 0) / withAltitude.length)
          : 550;

        const withVelocity = starlinkRes.filter((s: any) => s.velocity_kms !== null && s.velocity_kms !== undefined);
        const avgVelocity = withVelocity.length > 0
          ? parseFloat((withVelocity.reduce((acc, curr) => acc + curr.velocity_kms, 0) / withVelocity.length).toFixed(1))
          : 7.6;

        resolvedStarlink = { total, active, avgAltitude, avgVelocity };
      }

      // Map past launches
      let resolvedRecentLaunches: RecentLaunch[] = FALLBACK_SPACEX_DATA.recentLaunches;
      if (pastLaunchesRes && Array.isArray(pastLaunchesRes)) {
        // Sort descending by date and take the last 5
        const sortedPast = [...pastLaunchesRes]
          .filter(l => l.date_utc)
          .sort((a, b) => new Date(b.date_utc).getTime() - new Date(a.date_utc).getTime());
        
        resolvedRecentLaunches = sortedPast.slice(0, 5).map((l: any) => {
          let rocketName = "Falcon 9";
          if (rocketsRes && Array.isArray(rocketsRes)) {
            const foundR = rocketsRes.find(r => r.id === l.rocket);
            if (foundR) rocketName = foundR.name;
          }
          return {
            id: l.id,
            name: l.name || "Mission",
            patch: l.links?.patch?.small || "",
            success: l.success,
            rocketName,
            date_utc: l.date_utc
          };
        });
      }

      const combinedData: SpaceXData = {
        nextLaunch: resolvedNextLaunch,
        upcomingLaunches: mappedUpcoming,
        rockets: resolvedRockets,
        company: resolvedCompany,
        launchpads: resolvedLaunchpads,
        starlink: resolvedStarlink,
        recentLaunches: resolvedRecentLaunches
      };

      // Store in localStorage cache
      const nowMs = Date.now();
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        timestamp: nowMs,
        payload: combinedData
      }));

      setData(combinedData);
      setLastUpdated(new Date(nowMs));
      setIsUsingFallback(false);
    } catch (err) {
      console.log("SpaceX API fetch failed, utilizing robust offline cache:", err);
      // Fallback to cached data if exists, otherwise hardcoded telemetry
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const { payload, timestamp } = JSON.parse(cached);
          setData(payload);
          if (timestamp) {
            setLastUpdated(new Date(timestamp));
          }
        } catch (e) {
          setData(FALLBACK_SPACEX_DATA);
        }
      } else {
        setData(FALLBACK_SPACEX_DATA);
      }
      setIsUsingFallback(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Mount effects
  useEffect(() => {
    fetchSpaceXData();

    // 60-second auto refresh
    const autoRefreshInterval = setInterval(() => {
      fetchSpaceXData(true);
    }, 60000);

    return () => {
      clearInterval(autoRefreshInterval);
      stopSpaceHum();
    };
  }, []);

  // Live Countdown logic
  useEffect(() => {
    if (!currentLaunch?.date_utc) return;

    const updateCountdown = () => {
      const parsedTime = currentLaunch.date_utc ? new Date(currentLaunch.date_utc).getTime() : 0;
      const launchTime = isNaN(parsedTime) ? 0 : parsedTime;
      const now = Date.now();
      const difference = launchTime - now;

      if (isNaN(difference) || difference <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        // If it reaches zero and hasn't triggered yet, play rocket launch animation
        if (!launchTriggered && difference > -120000) { // inside 2 mins after launch
          setLaunchTriggered(true);
          setTimeout(() => setLaunchTriggered(false), 9000); // end rocket launch overlay after 9 seconds
        }
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [currentLaunch, launchTriggered]);

  // Synthesized Space Sound drone
  const startSpaceHum = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      // Primary Drone oscillator (low sine wave)
      const osc1 = ctx.createOscillator();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(45, ctx.currentTime); // very low F#0/G0 note
      oscillator1Ref.current = osc1;

      // Chorus Drone oscillator (low sawtooth, slightly detuned)
      const osc2 = ctx.createOscillator();
      osc2.type = "sawtooth";
      osc2.frequency.setValueAtTime(45.6, ctx.currentTime);
      oscillator2Ref.current = osc2;

      // Low pass filter to keep it deep and atmospheric
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(90, ctx.currentTime);
      filter.Q.setValueAtTime(4, ctx.currentTime);
      filterRef.current = filter;

      // Volume Gain
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 3); // fade in over 3 seconds
      gainNodeRef.current = gain;

      // Connections
      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      setIsSoundOn(true);
    } catch (e) {
      console.error("Audio Synthesis error", e);
    }
  };

  const stopSpaceHum = () => {
    const gain = gainNodeRef.current;
    const ctx = audioCtxRef.current;
    if (gain && ctx) {
      try {
        const now = ctx.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(0, now + 1.2); // fade out nicely

        setTimeout(() => {
          oscillator1Ref.current?.stop();
          oscillator2Ref.current?.stop();
          ctx.close();
          audioCtxRef.current = null;
          oscillator1Ref.current = null;
          oscillator2Ref.current = null;
          filterRef.current = null;
          gainNodeRef.current = null;
        }, 1500);
      } catch (err) {
        console.error(err);
      }
    }
    setIsSoundOn(false);
  };

  const toggleSound = () => {
    if (isSoundOn) {
      stopSpaceHum();
    } else {
      startSpaceHum();
    }
  };

  // Manual launch animation trigger for fun
  const triggerManualLaunch = () => {
    setLaunchTriggered(true);
    setTimeout(() => setLaunchTriggered(false), 9000);
  };

  return (
    <div className="flex flex-col h-full space-y-4 font-sans select-none relative pb-4">
      
      {/* ROCKET LAUNCH TELEMETRY ANIMATION OVERLAY */}
      <AnimatePresence>
        {launchTriggered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-neutral-950/95 flex flex-col items-center justify-center overflow-hidden pointer-events-auto"
          >
            {/* Ambient fire particles */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(249,115,22,0.15)_0%,transparent_60%)] animate-pulse" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.05)_0%,transparent_70%)]" />

            {/* Starfield */}
            <div className="absolute inset-0 bg-transparent overflow-hidden">
              <div className="stars-rocket-launch absolute inset-0 opacity-40 bg-[radial-gradient(1px_1px_at_20px_30px,#fff,transparent),radial-gradient(1.5px_1.5px_at_40px_70px,#fff,transparent),radial-gradient(2px_2px_at_50px_160px,#fff,transparent)] bg-[size:200px_200px] animate-[pulse_3s_infinite]" />
            </div>

            {/* Earth rotating / retreating in bottom */}
            <motion.div
              initial={{ y: 200, scale: 0.8 }}
              animate={{ y: 150, scale: 1 }}
              transition={{ duration: 8, ease: "easeOut" }}
              className="absolute bottom-[-150px] w-[500px] h-[500px] rounded-full bg-gradient-to-t from-blue-900/50 via-teal-900/40 to-indigo-950/30 border border-teal-500/10 blur-[1px] flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#2dd4bf_0%,transparent_60%)] opacity-30" />
            </motion.div>

            {/* Launching Rocket */}
            <motion.div
              initial={{ y: 400, scale: 0.5, rotate: 0 }}
              animate={{ 
                y: [-100, -250, -600], 
                scale: [0.7, 0.9, 0.4], 
                x: [0, 10, -5, 12, 0],
                rotate: [0, 1, -1, 2, 0]
              }}
              transition={{ 
                duration: 7, 
                times: [0, 0.4, 1],
                ease: "easeInOut" 
              }}
              className="relative flex flex-col items-center z-10"
            >
              {/* Rocket Body SVG */}
              <div className="w-16 h-48 bg-gradient-to-b from-neutral-100 to-neutral-400 rounded-t-full shadow-2xl relative flex flex-col items-center border border-white/20">
                {/* SpaceX Logo text */}
                <span className="text-[10px] font-black text-neutral-800 rotate-90 my-10 tracking-widest">SPACEX</span>
                {/* U.S. Flag accent */}
                <div className="w-4 h-2.5 bg-red-600/20 border border-white/20 rounded-sm absolute bottom-12" />
                {/* Engine fire exhaust */}
                <div className="absolute bottom-[-60px] w-12 h-20 bg-gradient-to-t from-transparent via-amber-500 to-orange-600 rounded-b-full filter blur-[2px] animate-pulse flex justify-center">
                  <div className="w-6 h-12 bg-white rounded-b-full filter blur-[1px] animate-ping" />
                </div>
              </div>
              
              {/* Heavy Smoke particle plume */}
              <div className="w-48 h-32 bg-gradient-to-t from-neutral-800/10 via-orange-500/30 to-amber-600/40 rounded-full filter blur-xl opacity-85 absolute bottom-[-40px] mix-blend-screen scale-125 animate-pulse" />
            </motion.div>

            {/* Launch HUD */}
            <div className="absolute top-16 text-center select-none pointer-events-none z-10 space-y-2">
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-bold font-mono tracking-wider animate-pulse"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>IGNITION ENGINE MAX TELEMETRY</span>
              </motion.div>
              <h2 className="text-3xl font-black text-white tracking-wider font-mono">LIFTOFF!</h2>
              <p className="text-xs text-gray-400 max-w-sm">Vehicle has cleared the tower. Nominal trajectory, pitch over initiated.</p>
            </div>
            
            <button 
              onClick={() => setLaunchTriggered(false)}
              className="absolute bottom-10 px-5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-gray-400 hover:text-white transition-all cursor-pointer z-50"
            >
              Skip Animation
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SUB HEADER DOCK: SPACEX NAVIGATION & CONTROLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0a0a0a]/30 backdrop-blur-md border border-white/5 p-2 rounded-2xl">
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => setActiveSection("next")}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSection === "next"
                ? "bg-[#7c3aed]/15 text-[#9f75ff] border border-[#7c3aed]/30 shadow-sm"
                : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>Next Launch</span>
          </button>
          <button
            onClick={() => setActiveSection("rockets")}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSection === "rockets"
                ? "bg-[#7c3aed]/15 text-[#9f75ff] border border-[#7c3aed]/30 shadow-sm"
                : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Rockets</span>
          </button>
          <button
            onClick={() => setActiveSection("stats")}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSection === "stats"
                ? "bg-[#7c3aed]/15 text-[#9f75ff] border border-[#7c3aed]/30 shadow-sm"
                : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Company</span>
          </button>
          <button
            onClick={() => setActiveSection("launchpads")}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSection === "launchpads"
                ? "bg-[#7c3aed]/15 text-[#9f75ff] border border-[#7c3aed]/30 shadow-sm"
                : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Launchpads</span>
          </button>
          <button
            onClick={() => setActiveSection("starlink")}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSection === "starlink"
                ? "bg-[#7c3aed]/15 text-[#9f75ff] border border-[#7c3aed]/30 shadow-sm"
                : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            <Satellite className="w-3.5 h-3.5" />
            <span>Starlink</span>
          </button>
        </div>

        {/* Ambient Synthesizer Hum Toggle & Refresh */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
              isSoundOn
                ? "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30 hover:bg-[#10b981]/20"
                : "bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10"
            }`}
            title={isSoundOn ? "Mute Cosmic Ambient Sound" : "Listen to Synthesized Deep Space Hum"}
          >
            {isSoundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Refresh Action */}
          <button
            onClick={() => fetchSpaceXData(true)}
            disabled={isRefreshing}
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white rounded-xl transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center"
            title="Force Update Telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#7c3aed]" : ""}`} />
          </button>
        </div>
      </div>

      {/* TELEMETRY STATUS & LAST UPDATED INDICATOR */}
      <div className="flex items-center justify-between px-3 py-2 bg-white/[0.02] border border-white/5 rounded-xl text-[10px] font-mono text-gray-400">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${isUsingFallback ? "bg-amber-500 animate-pulse" : "bg-emerald-500 animate-pulse"}`} />
          <span>Telemetry Source: {isUsingFallback ? "Offline Vault (Cache)" : "Active Real-Time Stream"}</span>
        </div>
        {lastUpdated && (
          <span className="text-gray-500 flex items-center gap-1">
            <span>Last Sync:</span>
            <strong className="text-gray-400">{lastUpdated.toLocaleTimeString()}</strong>
          </span>
        )}
      </div>

      {/* TELEMETRY SOURCE INDICATION */}
      {isUsingFallback && (
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-300 px-3 py-2 rounded-xl text-[10px]">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
          <span>SpaceX Mission Control Offline: Showing cached orbital telemetry safely.</span>
        </div>
      )}

      {/* MAIN SKELETON / MAIN CONTENT WINDOW */}
      <div className="flex-1 min-h-[300px]">
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-44 w-full bg-white/[0.03] animate-pulse rounded-2xl border border-white/5 flex flex-col items-center justify-center">
              <RefreshCw className="w-8 h-8 text-[#7c3aed] animate-spin mb-2" />
              <p className="text-[11px] text-gray-400 font-mono tracking-widest uppercase">Connecting to SpaceX launch telemetry...</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-28 bg-white/[0.02] border border-white/5 animate-pulse rounded-2xl" />
              <div className="h-28 bg-white/[0.02] border border-white/5 animate-pulse rounded-2xl" />
            </div>
          </div>
        ) : !data ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
            <ShieldAlert className="w-10 h-10 text-rose-400 mb-3" />
            <p className="text-xs font-bold text-white">Orbital Link Unstable</p>
            <p className="text-[10px] text-gray-500 max-w-[250px] mt-1">Unable to load telemetry. Press the refresh button to synchronize.</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* NEXT LAUNCH SECTION */}
            {activeSection === "next" && (
              <motion.div
                key="next-launch"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Left 2 Columns: Selected Launch Hero Details */}
                  <div className="lg:col-span-2 space-y-4">
                    {/* Countdown & Patch Hero Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Countdown Card (Glassmorphism) */}
                      <div className="md:col-span-2 bg-[#121214]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                          <Rocket className="w-32 h-32 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-bold text-emerald-400 font-mono tracking-widest uppercase">
                              {currentLaunch.id === data?.nextLaunch.id ? "IMMEDIATE ORBITAL TARGET" : "SCHEDULED MISSION PREVIEW"}
                            </span>
                          </div>
                          <h3 className="text-lg font-black text-white truncate tracking-tight">{currentLaunch.name}</h3>
                          <p className="text-[11px] text-gray-400 font-mono flex items-center gap-1.5 mt-1">
                            <Rocket className="w-3.5 h-3.5 text-[#9f75ff]" />
                            <span>Vehicle: <strong>{currentLaunch.rocketName}</strong></span>
                            <span className="text-gray-600">|</span>
                            <MapPin className="w-3.5 h-3.5 text-amber-500" />
                            <span>Pad: <strong>{currentLaunch.launchpadName}</strong></span>
                          </p>
                        </div>

                        {/* Digital Countdown HUD */}
                        <div className="grid grid-cols-4 gap-2.5 my-4">
                          {[
                            { label: "DAYS", value: countdown.days },
                            { label: "HOURS", value: countdown.hours },
                            { label: "MINS", value: countdown.minutes },
                            { label: "SECS", value: countdown.seconds }
                          ].map((item, idx) => (
                            <div key={idx} className="bg-black/40 border border-white/5 rounded-xl p-2.5 text-center flex flex-col justify-center">
                              <span className="text-2xl font-black font-mono text-white leading-none tracking-tight">
                                {String(item.value).padStart(2, "0")}
                              </span>
                              <span className="text-[8px] font-bold text-gray-500 mt-1 tracking-wider">{item.label}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          <p className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-gray-500" />
                            <span>Launch Local:</span>
                            <strong className="text-white">{new Date(currentLaunch.date_utc).toLocaleString()}</strong>
                          </p>
                          {/* Interactive Manual launch button */}
                          <button 
                            onClick={triggerManualLaunch} 
                            className="ml-auto px-2 py-1 bg-white/5 hover:bg-orange-500/20 hover:border-orange-500/40 text-orange-400 border border-white/10 rounded-lg text-[9px] font-bold transition-all cursor-pointer"
                          >
                            Launch Simulation
                          </button>
                        </div>
                      </div>

                      {/* Mission Patch Card */}
                      <div className="bg-[#121214]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center relative">
                        <div className="w-24 h-24 relative flex items-center justify-center">
                          {currentLaunch.patch ? (
                            <img
                              src={currentLaunch.patch}
                              alt="Patch"
                              loading="lazy"
                              className="max-w-full max-h-full object-contain filter drop-shadow-[0_4px_12px_rgba(124,58,237,0.3)] hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-900/30 to-amber-900/20 border border-white/10 flex items-center justify-center">
                              <Sparkles className="w-8 h-8 text-amber-400/40 animate-pulse" />
                            </div>
                          )}
                        </div>
                        <div className="mt-3 space-y-1">
                          <span className="inline-flex px-2 py-0.5 bg-purple-500/10 text-purple-300 text-[8px] font-mono font-bold rounded-full uppercase tracking-wider">OFFICIAL PATCH</span>
                          <p className="text-[9px] text-gray-400 mt-1 max-w-[140px] truncate mx-auto">ID: {currentLaunch.id.substring(0, 10)}...</p>
                        </div>
                      </div>
                    </div>

                    {/* Details Description */}
                    <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-2">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-[#7c3aed]" />
                        <span>Mission Operations Details</span>
                      </h4>
                      <p className="text-[11px] leading-relaxed text-gray-300 text-justify">
                        {currentLaunch.details}
                      </p>
                      <div className="flex gap-2 pt-2">
                        {currentLaunch.webcast && (
                          <a
                            href={currentLaunch.webcast}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 bg-red-600/15 hover:bg-red-600/30 border border-red-600/30 text-red-300 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer decoration-transparent"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Watch Webcast</span>
                          </a>
                        )}
                        {currentLaunch.wikipedia && (
                          <a
                            href={currentLaunch.wikipedia}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer decoration-transparent"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Read Mission Wiki</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Upcoming Schedule list & Recent Log */}
                  <div className="space-y-4">
                    {/* Launch Schedule */}
                    <div className="bg-[#121214]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                          <span>Launch Schedule</span>
                        </h3>
                        <span className="text-[8px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded font-mono font-bold">UPCOMING</span>
                      </div>
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 select-none no-scrollbar">
                        {data.upcomingLaunches && data.upcomingLaunches.length > 0 ? (
                          data.upcomingLaunches.map((launch) => {
                            const isSelected = currentLaunch?.id === launch.id;
                            const isFuture = new Date(launch.date_utc).getTime() > Date.now();
                            return (
                              <div
                                key={launch.id}
                                onClick={() => setSelectedUpcomingId(launch.id)}
                                className={`p-2 rounded-xl border transition-all cursor-pointer text-left flex items-center gap-2 ${
                                  isSelected
                                    ? "bg-amber-500/10 border-amber-500/30 ring-1 ring-amber-500/20"
                                    : "bg-white/[0.01] hover:bg-white/[0.04] border-white/5"
                                }`}
                              >
                                <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center shrink-0 p-1">
                                  {launch.patch ? (
                                    <img src={launch.patch} alt="" className="max-w-full max-h-full object-contain" />
                                  ) : (
                                    <Rocket className={`w-4 h-4 ${isSelected ? "text-amber-400" : "text-gray-500"}`} />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-[10px] font-bold text-white truncate flex items-center gap-1">
                                    <span className="truncate">{launch.name}</span>
                                    {isFuture && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />}
                                  </h4>
                                  <p className="text-[8px] text-gray-400 font-mono mt-0.5 truncate">
                                    {launch.rocketName} • {new Date(launch.date_utc).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-[10px] text-gray-500 text-center py-4">No upcoming telemetry loaded</p>
                        )}
                      </div>
                    </div>

                    {/* Recent Past Launches Subsection */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">Recent Missions Log</h3>
                      <div className="space-y-2">
                        {data.recentLaunches.map((launch) => (
                          <div
                            key={launch.id}
                            className="flex items-center gap-2.5 p-2 bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 rounded-xl transition-all"
                          >
                            <div className="w-8 h-8 rounded-lg bg-black/40 overflow-hidden shrink-0 flex items-center justify-center p-1">
                              {launch.patch ? (
                                <img src={launch.patch} alt={launch.name} loading="lazy" className="max-w-full max-h-full object-contain" />
                              ) : (
                                <Rocket className="w-4 h-4 text-gray-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-[10px] font-bold text-white truncate">{launch.name}</h4>
                              <p className="text-[8px] text-gray-400 font-mono mt-0.5">
                                {launch.rocketName} • {new Date(launch.date_utc).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="shrink-0 flex items-center gap-1">
                              {launch.success === true ? (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[7px] font-mono font-bold">
                                  <CheckCircle2 className="w-2 h-2" />
                                  OK
                                </span>
                              ) : launch.success === false ? (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded-full text-rose-400 text-[7px] font-mono font-bold">
                                  <XCircle className="w-2 h-2" />
                                  FAIL
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-500/10 border border-gray-500/20 rounded-full text-gray-400 text-[7px] font-mono font-bold">
                                  <HelpCircle className="w-2 h-2" />
                                  N/A
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ROCKET INFORMATION SECTION */}
            {activeSection === "rockets" && (
              <motion.div
                key="rockets-section"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                {/* Horizontal Rocket Selector */}
                <div className="flex gap-2 overflow-x-auto pb-1.5 no-scrollbar">
                  {data.rockets.map((rocket, idx) => (
                    <button
                      key={rocket.id}
                      onClick={() => setSelectedRocketIdx(idx)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                        selectedRocketIdx === idx
                          ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                          : "bg-white/5 text-gray-400 hover:text-white border border-transparent"
                      }`}
                    >
                      {rocket.name}
                    </button>
                  ))}
                </div>

                {/* Rocket Card Layout */}
                {data.rockets[selectedRocketIdx] && (
                  <div className="space-y-4">
                    {/* Hero image and overlay */}
                    <div className="relative aspect-[21/9] rounded-2xl overflow-hidden bg-black/40 border border-white/10 group">
                      {data.rockets[selectedRocketIdx].images?.[0] ? (
                        <img
                          src={data.rockets[selectedRocketIdx].images[0]}
                          alt={data.rockets[selectedRocketIdx].name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
                          <Rocket className="w-10 h-10 text-gray-700" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-4">
                        <h3 className="text-lg font-black text-white">{data.rockets[selectedRocketIdx].name}</h3>
                        <p className="text-[10px] text-gray-300 font-mono flex items-center gap-1.5 mt-1">
                          <Award className="w-3.5 h-3.5 text-amber-400" />
                          <span>Reliability Success: <strong>{data.rockets[selectedRocketIdx].success_rate}%</strong></span>
                          <span className="text-gray-600">|</span>
                          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Cost: <strong>${(data.rockets[selectedRocketIdx].cost_per_launch / 1000000).toFixed(1)}M / launch</strong></span>
                        </p>
                      </div>
                    </div>

                    {/* Stats Bento Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: "Height", val: `${data.rockets[selectedRocketIdx].height.meters}m / ${data.rockets[selectedRocketIdx].height.feet}ft` },
                        { label: "Diameter", val: `${data.rockets[selectedRocketIdx].diameter.meters}m / ${data.rockets[selectedRocketIdx].diameter.feet}ft` },
                        { label: "Launch Mass", val: `${(data.rockets[selectedRocketIdx].mass.kg / 1000).toLocaleString()} t` },
                        { label: "Core Stages", val: data.rockets[selectedRocketIdx].stages }
                      ].map((stat, idx) => (
                        <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 flex flex-col justify-center">
                          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">{stat.label}</span>
                          <span className="text-xs font-extrabold text-white font-mono mt-1">{stat.val}</span>
                        </div>
                      ))}
                    </div>

                    {/* Text Description */}
                    <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-2">
                      <p className="text-[11px] leading-relaxed text-gray-300">
                        {data.rockets[selectedRocketIdx].description}
                      </p>
                      <div className="pt-1">
                        <a
                          href={data.rockets[selectedRocketIdx].wikipedia}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer decoration-transparent w-fit"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Rocket Wiki Database</span>
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* COMPANY STATS SECTION */}
            {activeSection === "stats" && (
              <motion.div
                key="company-section"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                {/* Visual Header card */}
                <div className="bg-gradient-to-tr from-purple-950/20 to-neutral-900 border border-white/10 p-4 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <Building className="w-32 h-32" />
                  </div>
                  <div>
                    <span className="inline-flex px-2 py-0.5 bg-amber-500/10 text-amber-300 text-[8px] font-mono font-bold rounded-full uppercase tracking-wider">ENTERPRISE TELEMETRY</span>
                    <h3 className="text-base font-black text-white mt-1">Space Exploration Technologies Corp.</h3>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">Headquarters: Hawthorne, California</p>
                  </div>
                </div>

                {/* Company stats list in grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/[0.02] border border-white/5 p-3.5 rounded-2xl flex items-center gap-3">
                    <Calendar className="w-6 h-6 text-amber-400 shrink-0" />
                    <div>
                      <p className="text-[9px] text-gray-500 font-bold uppercase">FOUNDED</p>
                      <p className="text-xs font-bold text-white mt-0.5">{data.company.founded}</p>
                    </div>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 p-3.5 rounded-2xl flex items-center gap-3">
                    <Users className="w-6 h-6 text-purple-400 shrink-0" />
                    <div>
                      <p className="text-[9px] text-gray-500 font-bold uppercase">EMPLOYEES</p>
                      <p className="text-xs font-bold text-white mt-0.5">{data.company.employees.toLocaleString()}+</p>
                    </div>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 p-3.5 rounded-2xl flex items-center gap-3">
                    <TrendingUp className="w-6 h-6 text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-[9px] text-gray-500 font-bold uppercase">VALUATION</p>
                      <p className="text-xs font-bold text-white mt-0.5">${(data.company.valuation / 1000000000).toFixed(0)} Billion</p>
                    </div>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 p-3.5 rounded-2xl flex items-center gap-3">
                    <Rocket className="w-6 h-6 text-blue-400 shrink-0" />
                    <div>
                      <p className="text-[9px] text-gray-500 font-bold uppercase">TOTAL LAUNCHES</p>
                      <p className="text-xs font-bold text-white mt-0.5">{data.company.launches}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-1">
                  <p className="text-[10px] text-gray-500 font-bold uppercase">EXECUTIVE TEAM</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    <div className="p-2.5 bg-black/30 border border-white/5 rounded-xl flex items-center justify-between">
                      <span className="text-[10px] text-gray-400">Chief Executive Officer</span>
                      <span className="text-[10px] font-bold text-white">{data.company.ceo}</span>
                    </div>
                    <div className="p-2.5 bg-black/30 border border-white/5 rounded-xl flex items-center justify-between">
                      <span className="text-[10px] text-gray-400">Chief Operating Officer</span>
                      <span className="text-[10px] font-bold text-white">Gwynne Shotwell</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* LAUNCHPAD DETAIL SECTION */}
            {activeSection === "launchpads" && (
              <motion.div
                key="launchpads-section"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                {/* Selector Buttons */}
                <div className="flex gap-2 overflow-x-auto pb-1.5 no-scrollbar">
                  {data.launchpads.map((lp, idx) => (
                    <button
                      key={lp.id}
                      onClick={() => setSelectedLaunchpadIdx(idx)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                        selectedLaunchpadIdx === idx
                          ? "bg-[#7c3aed]/15 text-[#9f75ff] border border-[#7c3aed]/30"
                          : "bg-white/5 text-gray-400 hover:text-white border border-transparent"
                      }`}
                    >
                      {lp.name}
                    </button>
                  ))}
                </div>

                {/* Selected Launchpad card details */}
                {data.launchpads[selectedLaunchpadIdx] && (
                  <div className="space-y-4 animate-in fade-in-20 duration-300">
                    <div className="relative aspect-[21/9] rounded-2xl overflow-hidden bg-black/40 border border-white/10">
                      {data.launchpads[selectedLaunchpadIdx].images?.[0] ? (
                        <img
                          src={data.launchpads[selectedLaunchpadIdx].images[0]}
                          alt={data.launchpads[selectedLaunchpadIdx].name}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-neutral-900 flex items-center justify-center p-4 text-center">
                          <p className="text-[10px] text-gray-400 font-mono">Telemetry Image Unavailable</p>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-4">
                        <h3 className="text-sm font-black text-white">{data.launchpads[selectedLaunchpadIdx].full_name}</h3>
                        <p className="text-[9px] text-gray-300 font-mono flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-amber-500" />
                          <span>{data.launchpads[selectedLaunchpadIdx].locality}, {data.launchpads[selectedLaunchpadIdx].region}</span>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/[0.02] border border-white/5 p-3 rounded-2xl">
                        <p className="text-[9px] text-gray-500 font-bold uppercase">LATITUDE</p>
                        <p className="text-xs font-bold text-white font-mono mt-0.5">{data.launchpads[selectedLaunchpadIdx].latitude}</p>
                      </div>
                      <div className="bg-white/[0.02] border border-white/5 p-3 rounded-2xl">
                        <p className="text-[9px] text-gray-500 font-bold uppercase">LONGITUDE</p>
                        <p className="text-xs font-bold text-white font-mono mt-0.5">{data.launchpads[selectedLaunchpadIdx].longitude}</p>
                      </div>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-3">
                      <p className="text-[11px] leading-relaxed text-gray-300 text-justify">
                        {data.launchpads[selectedLaunchpadIdx].details}
                      </p>
                      <div className="pt-1">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${data.launchpads[selectedLaunchpadIdx].latitude},${data.launchpads[selectedLaunchpadIdx].longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer decoration-transparent w-fit"
                        >
                          <Map className="w-3.5 h-3.5" />
                          <span>View on Google Maps</span>
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* STARLINK SECTION */}
            {activeSection === "starlink" && (
              <motion.div
                key="starlink-section"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                {/* Orbit Graphics Visualizer (Animated CSS rotation) */}
                <div className="bg-gradient-to-br from-indigo-950/20 via-[#0a0a0c] to-neutral-950/40 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden min-h-[160px]">
                  
                  {/* Rotating Earth Representation */}
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-700 via-teal-800 to-indigo-950 relative flex items-center justify-center border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.25)] select-none pointer-events-none">
                    <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.15)_0%,transparent_60%)]" />
                    {/* Glowing Aura */}
                    <div className="absolute inset-[-1px] rounded-full border border-teal-400/20 blur-[1px] animate-[pulse_2s_infinite]" />
                    {/* Inner land styling */}
                    <div className="absolute w-12 h-6 bg-emerald-600/10 blur-[4px] rounded-full top-4 left-3 transform rotate-12" />
                    <div className="absolute w-10 h-4 bg-emerald-600/10 blur-[4px] rounded-full bottom-5 right-4 transform -rotate-12" />
                  </div>

                  {/* Satellite Ring Orbit Animation */}
                  <div className="absolute w-36 h-36 border border-dashed border-purple-500/20 rounded-full animate-[spin_12s_linear_infinite] flex items-center justify-center select-none pointer-events-none">
                    <div className="absolute top-0 w-1.5 h-1.5 bg-amber-400 rounded-full shadow-[0_0_8px_#fbbf24] animate-pulse" />
                    <div className="absolute bottom-0 w-1.5 h-1.5 bg-amber-400 rounded-full shadow-[0_0_8px_#fbbf24] animate-pulse" />
                  </div>
                  <div className="absolute w-48 h-48 border border-dotted border-teal-500/20 rounded-full animate-[spin_18s_linear_infinite_reverse] flex items-center justify-center select-none pointer-events-none">
                    <div className="absolute right-0 w-1.5 h-1.5 bg-teal-400 rounded-full shadow-[0_0_8px_#2dd4bf] animate-pulse" />
                    <div className="absolute left-0 w-1.5 h-1.5 bg-teal-400 rounded-full shadow-[0_0_8px_#2dd4bf] animate-pulse" />
                  </div>

                  {/* Absolute Labels */}
                  <span className="absolute bottom-3 text-[8px] font-mono text-gray-500 uppercase tracking-widest">Active constellation mesh simulation</span>
                </div>

                {/* Satellites Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/[0.02] border border-white/5 p-3.5 rounded-2xl">
                    <p className="text-[9px] text-gray-500 font-bold uppercase flex items-center gap-1">
                      <Satellite className="w-3.5 h-3.5 text-blue-400" />
                      <span>Total Satellites</span>
                    </p>
                    <p className="text-base font-black text-white font-mono mt-1">{data.starlink.total.toLocaleString()}</p>
                    <p className="text-[8px] text-gray-400 mt-1">Launched since 2019</p>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 p-3.5 rounded-2xl">
                    <p className="text-[9px] text-gray-500 font-bold uppercase flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Active Satellites</span>
                    </p>
                    <p className="text-base font-black text-white font-mono mt-1">{data.starlink.active.toLocaleString()}</p>
                    <p className="text-[8px] text-gray-400 mt-1">Operational in low orbit</p>
                  </div>
                </div>

                {/* Orbit telemetry details */}
                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                    <Activity className="w-4 h-4 text-teal-400" />
                    <span>Constellation Orbit Details</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-gray-400">Mean Orbital Altitude</span>
                      <p className="text-sm font-extrabold text-white font-mono">~{data.starlink.avgAltitude} km</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-gray-400">Mean Orbital Velocity</span>
                      <p className="text-sm font-extrabold text-white font-mono">~{data.starlink.avgVelocity} km/s</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 text-justify leading-relaxed mt-3 border-t border-white/5 pt-2.5">
                    Starlink is a satellite constellation system operating in low Earth orbit (LEO) designed to deliver high-speed, low-latency broadband internet coverage to remote and underserved regions globally.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

    </div>
  );
}
