import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/inria-serif/300.css";
import "@fontsource/inria-serif/400.css";
import "@fontsource/inria-serif/700.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/irish-grover/400.css";

import { App } from "./app/App";
import "./styles/index.css";

const rootElement = document.getElementById("root");

if (rootElement === null) {
  throw new Error("Application root element was not found.");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
