import React, { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { Image as ImageIcon, Video, Loader2, Upload, FileImage, Download } from "lucide-react";
import { generateImageClient, generateVideoClient, pollVideoStatusClient, downloadVideoClient } from "../services/gemini";

interface AiGeneratorWidgetProps {
  onSetBackground: (url: string) => void;
}

export function AiGeneratorWidget({ onSetBackground }: AiGeneratorWidgetProps) {
  const [activeTab, setActiveTab] = useState<"image" | "video">("image");
  
  // Image State
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageSize, setImageSize] = useState("1K");
  const [imageModel, setImageModel] = useState("gemini-3.1-flash-image");
  const [imageRatio, setImageRatio] = useState("16:9");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState("");
  const [imageError, setImageError] = useState("");

  // Video State
  const [videoPrompt, setVideoPrompt] = useState("");
  const [videoRatio, setVideoRatio] = useState("16:9");
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoStatus, setVideoStatus] = useState("");
  const [generatedVideo, setGeneratedVideo] = useState("");
  const [videoError, setVideoError] = useState("");
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, []);

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;
    
    setIsGeneratingImage(true);
    setImageError("");
    setGeneratedImage("");
    
    try {
      const imageUrl = await generateImageClient({
        prompt: imagePrompt,
        size: imageSize,
        aspectRatio: imageRatio as any,
        model: imageModel
      });
      
      setGeneratedImage(imageUrl);
    } catch (err: any) {
      setImageError(err.message);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setReferenceImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim() && !referenceImage) return;
    
    setIsGeneratingVideo(true);
    setVideoError("");
    setGeneratedVideo("");
    setVideoStatus("Starting generation...");
    
    try {
      const payload: any = {
        aspectRatio: videoRatio as any
      };
      
      if (videoPrompt.trim()) payload.prompt = videoPrompt;
      if (referenceImage) {
        payload.base64Image = referenceImage;
        payload.mimeType = referenceImage.split(';')[0].split(':')[1];
      }

      const operationName = await generateVideoClient(payload);
      pollVideoStatus(operationName);
    } catch (err: any) {
      setVideoError(err.message);
      setIsGeneratingVideo(false);
    }
  };

  const pollVideoStatus = (operationName: string) => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    
    setVideoStatus("Generating video (this may take a few minutes)...");
    
    pollingIntervalRef.current = window.setInterval(async () => {
      try {
        const data = await pollVideoStatusClient(operationName);
        
        if (data.done) {
          clearInterval(pollingIntervalRef.current!);
          if (data.uri) {
            setVideoStatus("Downloading and preparing video...");
            try {
              const videoBlobUrl = await downloadVideoClient(data.uri);
              setGeneratedVideo(videoBlobUrl);
              setVideoStatus("");
            } catch (dlErr: any) {
              setVideoError("Video was generated, but downloading failed due to browser CORS policy. Direct URL: " + data.uri);
            }
          } else {
            setVideoError("Video generation failed or timed out.");
          }
          setIsGeneratingVideo(false);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 10000); // Poll every 10 seconds
  };

  const setAsBackground = (url: string) => {
    onSetBackground(url);
  };

  return (
    <div className="bg-[#1C1C1E]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-white shadow-2xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-purple-400" />
          AI Studio
        </h3>
        
        <div className="flex bg-black/40 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("image")}
            className={`px-4 py-1.5 rounded-md text-sm transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === "image" ? "bg-white/20 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            <ImageIcon className="w-4 h-4" /> Images
          </button>
          <button
            onClick={() => setActiveTab("video")}
            className={`px-4 py-1.5 rounded-md text-sm transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === "video" ? "bg-white/20 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            <Video className="w-4 h-4" /> Videos
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {activeTab === "image" && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 font-medium mb-2 block uppercase tracking-wider">Prompt</label>
              <textarea
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="Describe the image you want to generate..."
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 resize-none h-24"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Model</label>
                <select 
                  value={imageModel} 
                  onChange={(e) => setImageModel(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"
                >
                  <option value="gemini-3.1-flash-image">Flash Image</option>
                  <option value="gemini-3-pro-image-preview">Pro Image</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Size</label>
                <select 
                  value={imageSize} 
                  onChange={(e) => setImageSize(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"
                >
                  <option value="1K">1K</option>
                  <option value="2K">2K</option>
                  <option value="4K">4K</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Aspect Ratio</label>
                <select 
                  value={imageRatio} 
                  onChange={(e) => setImageRatio(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"
                >
                  <option value="16:9">16:9 Landscape</option>
                  <option value="1:1">1:1 Square</option>
                  <option value="9:16">9:16 Portrait</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerateImage}
              disabled={isGeneratingImage || !imagePrompt.trim()}
              className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGeneratingImage ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : "Generate Image"}
            </button>

            {imageError && (
              <div className="bg-red-500/20 text-red-300 p-3 rounded-lg text-sm border border-red-500/20">
                {imageError}
              </div>
            )}

            {generatedImage && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pt-4 border-t border-white/10">
                <img src={generatedImage || undefined} alt="Generated result" className="w-full rounded-lg shadow-lg border border-white/10" />
                <button
                  onClick={() => setAsBackground(generatedImage)}
                  className="w-full py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-colors text-sm font-medium cursor-pointer"
                >
                  Set as Background
                </button>
              </motion.div>
            )}
          </div>
        )}

        {activeTab === "video" && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 font-medium mb-2 block uppercase tracking-wider">Prompt (Optional)</label>
              <textarea
                value={videoPrompt}
                onChange={(e) => setVideoPrompt(e.target.value)}
                placeholder="Describe how the image should animate..."
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 resize-none h-20"
              />
            </div>
            
            <div>
              <label className="text-xs text-gray-400 font-medium mb-2 block uppercase tracking-wider">Reference Image (Optional)</label>
              <div className="flex gap-4 items-center">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-2 bg-black/40 border border-white/10 hover:bg-white/10 text-gray-300 rounded-lg transition-colors text-sm font-medium cursor-pointer flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" /> Upload Image
                </button>
                {referenceImage && (
                  <div className="relative w-12 h-12 rounded overflow-hidden border border-white/20">
                    <img src={referenceImage || undefined} alt="Reference" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Aspect Ratio</label>
              <select 
                value={videoRatio} 
                onChange={(e) => setVideoRatio(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white"
              >
                <option value="16:9">16:9 Landscape</option>
                <option value="9:16">9:16 Portrait</option>
              </select>
            </div>

            <button
              onClick={handleGenerateVideo}
              disabled={isGeneratingVideo || (!videoPrompt.trim() && !referenceImage)}
              className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGeneratingVideo ? <><Loader2 className="w-4 h-4 animate-spin" /> {videoStatus}</> : "Generate Video"}
            </button>

            {videoError && (
              <div className="bg-red-500/20 text-red-300 p-3 rounded-lg text-sm border border-red-500/20">
                {videoError}
              </div>
            )}

            {generatedVideo && !isGeneratingVideo && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pt-4 border-t border-white/10">
                <video src={generatedVideo || undefined} autoPlay loop muted playsInline className="w-full rounded-lg shadow-lg border border-white/10" />
                <button
                  onClick={() => setAsBackground(generatedVideo)}
                  className="w-full py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors text-sm font-medium cursor-pointer"
                >
                  Set as Background
                </button>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
