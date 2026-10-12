import { Languages } from "lucide-react";
import { LANGS, setLang, t, useLang } from "../i18n";

/**
 * FR / EN switch of the headers : it names the other language in that
 * language (« English version », « Version française »).
 */
export function LanguageSwitch({ className }: { className?: string }) {
  const lang = useLang();
  const other = LANGS.find((code) => code !== lang) ?? "fr";
  return (
    <button
      type="button"
      className={className ? `${className} lang-switch` : "lang-switch"}
      lang={other}
      aria-label={t("lang.other.label")}
      title={t("lang.other.label")}
      onClick={() => setLang(other)}
    >
      <Languages size={14} /> <span translate="no">{t("lang.other.code")}</span>
    </button>
  );
}
