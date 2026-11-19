import "@fontsource-variable/fraunces/opsz.css";
import "@fontsource-variable/fraunces/opsz-italic.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/app.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  // Register as early as possible: the worker precaches the shell on install, so
  // the first offline revisit works instead of waiting for a later load event.
  navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => null);
}
