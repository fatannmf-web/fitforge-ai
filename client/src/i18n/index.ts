import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { resources } from "./locales";

const savedLang = localStorage.getItem("fitforge_lang") || "ro";

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLang,
    fallbackLng: "ro",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
