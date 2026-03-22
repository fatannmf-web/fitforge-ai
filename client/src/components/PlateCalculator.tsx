import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calculator } from "lucide-react";

// ── Plate definitions ──────────────────────────────────────────────────────
interface Plate { kg: number; color: string; label: string }

const PLATES: Plate[] = [
  { kg: 25,   color: "#ef4444", label: "25" },
  { kg: 20,   color: "#3b82f6", label: "20" },
  { kg: 15,   color: "#eab308", label: "15" },
  { kg: 10,   color: "#22c55e", label: "10" },
  { kg: 5,    color: "#94a3b8", label: "5"  },
  { kg: 2.5,  color: "#ef4444", label: "2.5" },
  { kg: 1.25, color: "#d1d5db", label: "1.25" },
];

const BAR_OPTIONS = [
  { label: "Olimpic 20kg", kg: 20 },
  { label: "Feminin 15kg", kg: 15 },
  { label: "EZ 10kg",      kg: 10 },
  { label: "Custom",       kg: -1 },
];

// ── Algorithm ──────────────────────────────────────────────────────────────
function calcPlates(total: number, bar: number): { plate: Plate; count: number }[] {
  const weightPerSide = (total - bar) / 2;
  if (weightPerSide <= 0) return [];
  let remaining = weightPerSide;
  const result: { plate: Plate; count: number }[] = [];
  for (const plate of PLATES) {
    if (remaining <= 0) break;
    const count = Math.floor(remaining / plate.kg + 0.001);
    if (count > 0) {
      result.push({ plate, count });
      remaining -= count * plate.kg;
    }
  }
  return result;
}

