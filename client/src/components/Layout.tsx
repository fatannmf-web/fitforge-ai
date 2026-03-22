import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";
import { NotificationsBell } from "@/components/NotificationsBell";
import { FloatingAIButton } from "@/components/FloatingAIButton";
import {
  Dumbbell, Utensils, TrendingUp,
  Trophy, Bot, User, Menu, X, LogOut, Flame, Globe, ChevronDown, Camera, Crown, Zap, Home, CalendarDays, Star, Sun, Moon
} from "lucide-react";
import { useIsPro } from "@/hooks/use-subscription";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/use-profile";
import { useLang, SUPPORTED_LANGUAGES } from "@/i18n/useLang";
import { useTheme } from "@/hooks/use-theme";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const { data: profile } = useProfile();
  const { tx, lang, setLang } = useLang();
  const isPro = useIsPro();
  const { theme, toggleTheme, isDark } = useTheme();

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === lang) || SUPPORTED_LANGUAGES[0];

  const SIDEBAR_ITEMS = [
    { href: "/today",          label: tx.nav.dashboard,                        icon: CalendarDays },
    { href: "/workouts",       label: tx.nav.workouts,                         icon: Dumbbell },
    { href: "/nutrition",      label: tx.nav.nutrition,                        icon: Utensils },
    { href: "/progress",       label: tx.nav.progress,                         icon: TrendingUp },
    { href: "/ai-coach",       label: tx.nav.aiCoach,     highlight: true,     icon: Bot },
    { href: "/body-scan",      label: "Body Scan AI",     highlight: true,     icon: Camera,  badge: "AI" },
    { href: "/achievements",   label: tx.nav.achievements,                     icon: Trophy },
    { href: "/leaderboard",    label: tx.nav.leaderboard,                      icon: Star },
    { href: "/transformation", label: "Transformation",  highlight: true,     icon: Flame, badge: "VIRAL" },
    { href: "/profile",        label: tx.nav.profile,                          icon: User },
    { href: "/pricing",        label: isPro ? "Plan Pro ✨" : tx.profile.upgradePro, icon: isPro ? Crown : Zap, highlight: !isPro },
  ];

  const BOTTOM_NAV = [
    { href: "/today",    label: tx.nav.dashboard, icon: Home },
    { href: "/workouts", label: tx.nav.workouts,  icon: Dumbbell },
    { href: "/ai-coach", label: tx.nav.aiCoach,   icon: Bot },
    { href: "/profile",  label: tx.nav.profile,   icon: User },
  ];

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleLangChange = async (code: any) => {
    await setLang(code);
    setIsLangOpen(false);
  };

  const SidebarContent = () => (
    <>
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <Dumbbell className="w-5 h-5 text-black" />
          </div>
          <span className="font-display font-bold text-2xl tracking-tight">FitForge<span className="text-primary">.ai</span></span>
        </div>
        <div className="flex items-center gap-1">
          <div className="hidden md:block">
            <NotificationsBell />
          </div>
          <button className="md:hidden p-2 text-muted-foreground" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {profile && (
        <div className="px-6 mb-4">
          <div className="p-4 rounded-2xl bg-sidebar-accent border border-white/5 flex items-center gap-4">
            <img
              src={profile.avatarUrl || `https://ui-avatars.com/api/?name=${profile.displayName}&background=random`}
              alt="Avatar"
              className="w-12 h-12 rounded-full border-2 border-primary"
            />
            <div>
              <p className="font-semibold text-sm truncate">{profile.displayName}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  {tx.common.level} {profile.level}
                </span>
                <span className="text-xs text-orange-400 font-medium flex items-center gap-1">
                  <Flame className="w-3 h-3" /> {profile.streak}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Language Selector — 5 limbi */}
      <div className="px-4 mb-3 relative">
        <button
          data-testid="button-language-selector"
          onClick={() => setIsLangOpen(prev => !prev)}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-200 border border-white/5"
        >
          <Globe className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 text-left">{currentLang.flag} {currentLang.name}</span>
          <ChevronDown className={cn("w-4 h-4 transition-transform", isLangOpen && "rotate-180")} />
        </button>

        {isLangOpen && (
          <div className="absolute left-4 right-4 top-full mt-1 z-50 rounded-xl bg-sidebar border border-sidebar-border shadow-xl overflow-hidden">
            <div className="py-1">
              {SUPPORTED_LANGUAGES.map(l => (
                <button
                  key={l.code}
                  data-testid={`button-lang-${l.code}`}
                  onClick={() => handleLangChange(l.code)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-sidebar-accent transition-colors text-left",
                    lang === l.code ? "text-primary font-semibold" : "text-sidebar-foreground/80"
                  )}
                >
                  <span className="text-base">{l.flag}</span>
                  <span>{l.name}</span>
                  {lang === l.code && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <PWAInstallBanner />

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {SIDEBAR_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
              <div className={cn(
                "flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-200 cursor-pointer group",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                (item as any).highlight && !isActive && "text-accent hover:text-accent hover:bg-accent/10"
              )}>
                <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive && "text-primary")} />
                <span className="flex-1">{item.label}</span>
                {(item as any).badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground leading-none">
                    {(item as any).badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto space-y-1">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          data-testid="button-toggle-theme"
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span>{isDark ? "Mod Luminos" : "Mod Întunecat"}</span>
          <div className={cn(
            "ml-auto w-10 h-5 rounded-full transition-colors relative",
            isDark ? "bg-primary/30" : "bg-primary"
          )}>
            <div className={cn(
              "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
              isDark ? "left-0.5" : "left-5"
            )} />
          </div>
        </button>

        <button
          data-testid="button-sign-out"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          {tx.nav.signOut}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-background/95 backdrop-blur-lg sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Dumbbell className="w-4 h-4 text-black" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">FitForge<span className="text-primary">.ai</span></span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <NotificationsBell />
          <button
            data-testid="button-mobile-menu"
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col w-72 bg-sidebar border-r border-sidebar-border sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 ease-in-out flex flex-col md:hidden",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto min-h-screen relative">
        <div className="max-w-2xl mx-auto p-4 md:p-8 lg:p-10 pb-24 md:pb-10">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border">
        <div className="flex items-center justify-around px-2 py-2 pb-safe">
          {BOTTOM_NAV.map((item) => {
            const isActive = location === item.href || (item.href === "/today" && location === "/");
            return (
              <Link key={item.href} href={item.href}>
                <div
                  data-testid={`bottom-nav-${item.label.toLowerCase()}`}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-5 py-2 rounded-2xl transition-all duration-200 cursor-pointer",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className={cn(
                    "relative p-1.5 rounded-xl transition-all duration-200",
                    isActive && "bg-primary/10"
                  )}>
                    <item.icon className={cn("w-5 h-5", isActive && "text-primary")} />
                    {item.href === "/challenges" && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-orange-400" />
                    )}
                  </div>
                  <span className={cn("text-[10px] font-semibold", isActive ? "text-primary" : "text-muted-foreground")}>
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Floating AI Coach Button */}
      {!["/today", "/workout/play", "/workout/generate"].some(p =>
        location.startsWith(p)
      ) && <FloatingAIButton />}
    </div>
  );
}
