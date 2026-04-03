import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import { AuthProvider } from "./context/AuthProvider";
import { ThemeProvider } from "./context/ThemeContext";
import { SidebarProvider } from "./context/SidebarContext";
import { EstacaoProvider } from "./context/EstacaoContext";

import "./styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <EstacaoProvider>
          <SidebarProvider>
            <ThemeProvider>
              <App />
            </ThemeProvider>
          </SidebarProvider>
        </EstacaoProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
