/**
 * useLang() — hook central pentru traduceri FitForge AI
 *
 * Returnează:
 *   - tx: obiectul complet de traduceri pentru limba curentă
 *   - lang: codul limbii curente ("ro" | "en" | "es" | "pt" | "de")
 *   - setLang: funcție pentru schimbarea limbii
 *   - voiceLang: codul vocal pentru TTS ("ro-RO", "en-US" etc.)
 *   - t: funcție helper — t(key.subkey) returnează string-ul tradus
 *
 * Exemplu de utilizare:
 *   const { tx, lang } = useLang();
 *   <h1>{tx.dashboard.title}</h1>
 *   <button>{tx.common.save}</button>
 */

import { useCallback, useSyncExternalStore } from "react";
import i18n from "@/i18n/index";
import {
  translations,
  SUPPORTED_LANGUAGES,
  type LangCode,
  type Translations,
} from "./translations";

// ─── Store extern pentru sincronizare React ───────────────────────────────────
const listeners = new Set<() => void>();

function getCurrentLang(): LangCode {
  const saved = localStorage.getItem("fitforge_lang") || "ro";
  const valid = SUPPORTED_LANGUAGES.map(l => l.code);
  return valid.includes(saved as LangCode) ? (saved as LangCode) : "ro";
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function notifyAll() {
  listeners.forEach(cb => cb());
}

// ─── Rezolvă o valoare de traducere recursiv ──────────────────────────────────
type TranslationNode = Record<string, string> | Record<string, Record<string, string>>;

function resolveNode(node: TranslationNode, lang: LangCode): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key of Object.keys(node)) {
    const val = (node as any)[key];
    if (typeof val === "object" && "ro" in val && "en" in val) {
      // Frunză — returnează stringul pentru limba curentă
      result[key] = (val as Record<LangCode, string>)[lang] ?? val["en"];
    } else if (typeof val === "object") {
      // Nod intermediar — recursiv
      result[key] = resolveNode(val, lang);
    } else {
      result[key] = val;
    }
  }
  return result;
}

// ─── Hook principal ───────────────────────────────────────────────────────────
export function useLang() {
  const lang = useSyncExternalStore(subscribe, getCurrentLang, () => "ro" as LangCode);

  const tx = resolveNode(translations as any, lang) as {
    [K in keyof Translations]: {
      [SK in keyof Translations[K]]: Translations[K][SK] extends Record<LangCode, string>
        ? string
        : { [SSK in keyof Translations[K][SK]]: string };
    };
  };

  const setLang = useCallback(async (code: LangCode) => {
    localStorage.setItem("fitforge_lang", code);
    i18n.changeLanguage(code);
    notifyAll();
    // Salvează pe server
    try {
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ language: code }),
      });
    } catch { /* silent */ }
  }, []);

  const voiceLang = SUPPORTED_LANGUAGES.find(l => l.code === lang)?.voiceLang ?? "ro-RO";
  const langName = SUPPORTED_LANGUAGES.find(l => l.code === lang)?.name ?? "Română";

  return { tx, lang, setLang, voiceLang, langName };
}

// ─── Funcție utilitară (fără hook, pentru server-side sau funcții pure) ───────
export function getLangString(
  node: Record<LangCode, string>,
  lang: LangCode
): string {
  return node[lang] ?? node["en"] ?? node["ro"];
}

// ─── Re-export util ──────────────────────────────────────────────────────────
export { SUPPORTED_LANGUAGES, type LangCode };
