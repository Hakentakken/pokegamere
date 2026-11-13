import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { initTheme } from "./lib/theme";
import { BrowserRouter } from "react-router-dom";
import { CatalogueContext, type PublicHack } from "./lib/catalogue";

// 🌙 Apply the saved theme before the first paint so a refresh never flashes
// the wrong palette. Dark is the default and the site's signature look.
initTheme();

const initial = document.getElementById('pokesmith-data');
const catalogue: PublicHack[] | null = initial ? JSON.parse(initial.textContent || 'null') : null;
const app = (
  <React.StrictMode>
    <CatalogueContext.Provider value={catalogue}>
      <BrowserRouter><App /></BrowserRouter>
    </CatalogueContext.Provider>
  </React.StrictMode>
);
const root = document.getElementById('root')!;
if (root.hasChildNodes()) ReactDOM.hydrateRoot(root, app);
else ReactDOM.createRoot(root).render(app);
