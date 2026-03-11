import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { initAudio } from "@/store/useAudio";

initAudio();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
