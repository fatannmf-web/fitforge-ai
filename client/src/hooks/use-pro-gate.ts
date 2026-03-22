import { useCallback } from "react";
import { useLocation } from "wouter";
import { ProRequiredError } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook care interceptează erorile Pro și afișează un toast cu redirect la Pricing.
 * Folosește-l în orice componentă care apelează un endpoint Pro.
 *
 * Exemplu:
 *   const handleProError = useProGate();
 *   try { await apiRequest(...) } catch(e) { handleProError(e) }
 */
export function useProGate() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  return useCallback(
    (error: unknown) => {
      if (error instanceof ProRequiredError) {
        toast({
          title: "🔒 Funcție Pro",
          description: "Această funcție necesită abonament Pro. Upgrade pentru acces complet.",
          action: {
            altText: "Upgrade",
            onClick: () => setLocation("/pricing"),
          } as any,
          duration: 5000,
        });
        return true; // eroarea a fost gestionată
      }
      return false; // altă eroare, lasă componenta să o gestioneze
    },
    [toast, setLocation],
  );
}
