import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AtelierPage } from "./AtelierPage";
import { marbleDataUrl } from "../demo/marble";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "@fontsource/ibm-plex-sans/latin-400.css";
import "@fontsource/ibm-plex-sans/latin-600-italic.css";
import "../styles.css";
import "./atelier.css";
document.documentElement.style.setProperty("--marble", `url(${marbleDataUrl()})`);
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AtelierPage />
  </StrictMode>,
);
