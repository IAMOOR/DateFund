import React, { useState, useEffect } from 'react';
import {
  Utensils,
  Plane,
  Compass,
  Palette,
  Search,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { Goal, Event } from '../types';
import { ai } from '../ai';

export function DiscoverView({ location, goals, events }: {
  location: { lat: number, lng: number } | null,
  goals: Goal[],
  events: Event[]
}) {
  const [queryStr, setQueryStr] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const fetchSuggestions = async () => {
    setIsSuggesting(true);
    try {
      const goalsContext = goals.length > 0
        ? `The user is saving for: ${goals.map(g => g.name).join(', ')}.`
        : '';

      const prompt = `You are a romantic date and travel expert.
        ${goalsContext}
        Based on these goals, suggest 4 short, catchy search queries (2-4 words each) for date ideas or travel destinations.
        Return a JSON array of strings.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      const data = JSON.parse(response.text);
      setSuggestions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Suggestions failed", error);
    } finally {
      setIsSuggesting(false);
    }
  };

  const discoverIdeas = async (searchQuery?: string) => {
    const finalQuery = searchQuery || queryStr;
    setLoading(true);
    setSuggestions([]); // Clear suggestions when searching
    try {
      const goalsContext = goals.length > 0
        ? `The user is saving for: ${goals.map(g => g.name).join(', ')}.`
        : '';
      const eventsContext = events.length > 0
        ? `The user has planned: ${events.map(e => e.title).join(', ')}.`
        : '';

      const prompt = `You are a romantic date and travel concierge.
        ${goalsContext} ${eventsContext}
        Based on these interests and the search "${finalQuery || 'unique date ideas'}",
        provide 5 personalized, high-quality recommendations.
        ${location ? `Prioritize locations near ${location.lat}, ${location.lng} if relevant.` : ''}
        Return a JSON array of objects with title, source, summary, and a descriptive imageSearchTerm for finding a relevant photo.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json"
        }
      });
      const data = JSON.parse(response.text);
      setResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    discoverIdeas();
    fetchSuggestions();
  }, [location]);

  const quickFilters = [
    { label: 'Romantic Dinners', icon: <Utensils className="w-3 h-3" /> },
    { label: 'Weekend Getaways', icon: <Plane className="w-3 h-3" /> },
    { label: 'Outdoor Adventures', icon: <Compass className="w-3 h-3" /> },
    { label: 'Cultural Dates', icon: <Palette className="w-3 h-3" /> }
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-serif">Discover</h2>
        <p className="text-outline text-sm">Inspiration for your shared future.</p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder="What are you dreaming of?"
            className="w-full bg-surface-container text-on-surface rounded-full py-5 pl-14 pr-36 outline-none focus:ring-2 ring-primary/20 transition-all font-serif text-lg shadow-lg placeholder:text-outline/50"
            value={queryStr}
            onChange={e => setQueryStr(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && discoverIdeas()}
          />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-outline" />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => discoverIdeas()}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary text-on-primary-fixed px-8 py-3 rounded-full text-sm font-bold shadow-md"
          >
            Explore
          </motion.button>
        </div>

        {/* AI Suggestions */}
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] uppercase tracking-widest font-bold text-outline mr-2">AI Suggestions:</span>
            {suggestions.map((s, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 177, 196, 0.2)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setQueryStr(s);
                  discoverIdeas(s);
                }}
                className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full transition-colors border border-primary/20"
              >
                {s}
              </motion.button>
            ))}
          </div>
        )}

        {/* Quick Filters */}
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {quickFilters.map((filter, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.05, backgroundColor: "var(--surface-container-highest)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setQueryStr(filter.label);
                discoverIdeas(filter.label);
              }}
              className="flex items-center gap-2 whitespace-nowrap bg-surface-container-high px-4 py-2 rounded-full text-xs font-bold text-on-surface transition-colors border border-outline-variant/10"
            >
              {filter.icon}
              {filter.label}
            </motion.button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {results.map((idea, i) => (
          <DiscoverCard key={i} idea={idea} />
        ))}
      </div>
    </motion.div>
  );
}

function DiscoverCard({ idea }: { idea: any, key?: any }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const generateImage = async () => {
      setIsGenerating(true);
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              {
                text: `A high-quality, professional editorial photograph of: ${idea.title}. ${idea.summary}. Style: Romantic, elegant, cinematic lighting, high resolution.`,
              },
            ],
          },
          config: {
            imageConfig: {
              aspectRatio: '16:9',
            },
          },
        });

        const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (imagePart?.inlineData?.data) {
          setImageUrl(`data:image/png;base64,${imagePart.inlineData.data}`);
        } else {
          throw new Error("No image data returned");
        }
      } catch (error) {
        console.error("Image generation failed", error);
        // Fallback to picsum
        setImageUrl(`https://picsum.photos/seed/${encodeURIComponent(idea.imageSearchTerm || idea.title)}/800/400`);
      } finally {
        setIsGenerating(false);
      }
    };

    generateImage();
  }, [idea.title]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
      className="bg-surface-container-low overflow-hidden rounded-3xl border border-outline-variant/10 flex flex-col shadow-sm hover:shadow-xl transition-all duration-300 glass-highlight"
    >
      <div className="h-48 w-full relative bg-surface-container-highest overflow-hidden">
        {(isGenerating && !imageUrl) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[8px] uppercase tracking-widest font-bold text-outline">Painting your dream...</span>
          </div>
        )}
        {imageUrl && (
          <motion.img
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            src={imageUrl}
            alt={idea.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low/80 to-transparent" />
      </div>
      <div className="p-6 space-y-4">
        <h3 className="font-serif text-2xl">{idea.title}</h3>
        <p className="text-on-surface/80 text-sm leading-relaxed">{idea.summary}</p>
        <div className="flex justify-between items-center pt-2">
          <span className="text-[10px] uppercase tracking-widest font-bold text-outline">Source: {idea.source}</span>
          <motion.a
            whileHover={{ x: 5 }}
            href={`https://www.google.com/search?q=${encodeURIComponent(idea.title + ' ' + idea.source)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary text-xs font-bold uppercase tracking-widest hover:underline flex items-center gap-1"
          >
            Read More <ChevronRight className="w-3 h-3" />
          </motion.a>
        </div>
      </div>
    </motion.div>
  );
}
