import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/LandingPage";
import { SplashScreen } from "@/components/SplashScreen";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppLayout } from "@/components/Layout";
import { LanguageSelectModal } from "@/components/LanguageSelectModal";
import { useAuth } from "@/hooks/use-auth";
import type { UserProfile } from "@shared/schema";

import TermsPage from "@/pages/TermsPage";
import PrivacyPage from "@/pages/PrivacyPage";
import RefundPage from "@/pages/RefundPage";
import DashboardPage from "@/pages/DashboardPage"; // păstrat pentru backward compat
import WorkoutsPage from "@/pages/WorkoutsPage";
import NutritionPage from "@/pages/NutritionPage";
import AiCoachPage from "@/pages/AiCoachPage";
import ProfilePage from "@/pages/ProfilePage";
import ProgressPage from "@/pages/ProgressPage";
import AchievementsPage from "@/pages/AchievementsPage";
import BodyScanPage from "@/pages/BodyScanPage";
import TransformationReportPage from "@/pages/TransformationReportPage";
import TransformationRevealPage from "@/pages/TransformationRevealPage";
import OnboardingPage from "@/pages/OnboardingPage";
import PricingPage from "@/pages/PricingPage";
import ExercisesPage from "@/pages/ExercisesPage";
import TodayPlanPage from "@/pages/TodayPlanPage";
import WorkoutPlayerPage from "@/pages/WorkoutPlayerPage";
import CommunityPage from "@/pages/CommunityPage";
import LeaderboardPage from "@/pages/LeaderboardPage";
import ChallengesPage from "@/pages/ChallengesPage";
import MarketplacePage from "@/pages/MarketplacePage";
import TrainersPage from "@/pages/TrainersPage";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, isLoading } = useAuth();
  const [location, navigate] = useLocation();
  const [langSelected, setLangSelected] = useState(() => !!localStorage.getItem("fitforge_lang"));

  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated && !profileLoading && profile && !profile.onboardingCompleted && location !== "/onboarding") {
      navigate("/onboarding", { replace: true });
    }
  }, [isAuthenticated, profileLoading, profile, location, navigate]);

  if (isLoading || (isAuthenticated && profileLoading)) return <SplashScreen />;
  if (!isAuthenticated) return <SplashScreen />;
  if (profile && !profile.onboardingCompleted) return <SplashScreen />;

  if (!langSelected) {
    return <LanguageSelectModal onSelect={() => setLangSelected(true)} />;
  }

  return <AppLayout><Component {...rest} /></AppLayout>;
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <SplashScreen />;

  return (
    <Switch>
      {/* Public */}
      <Route path="/">
        {isAuthenticated ? <AppLayout><TodayPlanPage /></AppLayout> : <LandingPage />}
      </Route>
      <Route path="/onboarding">
        {isAuthenticated ? <OnboardingPage /> : <LandingPage />}
      </Route>
      <Route path="/pricing">
        <AppLayout><PricingPage /></AppLayout>
      </Route>

      {/* Core pages */}
      <Route path="/today"><ProtectedRoute component={TodayPlanPage} /></Route>
      <Route path="/dashboard">{() => { window.location.replace("/today"); return null; }}</Route>
      <Route path="/workouts"><ProtectedRoute component={WorkoutsPage} /></Route>
      <Route path="/workout/play"><ProtectedRoute component={WorkoutPlayerPage} /></Route>
      <Route path="/nutrition"><ProtectedRoute component={NutritionPage} /></Route>
      <Route path="/progress"><ProtectedRoute component={ProgressPage} /></Route>
      <Route path="/ai-coach"><ProtectedRoute component={AiCoachPage} /></Route>
      <Route path="/exercises"><ProtectedRoute component={ExercisesPage} /></Route>

      {/* Social */}
      <Route path="/community"><ProtectedRoute component={CommunityPage} /></Route>
      <Route path="/leaderboard"><ProtectedRoute component={LeaderboardPage} /></Route>
      <Route path="/challenges"><ProtectedRoute component={ChallengesPage} /></Route>
      <Route path="/achievements"><ProtectedRoute component={AchievementsPage} /></Route>

      {/* AI Features Pro */}
      <Route path="/body-scan"><ProtectedRoute component={BodyScanPage} /></Route>
      <Route path="/transformation"><ProtectedRoute component={TransformationRevealPage} /></Route>
      <Route path="/transformation-report"><ProtectedRoute component={TransformationReportPage} /></Route>
      <Route path="/trainers">{() => { window.location.replace("/ai-coach"); return null; }}</Route>
      <Route path="/marketplace"><ProtectedRoute component={MarketplacePage} /></Route>

      {/* Profile */}
      <Route path="/profile"><ProtectedRoute component={ProfilePage} /></Route>

      {/* 404 */}
      {/* Legal */}
      <Route path="/terms"><TermsPage /></Route>
      <Route path="/privacy"><PrivacyPage /></Route>
      <Route path="/refund"><RefundPage /></Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