// ── Visual Barbell ──────────────────────────────────────────────────────────
function VisualBarbell({ plates, barKg }: { plates: { plate: Plate; count: number }[]; barKg: number }) {
  // Expand plates into individual discs
  const discs: Plate[] = [];
  for (const { plate, count } of plates) {
    for (let i = 0; i < Math.min(count, 4); i++) discs.push(plate);
  }

  const totalWeight = barKg + plates.reduce((s, { plate, count }) => s + plate.kg * count * 2, 0);

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Total weight display */}
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-black text-white">{totalWeight % 1 === 0 ? totalWeight : totalWeight.toFixed(2)}</span>
        <span className="text-sm text-white/40">kg total</span>
      </div>

      {/* Barbell visualization */}
      <div className="w-full flex items-center justify-center gap-0 overflow-hidden">
        {/* Left collar */}
        <div className="w-2 h-8 rounded-l-sm flex-shrink-0" style={{ background: "#6b7280" }} />
        {/* Left plates (reversed) */}
        {[...discs].reverse().map((disc, i) => (
          <div key={i} className="flex-shrink-0 flex items-center justify-center rounded-sm"
            style={{ width: 14, height: 44 + (disc.kg >= 20 ? 16 : disc.kg >= 10 ? 8 : 0), background: disc.color, marginLeft: -1 }}>
            <span className="text-[7px] font-black text-white/90 rotate-90 whitespace-nowrap">{disc.label}</span>
          </div>
        ))}
        {/* Bar */}
        <div className="flex-1 h-3 min-w-[40px]" style={{ background: "linear-gradient(180deg, #9ca3af 0%, #6b7280 50%, #9ca3af 100%)", maxWidth: 80 }} />
        {/* Right plates */}
        {discs.map((disc, i) => (
          <div key={i} className="flex-shrink-0 flex items-center justify-center rounded-sm"
            style={{ width: 14, height: 44 + (disc.kg >= 20 ? 16 : disc.kg >= 10 ? 8 : 0), background: disc.color, marginRight: -1 }}>
            <span className="text-[7px] font-black text-white/90 rotate-90 whitespace-nowrap">{disc.label}</span>
          </div>
        ))}
        {/* Right collar */}
        <div className="w-2 h-8 rounded-r-sm flex-shrink-0" style={{ background: "#6b7280" }} />
      </div>
      {plates.length === 0 && (
        <p className="text-xs text-white/30 mt-1">Introduce greutatea țintă</p>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
interface PlateCalculatorProps {
  initialWeight?: number;
  onClose: () => void;
  onApply?: (weight: number) => void;
}

export function PlateCalculator({ initialWeight = 60, onClose, onApply }: PlateCalculatorProps) {
  const [barType, setBarType] = useState(0); // index into BAR_OPTIONS
  const [customBar, setCustomBar] = useState("20");
  const [target, setTarget] = useState(String(initialWeight));

  const barKg = BAR_OPTIONS[barType].kg === -1 ? parseFloat(customBar) || 20 : BAR_OPTIONS[barType].kg;
  const targetKg = parseFloat(target) || 0;
  const plates = calcPlates(targetKg, barKg);
  const totalPossible = barKg + plates.reduce((s, { plate, count }) => s + plate.kg * count * 2, 0);
  const isExact = Math.abs(totalPossible - targetKg) < 0.01;

  const PRESETS = [40, 60, 80, 100, 120, 140, 160];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 350 }}
        className="w-full max-w-lg rounded-t-3xl overflow-hidden"
        style={{ background: "#131929", border: "1px solid rgba(255,255,255,0.08)", borderBottom: "none" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5" style={{ color: "#00FFA3" }} />
            <h2 className="text-base font-black text-white">Calculator Discuri</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.08)" }}>
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        <div className="px-5 pb-6 space-y-4">
          {/* Bar selector */}
          <div>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-2">Tip bară</p>
            <div className="flex gap-2 flex-wrap">
              {BAR_OPTIONS.map((opt, i) => (
                <button key={i} onClick={() => setBarType(i)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: barType === i ? "rgba(0,255,163,0.15)" : "rgba(255,255,255,0.06)",
                    color: barType === i ? "#00FFA3" : "rgba(255,255,255,0.5)",
                    border: `1px solid ${barType === i ? "rgba(0,255,163,0.3)" : "rgba(255,255,255,0.08)"}`,
                  }}
                  data-testid={`button-bar-${i}`}>
                  {opt.label}
                </button>
              ))}
            </div>
            {BAR_OPTIONS[barType].kg === -1 && (
              <div className="mt-2 flex items-center gap-2">
                <input type="number" value={customBar} onChange={e => setCustomBar(e.target.value)}
                  className="w-20 text-center py-1.5 rounded-lg text-sm font-bold text-white bg-transparent border outline-none"
                  style={{ borderColor: "rgba(255,255,255,0.15)" }} placeholder="kg" inputMode="decimal" />
                <span className="text-xs text-white/40">kg</span>
              </div>
            )}
          </div>

          {/* Target weight input */}
          <div>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-2">Greutate țintă</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setTarget(t => String(Math.max(barKg, parseFloat(t || "0") - 2.5)))}
                className="w-10 h-10 rounded-full text-white text-xl font-bold flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.08)" }}>−</button>
              <input type="number" value={target} onChange={e => setTarget(e.target.value)}
                className="flex-1 text-center text-3xl font-black text-white bg-transparent outline-none"
                inputMode="decimal" data-testid="input-plate-target" />
              <span className="text-sm text-white/40 w-6">kg</span>
              <button onClick={() => setTarget(t => String(parseFloat(t || "0") + 2.5))}
                className="w-10 h-10 rounded-full text-white text-xl font-bold flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.08)" }}>+</button>
            </div>
            {/* Presets */}
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {PRESETS.map(w => (
                <button key={w} onClick={() => setTarget(String(w))}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all"
                  style={{
                    background: targetKg === w ? "rgba(0,255,163,0.12)" : "rgba(255,255,255,0.05)",
                    color: targetKg === w ? "#00FFA3" : "rgba(255,255,255,0.4)",
                    border: `1px solid ${targetKg === w ? "rgba(0,255,163,0.2)" : "rgba(255,255,255,0.06)"}`,
                  }}>{w}kg</button>
              ))}
            </div>
          </div>

          {/* Visual Barbell */}
          <div className="py-4 rounded-2xl border"
            style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}>
            <VisualBarbell plates={plates} barKg={barKg} />
          </div>

          {/* Plate breakdown */}
          {plates.length > 0 && (
            <div>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-2">
                Per parte ({((targetKg - barKg) / 2).toFixed(2)}kg per parte)
                {!isExact && <span className="text-yellow-400 ml-2">≈ {totalPossible}kg posibil</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {plates.map(({ plate, count }) => (
                  <div key={plate.kg} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                    style={{ background: `${plate.color}18`, border: `1px solid ${plate.color}40` }}>
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: plate.color }} />
                    <span className="text-sm font-black text-white">{count} × {plate.label}kg</span>
                    <span className="text-xs text-white/30">({(count * plate.kg).toFixed(2)}kg)</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Apply button */}
          {onApply && (
            <button
              onClick={() => { onApply(totalPossible); onClose(); }}
              className="w-full py-3.5 rounded-2xl font-black text-base text-black"
              style={{ background: "#00FFA3" }}
              data-testid="button-apply-plate-weight">
              Aplică {totalPossible}kg →
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
