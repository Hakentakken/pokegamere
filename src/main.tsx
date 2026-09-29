import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { initTheme } from "./lib/theme";

// 🌙 Apply the saved theme before the first paint so a refresh never flashes
// the wrong palette. Dark is the default and the site's signature look.
initTheme();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);