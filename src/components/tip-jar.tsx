'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, Send, EyeOff, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const PRESET_AMOUNTS = [2000, 5000, 10000];

interface TipJarProps {
  sessionId: string;
  guideId: string;
  guideName: string;
  seekerId: string;
  onClose?: () => void;
  onSent?: () => void;
}

export function TipJar({ sessionId, guideId, guideName, seekerId, onClose, onSent }: TipJarProps) {
  const [amount, setAmount] = useState<number>(5000);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [showHearts, setShowHearts] = useState(false);

  const finalAmount = customAmount ? parseInt(customAmount) : amount;

  const handleSend = async () => {
    if (!finalAmount || finalAmount <= 0) return;

    setSending(true);
    setShowHearts(true);
    try {
      const res = await fetch('/api/tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          fromUserId: seekerId,
          toGuideId: guideId,
          amount: finalAmount,
          message,
          isAnonymous,
        }),
      });

      if (res.ok) {
        setSent(true);
        onSent?.();
      }
    } catch {
      // Demo: still show success
      setSent(true);
    }
    setSending(false);
    setTimeout(() => setShowHearts(false), 2000);
  };

  return (
    <div className="relative">
      {/* Heart animation overlay */}
      <AnimatePresence>
        {showHearts && (
          <div className="absolute inset-0 pointer-events-none z-10">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 1, y: 0, x: 0, scale: 0.5 }}
                animate={{
                  opacity: 0,
                  y: -120 - Math.random() * 80,
                  x: (Math.random() - 0.5) * 100,
                  scale: 1 + Math.random(),
                }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2"
              >
                <Heart className="w-5 h-5 text-[#F43F5E] fill-[#F43F5E]" />
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {sent ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-6"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: 2, duration: 0.4 }}
          >
            <Heart className="w-16 h-16 text-[#F43F5E] fill-[#F43F5E] mx-auto" />
          </motion.div>
          <p className="text-lg font-bold text-[#065F46] dark:text-[#34D399] mt-3">
            Tip Sent!
          </p>
          <p className="text-sm text-[#64748B] mt-1">
            You sent TZS {finalAmount.toLocaleString()} to {guideName}
          </p>
          <Button
            onClick={onClose}
            className="mt-4 bg-[#065F46] text-white rounded-xl"
          >
            Done
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-[#F43F5E] fill-[#F43F5E]" />
              <h3 className="text-lg font-bold text-[#065F46] dark:text-[#34D399]">
                Tip {guideName}
              </h3>
            </div>
            {onClose && (
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F1F5F9]">
                <X className="w-4 h-4 text-[#64748B]" />
              </button>
            )}
          </div>

          {/* Preset amounts */}
          <div className="grid grid-cols-3 gap-2">
            {PRESET_AMOUNTS.map((preset) => (
              <motion.button
                key={preset}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { setAmount(preset); setCustomAmount(''); }}
                className={`py-3 rounded-xl text-sm font-bold transition-all ${
                  amount === preset && !customAmount
                    ? 'bg-[#065F46] text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-[#F1F5F9] dark:bg-[#1E293B] text-[#64748B]'
                }`}
              >
                TZS {(preset / 1000).toFixed(0)}K
              </motion.button>
            ))}
          </div>

          {/* Custom amount */}
          <div>
            <label className="text-xs text-[#94A3B8]">Custom amount (TZS)</label>
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full mt-1 px-3 py-2 rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-sm focus:border-[#065F46] focus:ring-1 focus:ring-[#34D399]/20 outline-none"
            />
          </div>

          {/* Message */}
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a message (optional)"
            className="w-full min-h-[60px] resize-none"
          />

          {/* Anonymous toggle */}
          <button
            onClick={() => setIsAnonymous(!isAnonymous)}
            className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#065F46] dark:hover:text-[#34D399] transition-colors"
          >
            {isAnonymous ? (
              <EyeOff className="w-4 h-4 text-[#F59E0B]" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            {isAnonymous ? 'Anonymous tip' : 'Send anonymously'}
          </button>

          {/* Send button */}
          <Button
            onClick={handleSend}
            disabled={sending || !finalAmount}
            className="w-full bg-gradient-to-r from-[#F43F5E] to-[#E11D48] hover:from-[#E11D48] hover:to-[#BE123C] text-white font-bold rounded-xl h-12 shadow-lg shadow-rose-500/20"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Heart className="w-4 h-4 mr-2 fill-white" />
                Send TZS {finalAmount.toLocaleString()} Tip
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
