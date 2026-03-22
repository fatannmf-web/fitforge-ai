import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n/index";

// Aplică tema salvată înainte de render — previne flash of wrong theme
const savedTheme = localStorage.getItem("fitforge_theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const theme = savedTheme || (prefersDark ? "dark" : "light");
if (theme === "light") {
  document.documentElement.classList.add("light");
} else {
  document.documentElement.classList.remove("light");
}

const boot = document.getElementById("ff-boot");
if (boot) boot.style.display = "none";

createRoot(document.getElementById("root")!).render(<App />);

// Înregistrare Service Worker pentru PWA (iPhone + Android)
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        console.log("[SW] Înregistrat:", reg.scope);
        setInterval(() => reg.update(), 30 * 60 * 1000);
      })
      .catch((err) => console.warn("[SW] Înregistrare eșuată:", err));
  });
}
