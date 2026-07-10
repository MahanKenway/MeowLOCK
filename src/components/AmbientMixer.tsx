import React, { useEffect, useState } from "react";
import { Volume2, VolumeX, CloudRain, Coffee, Flame, Wind, Radio, Play, Pause } from "lucide-react";
import { ambientSynth } from "../utils/audioSynth";
import { AmbientSounds } from "../types";

interface AmbientMixerProps {
  volumes: AmbientSounds;
  onChange: (volumes: AmbientSounds) => void;
  isMinimal?: boolean;
}

export default function AmbientMixer({ volumes, onChange, isMinimal = false }: AmbientMixerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [localMute, setLocalMute] = useState<Record<string, boolean>>({
    rain: false,
    cafe: false,
    whiteNoise: false,
    fire: false,
    wind: false,
  });

  // Apply volumes to synth whenever volumes, mute state, or playing status changes
  useEffect(() => {
    const keys: (keyof AmbientSounds)[] = ["rain", "cafe", "whiteNoise", "fire", "wind"];
    keys.forEach((key) => {
      const vol = isPlaying && !localMute[key] ? volumes[key] : 0;
      ambientSynth.setVolume(key, vol);
    });
  }, [volumes, isPlaying, localMute]);

  const handleVolumeChange = (sound: keyof AmbientSounds, val: number) => {
    const newVolumes = { ...volumes, [sound]: val };
    onChange(newVolumes);
    if (val > 0 && !isPlaying) {
      setIsPlaying(true);
    }
  };

  const toggleSoundMute = (sound: string) => {
    setLocalMute((prev) => ({ ...prev, [sound]: !prev[sound] }));
  };

  const toggleGlobalPlay = () => {
    if (isPlaying) {
      ambientSynth.stopAll();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
    }
  };

  const getSoundIcon = (sound: string) => {
    switch (sound) {
      case "rain":
        return <CloudRain className="w-4 h-4" />;
      case "cafe":
        return <Coffee className="w-4 h-4" />;
      case "fire":
        return <Flame className="w-4 h-4" />;
      case "wind":
        return <Wind className="w-4 h-4" />;
      case "whiteNoise":
        return <Radio className="w-4 h-4" />;
      default:
        return <Volume2 className="w-4 h-4" />;
    }
  };

  const soundLabels: Record<keyof AmbientSounds, string> = {
    rain: "Rainfall",
    cafe: "Cozy Cafe",
    whiteNoise: "White Noise",
    fire: "Campfire",
    wind: "Autumn Wind",
  };

  if (isMinimal) {
    return (
      <button
        onClick={toggleGlobalPlay}
        className={`p-3 rounded-full transition-all duration-300 backdrop-blur-md border ${
          isPlaying
            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-lg shadow-emerald-500/10"
            : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
        }`}
        title={isPlaying ? "Mute Ambient Sounds" : "Play Ambient Sounds"}
      >
        {isPlaying ? <Volume2 className="w-5 h-5 animate-pulse" /> : <VolumeX className="w-5 h-5" />}
      </button>
    );
  }

  return (
    <div id="ambient-mixer-widget" className="bg-neutral-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col h-full text-white">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-sans font-medium text-sm text-gray-200 tracking-tight">Sound Mixer</h3>
          <p className="font-sans text-xs text-gray-400">Layer procedural study noise</p>
        </div>
        <button
          onClick={toggleGlobalPlay}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            isPlaying
              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
              : "bg-white/10 hover:bg-white/15 text-gray-200"
          }`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-3 h-3 fill-current" /> Pause Synth
            </>
          ) : (
            <>
              <Play className="w-3 h-3 fill-current" /> Activate Synth
            </>
          )}
        </button>
      </div>

      <div className="space-y-4 flex-1 justify-center flex flex-col">
        {(Object.keys(volumes) as Array<keyof AmbientSounds>).map((soundKey) => {
          const isMuted = localMute[soundKey];
          const vol = volumes[soundKey];

          return (
            <div key={soundKey} className="flex items-center gap-4">
              <button
                onClick={() => toggleSoundMute(soundKey)}
                className={`p-2 rounded-lg transition-colors ${
                  isMuted || !isPlaying
                    ? "bg-white/5 text-gray-500 hover:text-gray-400"
                    : "bg-white/10 text-amber-400 hover:bg-white/15"
                }`}
                title={`Toggle ${soundLabels[soundKey]}`}
              >
                {getSoundIcon(soundKey)}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-sans text-xs font-medium text-gray-300">
                    {soundLabels[soundKey]}
                  </span>
                  <span className="font-mono text-[10px] text-gray-400">
                    {isMuted ? "Muted" : `${Math.round(vol * 100)}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={vol}
                  onChange={(e) => handleVolumeChange(soundKey, parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-400 focus:outline-none transition-all"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
