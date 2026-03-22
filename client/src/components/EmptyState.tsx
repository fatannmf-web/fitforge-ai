import { motion } from "framer-motion";
import { Link } from "wouter";

interface EmptyStateProps {
  emoji: string;
  title: string;
  subtitle: string;
  ctaLabel?: string;
  ctaHref?: string;
  ctaOnClick?: () => void;
  secondaryLabel?: string;
  secondaryOnClick?: () => void;
  hint?: string;
}

export function EmptyState({
  emoji,
  title,
  subtitle,
  ctaLabel,
  ctaHref,
  ctaOnClick,
  secondaryLabel,
  secondaryOnClick,
  hint,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center justify-center text-center py-16 px-6"
    >
      {/* Emoji cu glow */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className="relative mb-6"
      >
        <div className="w-24 h-24 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-4xl">
          {emoji}
        </div>
        <div className="absolute inset-0 rounded-3xl bg-primary/5 blur-xl -z-10" />
      </motion.div>

      {/* Text */}
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xl font-black text-foreground mb-2 font-display"
      >
        {title}
      </motion.h3>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="text-muted-foreground text-sm max-w-xs leading-relaxed mb-8"
      >
        {subtitle}
      </motion.p>

      {/* CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col sm:flex-row gap-3 w-full max-w-xs"
      >
        {ctaLabel && (
          ctaHref ? (
            <Link href={ctaHref} className="flex-1">
              <button className="w-full py-3 px-6 rounded-2xl font-bold text-sm text-black bg-primary hover:bg-primary/90 transition-all active:scale-95">
                {ctaLabel}
              </button>
            </Link>
          ) : (
            <button
              onClick={ctaOnClick}
              className="flex-1 py-3 px-6 rounded-2xl font-bold text-sm text-black bg-primary hover:bg-primary/90 transition-all active:scale-95"
            >
              {ctaLabel}
            </button>
          )
        )}
        {secondaryLabel && (
          <button
            onClick={secondaryOnClick}
            className="flex-1 py-3 px-6 rounded-2xl font-bold text-sm border border-border hover:bg-secondary/50 transition-all active:scale-95"
          >
            {secondaryLabel}
          </button>
        )}
      </motion.div>

      {/* Hint */}
      {hint && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xs text-muted-foreground/60 mt-4"
        >
          {hint}
        </motion.p>
      )}
    </motion.div>
  );
}

// ── Variante predefinite ───────────────────────────────────────────────────────

export function EmptyWorkouts({ onCreateClick, onExploreClick }: { onCreateClick: () => void; onExploreClick: () => void }) {
  return (
    <EmptyState
      emoji="🏋️"
      title="Niciun antrenament încă"
      subtitle="Alege un program gata făcut sau creează-ți propriul antrenament personalizat."
      ctaLabel="🤖 Generează cu AI"
      ctaOnClick={onCreateClick}
      secondaryLabel="Explorează programe"
      secondaryOnClick={onExploreClick}
      hint="AI-ul generează un plan complet în 10 secunde"
    />
  );
}

export function EmptyNutrition({ onScanClick, onLogClick }: { onScanClick: () => void; onLogClick: () => void }) {
  return (
    <EmptyState
      emoji="🥗"
      title="Nicio masă logată azi"
      subtitle="Scanează mâncarea cu camera sau adaugă manual. AI-ul calculează instant caloriile și macronutrienții."
      ctaLabel="📸 Scanează cu AI"
      ctaOnClick={onScanClick}
      secondaryLabel="Adaugă manual"
      secondaryOnClick={onLogClick}
      hint="Pro: scanare foto frigider → rețete personalizate"
    />
  );
}

export function EmptyProgress({ onAddClick }: { onAddClick: () => void }) {
  return (
    <EmptyState
      emoji="📊"
      title="Nicio măsurătoare încă"
      subtitle="Adaugă prima măsurătoare și urmărește-ți transformarea în timp. Graficele se construiesc automat."
      ctaLabel="+ Adaugă prima măsurătoare"
      ctaOnClick={onAddClick}
      hint="Adaugă greutate, % grăsime, talie, piept și brațe"
    />
  );
}

export function EmptyCommunity({ onPostClick }: { onPostClick: () => void }) {
  return (
    <EmptyState
      emoji="👥"
      title="Fii primul care postează!"
      subtitle="Distribuie un milestone, o transformare sau o gândire. Comunitatea FitForge te așteaptă."
      ctaLabel="✍️ Scrie prima postare"
      ctaOnClick={onPostClick}
      hint="Postările cu transformări primesc cel mai mult engagement"
    />
  );
}

export function EmptyLeaderboardFriends() {
  return (
    <EmptyState
      emoji="🤝"
      title="Niciun prieten urmărit"
      subtitle="Urmărește utilizatori din clasamentul Global și competiția devine personală."
      ctaLabel="Mergi la Global"
      ctaHref="/leaderboard"
      hint="Apasă Urmărește pe orice utilizator din clasamentul Global"
    />
  );
}

export function EmptyLeaderboardCity() {
  return (
    <EmptyState
      emoji="🏙️"
      title="Adaugă orașul tău"
      subtitle="Completează orașul în profil și concurează cu cei din zona ta."
      ctaLabel="Editează profilul"
      ctaHref="/profile"
      hint="Profil → Editează → Adaugă orașul"
    />
  );
}

export function EmptyAchievements() {
  return (
    <EmptyState
      emoji="🏆"
      title="Nicio realizare debloc​ată încă"
      subtitle="Completează primul antrenament pentru a debloca primul tău badge. Sunt 20+ badge-uri de câștigat!"
      ctaLabel="Mergi la antrenamente"
      ctaHref="/workouts"
      hint="Primul badge: completează un antrenament"
    />
  );
}
