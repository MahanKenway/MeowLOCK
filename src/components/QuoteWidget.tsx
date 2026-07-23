import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Quote, RefreshCw } from "lucide-react";
import { WorkspaceProfile } from "../types";

interface QuoteWidgetProps {
  activeProfile: WorkspaceProfile;
}

const QUOTES = {
  study: {
    morning: [
      { quote: "The secret of getting ahead is getting started.", author: "Mark Twain" },
      { quote: "Morning is an important time of day, because how you spend your morning can often tell you what kind of day you are going to have.", author: "Lemony Snicket" },
      { quote: "The mind is not a vessel to be filled, but a fire to be kindled.", author: "Plutarch" },
      { quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
      { quote: "He who asks is a fool for five minutes, but he who does not ask remains a fool forever.", author: "Chinese Proverb" }
    ],
    afternoon: [
      { quote: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
      { quote: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
      { quote: "Focus is a muscle, and you build it through distraction-free repetitions.", author: "Anonymous" },
      { quote: "Deep work is the superpower of the 21st century.", author: "Cal Newport" },
      { quote: "There are no shortcuts to any place worth going.", author: "Beverly Sills" }
    ],
    evening: [
      { quote: "Don't let what you cannot do interfere with what you can do.", author: "John Wooden" },
      { quote: "It always seems impossible until it's done.", author: "Nelson Mandela" },
      { quote: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
      { quote: "The beautiful thing about learning is that nobody can take it away from you.", author: "B.B. King" },
      { quote: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" }
    ],
    night: [
      { quote: "Study while others are sleeping; work while others are loafing; prepare while others are playing; and dream while others are wishing.", author: "William Arthur Ward" },
      { quote: "The night is the hardest time to be alive and 4am knows all my secrets.", author: "Poppy Z. Brite" },
      { quote: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
      { quote: "Great things are done by a series of small things brought together.", author: "Vincent Van Gogh" },
      { quote: "Dream big, study hard, and stay focused.", author: "Anonymous" }
    ]
  },
  coding: {
    morning: [
      { quote: "First, solve the problem. Then, write the code.", author: "John Johnson" },
      { quote: "Code is like humor. When you have to explain it, it’s bad.", author: "Cory House" }
    ],
    afternoon: [
      { quote: "Experience is the name everyone gives to their mistakes.", author: "Oscar Wilde" },
      { quote: "Fix the cause, not the symptom.", author: "Steve Maguire" }
    ],
    evening: [
      { quote: "Make it work, make it right, make it fast.", author: "Kent Beck" },
      { quote: "Simplicity is the soul of efficiency.", author: "Austin Freeman" }
    ],
    night: [
      { quote: "It’s not a bug – it’s an undocumented feature.", author: "Anonymous" },
      { quote: "Sometimes it pays to stay in bed on Monday, rather than spending the rest of the week debugging Monday’s code.", author: "Dan Salomon" }
    ]
  },
  relax: {
    morning: [
      { quote: "Breathe. Let go. And remind yourself that this very moment is the only one you know you have for sure.", author: "Oprah Winfrey" }
    ],
    afternoon: [
      { quote: "Almost everything will work again if you unplug it for a few minutes, including you.", author: "Anne Lamott" }
    ],
    evening: [
      { quote: "Tension is who you think you should be. Relaxation is who you are.", author: "Chinese Proverb" }
    ],
    night: [
      { quote: "Sleep is the best meditation.", author: "Dalai Lama" }
    ]
  },
  general: {
    morning: [
      { quote: "Write it on your heart that every day is the best day in the year.", author: "Ralph Waldo Emerson" }
    ],
    afternoon: [
      { quote: "Energy and persistence conquer all things.", author: "Benjamin Franklin" }
    ],
    evening: [
      { quote: "The day is over, it's time for rest.", author: "Anonymous" }
    ],
    night: [
      { quote: "Stars can't shine without darkness.", author: "D.H. Sidebottom" }
    ]
  }
};

export default function QuoteWidget({ activeProfile }: QuoteWidgetProps) {
  const [currentQuote, setCurrentQuote] = useState({ quote: "", author: "" });
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const lastUpdateRef = useRef(Date.now());

  const getQuotesArray = () => {
    const hour = new Date().getHours();
    let timeOfDay = "night";
    if (hour >= 5 && hour < 12) timeOfDay = "morning";
    else if (hour >= 12 && hour < 17) timeOfDay = "afternoon";
    else if (hour >= 17 && hour < 21) timeOfDay = "evening";

    const modeName = activeProfile.name.toLowerCase();
    let category = "general";
    if (modeName.includes("study") || modeName.includes("read") || modeName.includes("learn")) {
      category = "study";
    } else if (modeName.includes("code") || modeName.includes("program") || modeName.includes("dev")) {
      category = "coding";
    } else if (modeName.includes("relax") || modeName.includes("chill") || modeName.includes("rest") || modeName.includes("ambient")) {
      category = "relax";
    }

    return (QUOTES as any)[category][timeOfDay] || QUOTES.general.morning;
  };

  const cycleQuote = (manual = false) => {
    const quotesArray = getQuotesArray();
    if (quotesArray.length === 0) return;

    if (manual) {
      setIsRefreshing(true);
      setTimeout(() => setIsRefreshing(false), 600);
      lastUpdateRef.current = Date.now();
    }

    setQuoteIndex((prevIndex) => {
      const nextIndex = (prevIndex + 1) % quotesArray.length;
      setCurrentQuote(quotesArray[nextIndex]);
      return nextIndex;
    });
  };

  useEffect(() => {
    const quotesArray = getQuotesArray();
    const initialIndex = Math.floor(Math.random() * quotesArray.length);
    setQuoteIndex(initialIndex);
    setCurrentQuote(quotesArray[initialIndex] || quotesArray[0]);
    lastUpdateRef.current = Date.now();

    // Check elapsed time every minute to support hourly updates even if the browser goes to sleep
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastUpdateRef.current >= 3600000) {
        cycleQuote();
        lastUpdateRef.current = now;
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [activeProfile.name]);

  return (
    <div className="bg-[#1C1C1E]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-5 text-white shadow-2xl relative overflow-hidden flex flex-col justify-center min-h-[100px] md:min-h-[120px] group/quote">
      {/* Background Icon Decoration */}
      <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
        <Quote className="w-16 h-16 md:w-20 md:h-20" />
      </div>

      {/* Manual Refresh Button */}
      <button 
        onClick={() => cycleQuote(true)} 
        className="absolute top-3 right-3 text-gray-400 hover:text-white transition-all p-1 rounded-lg hover:bg-white/5 opacity-0 group-hover/quote:opacity-100 focus:opacity-100 z-20"
        title="Refresh Quote"
      >
        <RefreshCw className={`w-3.5 h-3.5 transition-transform duration-500 ${isRefreshing ? 'rotate-180 text-[#7c3aed]' : ''}`} />
      </button>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuote.quote}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <p className="text-xs sm:text-sm md:text-base lg:text-lg font-serif italic text-gray-200 mb-1.5 md:mb-2 leading-relaxed pr-8">
            "{currentQuote.quote}"
          </p>
          <p className="text-[11px] sm:text-xs md:text-sm font-medium text-[#7c3aed] text-right">
            — {currentQuote.author}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
