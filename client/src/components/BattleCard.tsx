import { motion } from "framer-motion";
import { Link } from "wouter";
import { Swords, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BattleCardProps {
  user: number;
  opponent: number;
  opponentName: string;
  exercise?: string;
  target?: number;
}

interface NoBattleCardProps {
  exercise?: string;
}

function AnimatedBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
      <motion.div
        className={cn("h-full rounded-full", color)}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(pct, 100)}%` }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      />
    </div>
  );
}

export function BattleCard({ user, opponent, opponentName, exercise, target = 100 }: BattleCardProps) {
  const lead = user - opponent;
  const maxVal = Math.max(user, opponent, target * 0.3, 1);
  const userPct = (user / maxVal) * 100;
  const oppPct = (opponent / maxVal) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.24, duration: 0.3 }}
      className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 hover:scale-[1.02] transition-all duration-200"
    >
      <div className="flex items-center gap-2 mb-4">
        <Swords className="w-4 h-4 text-red-400" />
        <span className="text-xs font-black text-red-400 uppercase tracking-[0.15em]">🥊 Battle</span>
        {exercise && <span className="ml-auto text-xs text-zinc-500">{exercise}</span>}
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-sm font-black text-green-400">YOU</span>
            <span className="text-base font-black text-green-400">{user} reps</span>
          </div>
          <AnimatedBar pct={userPct} color="bg-green-500" />
        </div>

        <div className="text-center text-[10px] font-black text-zinc-600 tracking-[0.25em]">VS</div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-sm font-black text-zinc-400">{opponentName.toUpperCase()}</span>
            <span className="text-base font-black text-zinc-400">{opponent} reps</span>
          </div>
          <AnimatedBar pct={oppPct} color="bg-zinc-600" />
        </div>
      </div>

      <div className={cn(
        "text-center text-xs font-bold py-2.5 rounded-xl",
        lead > 0 ? "bg-green-500/10 text-green-400 border border-green-500/20" :
        lead < 0 ? "bg-red-500/10 text-red-400 border border-red-500/20" :
        "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
      )}>
        {lead > 0 && `You're ahead by ${lead} reps 🔥`}
        {lead < 0 && `${opponentName} is ahead by ${Math.abs(lead)} reps — catch up! ⚡`}
        {lead === 0 && `Tied with ${opponentName}! Push harder 💪`}
      </div>
    </motion.div>
  );
}

export function NoBattleCard({ exercise }: NoBattleCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.24, duration: 0.3 }}
    >
      <Link href="/challenges">
        <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900 p-5 cursor-pointer hover:border-red-500/40 hover:bg-red-500/5 transition-all group">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/15 flex items-center justify-center flex-shrink-0">
              <Swords className="w-6 h-6 text-red-400" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-black text-red-400 uppercase tracking-widest mb-0.5">🥊 Battle</div>
              <p className="text-sm font-bold text-white">No active battle</p>
              <p className="text-xs text-zinc-500">
                Challenge a friend{exercise ? ` on ${exercise}` : " to compete"}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-red-400 transition-colors" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
