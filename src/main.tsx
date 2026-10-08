import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SiteModes } from "./SiteModes";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "@fontsource/ibm-plex-mono/latin-600.css";
import "@fontsource/ibm-plex-sans/latin-400.css";
import "@fontsource/ibm-plex-sans/latin-500.css";
import "@fontsource/ibm-plex-sans/latin-600-italic.css";
import "./styles.css";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SiteModes />
  </StrictMode>,
);
