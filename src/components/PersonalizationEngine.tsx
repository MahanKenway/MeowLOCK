import React, { useState } from "react";
import { Sliders, Save, Plus, ArrowRight, Star, Trash2 } from "lucide-react";
import { WorkspaceProfile, WidgetLayout, TimerSettings, AmbientSounds } from "../types";

interface PersonalizationEngineProps {
  currentProfile: WorkspaceProfile;
  profiles: WorkspaceProfile[];
  onSelectProfile: (name: string) => void;
  onSaveProfile: (profile: WorkspaceProfile) => void;
  onDeleteProfile: (name: string) => void;
}

export default function PersonalizationEngine({
  currentProfile,
  profiles,
  onSelectProfile,
  onSaveProfile,
  onDeleteProfile,
}: PersonalizationEngineProps) {
  const [newProfileName, setNewProfileName] = useState("");
  const [showSaveAs, setShowSaveAs] = useState(false);

  const handleSaveCurrent = () => {
    onSaveProfile(currentProfile);
  };

  const handleSaveAs = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;

    const newProfile: WorkspaceProfile = {
      ...currentProfile,
      name: newProfileName.trim(),
    };

    onSaveProfile(newProfile);
    setNewProfileName("");
    setShowSaveAs(false);
  };

  const isPresetProfile = (name: string) => {
    return ["Study Mode", "Coding Mode", "Relax Mode", "Exam Mode"].includes(name);
  };

  return (
    <div id="personalization-widget" className="bg-neutral-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col h-full text-white">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-sans font-medium text-sm text-gray-200 tracking-tight">Workspace Presets</h3>
          <p className="font-sans text-xs text-gray-400">Save sounds, visuals, and widgets</p>
        </div>
        <button
          onClick={() => setShowSaveAs(!showSaveAs)}
          className="flex items-center gap-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-gray-300 hover:text-white transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Save As
        </button>
      </div>

      {showSaveAs ? (
        <form onSubmit={handleSaveAs} className="mb-4 bg-white/5 rounded-xl p-3 border border-white/5 space-y-2.5">
          <label className="font-sans text-[10px] text-gray-400 block">Name your custom focus environment:</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              placeholder="e.g., Chill Beats, Deep Math..."
              maxLength={20}
              className="flex-1 bg-neutral-800 text-xs border border-white/10 rounded px-2.5 py-1.5 focus:border-amber-400 focus:outline-none text-white min-w-0"
            />
            <button
              type="submit"
              className="px-2.5 bg-amber-400 hover:bg-amber-500 text-neutral-900 rounded font-sans font-semibold text-xs cursor-pointer flex items-center shrink-0"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      ) : (
        <div className="flex gap-2 mb-4 bg-white/5 rounded-xl p-3 border border-white/5 items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400 fill-current" />
            <div className="flex flex-col">
              <span className="font-sans text-xs text-gray-300">Active Preset</span>
              <span className="font-sans text-[10px] text-gray-400">{currentProfile.name}</span>
            </div>
          </div>
          <button
            onClick={handleSaveCurrent}
            className="flex items-center gap-1 bg-amber-400 hover:bg-amber-500 text-neutral-900 font-sans font-semibold text-[10px] px-2.5 py-1.5 rounded-lg shadow transition-colors cursor-pointer"
            title="Overwrite Active Environment State"
          >
            <Save className="w-3.5 h-3.5" /> Overwrite
          </button>
        </div>
      )}

      {/* Profiles list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar max-h-52">
        {profiles.map((prof) => {
          const isActive = prof.name === currentProfile.name;
          const isPreset = isPresetProfile(prof.name);

          return (
            <div
              key={prof.name}
              className={`flex items-center justify-between p-2 rounded-xl border transition-all group ${
                isActive
                  ? "bg-amber-400/10 border-amber-400/40 text-amber-300"
                  : "bg-white/5 border-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <button
                onClick={() => onSelectProfile(prof.name)}
                className="flex-1 text-left font-sans text-xs py-1 px-1 min-w-0 truncate"
              >
                {prof.name}
              </button>

              {!isPreset && (
                <button
                  onClick={() => onDeleteProfile(prof.name)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-rose-500/20 hover:text-rose-400 rounded-lg text-gray-500 transition-all ml-2 cursor-pointer"
                  title="Delete Environment Profile"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
