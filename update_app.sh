# 1. Remove import
sed -i '/import { AiGeneratorWidget } from ".\/components\/AiGeneratorWidget";/d' src/App.tsx

# 2. Remove state
sed -i '/const \[isAiGeneratorOpen, setIsAiGeneratorOpen\] = useState(false);/d' src/App.tsx

# 3. Remove AI Generator Widget block
# It starts around: {/* AI Image Studio */}
# and ends with: </AnimatePresence> after it.
sed -i '/{\/\* AI Image Studio \*\/}/,/<\/AnimatePresence>/d' src/App.tsx

# 4. Remove AI Studio button
#         <button
#          onClick={() => setIsAiGeneratorOpen(!isAiGeneratorOpen)}
#          className={`p-2 rounded-lg transition-all cursor-pointer hover:bg-white\/10 ${
#            isAiGeneratorOpen ? "text-purple-400" : "text-gray-400 hover:text-white"
#          }`}
#          title="AI Studio (Images & Videos)"
#        >
#          <ImageIcon className="w-4 h-4" />
#        </button>
sed -i '/onClick={() => setIsAiGeneratorOpen(!isAiGeneratorOpen)}/,/<\/button>/d' src/App.tsx

# 5. Move Timer to right dock
# Find Timer button block in left dock and delete it
sed -i '/onClick={() => toggleWidget("timer")}/,/<\/button>/d' src/App.tsx

