import React from "react";
import ReactDOM from "react-dom/client";
import RouterProvider from "@/components/providers/router-provider";
import "./main.css";
import { ThemeProvider } from "./components/providers/theme-provider";
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <RouterProvider />
    </ThemeProvider>
  </React.StrictMode>,
);
