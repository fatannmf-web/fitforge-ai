import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui";

export default function NotFound() {
  const [location] = useLocation();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = "/";
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 text-center">
      <div>
        <h1 className="text-8xl font-display font-black text-primary mb-4">404</h1>
        <h2 className="text-2xl font-bold mb-4">Pagină inexistentă</h2>
        <p className="text-muted-foreground mb-2">
          Ruta <code className="bg-muted px-1 rounded text-sm">{location}</code> nu există.
        </p>
        <p className="text-muted-foreground mb-8">
          Redirecționare automată în <strong>{countdown}</strong> secunde...
        </p>
        <Link href="/">
          <Button size="lg" data-testid="button-go-home">Mergi acasă acum</Button>
        </Link>
      </div>
    </div>
  );
}
