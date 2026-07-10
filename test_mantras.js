const duration = 180;
const defaultMantras = [
    "Welcome to your focus zone. Let the music settle your mind.",
    "Breathe in deeply, hold, and release. Find your natural rhythm.",
    "Your attention is here, fully present in this moment.",
    "Step by step, line by line. Great things are built with patience.",
    "Release any tension in your shoulders, jaw, and brow.",
    "Deep focus is a quiet lake. Let thoughts ripple and dissolve.",
    "You are doing great. Keep going, calmly and steady.",
    "A quiet mind achieves brilliant focus.",
    "Breathe in clarity, breathe out distraction.",
    "Almost there. Let the peaceful sounds carry you through."
  ];

  const startTime = 5;
  const endTime = Math.max(startTime + 15, duration - 10);
  const activeDuration = endTime - startTime;
  const step = activeDuration / (defaultMantras.length - 1);

  const lyrics = defaultMantras.map((text, idx) => ({
    text,
    time: Math.round(startTime + idx * step)
  }));
console.log(lyrics);
