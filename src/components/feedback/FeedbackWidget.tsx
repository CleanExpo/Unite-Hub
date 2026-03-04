'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Star, Send, Check } from 'lucide-react';

export function FeedbackWidget({ source = 'ato' }: { source?: string }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!rating) return;
    setLoading(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          comment: comment.trim() || undefined,
          page: typeof window !== 'undefined' ? window.location.pathname : undefined,
          source,
        }),
      });
      setSubmitted(true);
      setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
        setRating(0);
        setComment('');
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-sm p-5 w-72 shadow-2xl"
          >
            {submitted ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-10 h-10 rounded-full bg-[#00FF88]/10 flex items-center justify-center">
                  <Check className="w-5 h-5 text-[#00FF88]" />
                </div>
                <p className="text-white text-sm font-medium">Thank you for your feedback!</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white text-sm font-semibold">How helpful was this?</h3>
                  <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onMouseEnter={() => setHover(star)}
                      onMouseLeave={() => setHover(0)}
                      onClick={() => setRating(star)}
                      className="p-0.5 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          star <= (hover || rating)
                            ? 'fill-[#FFB800] text-[#FFB800]'
                            : 'text-zinc-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Any comments? (optional)"
                  rows={3}
                  className="w-full bg-[#151515] border border-[#2a2a2a] rounded-sm px-3 py-2 text-white text-xs placeholder-zinc-600 resize-none focus:outline-none focus:border-[#00F5FF]/50 mb-3"
                />

                <button
                  onClick={handleSubmit}
                  disabled={!rating || loading}
                  className="w-full flex items-center justify-center gap-2 bg-[#00F5FF]/10 hover:bg-[#00F5FF]/20 disabled:opacity-40 disabled:cursor-not-allowed border border-[#00F5FF]/30 rounded-sm py-2 text-[#00F5FF] text-xs font-medium transition-colors"
                >
                  {loading ? (
                    <span>Sending...</span>
                  ) : (
                    <>
                      <Send className="w-3 h-3" />
                      Send Feedback
                    </>
                  )}
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-sm border text-sm font-medium transition-colors shadow-lg ${
          open
            ? 'bg-[#00F5FF]/10 border-[#00F5FF]/50 text-[#00F5FF]'
            : 'bg-[#0a0a0a] border-[#2a2a2a] text-zinc-400 hover:border-[#00F5FF]/30 hover:text-white'
        }`}
        whileTap={{ scale: 0.97 }}
      >
        <MessageSquare className="w-4 h-4" />
        Feedback
      </motion.button>
    </div>
  );
}
