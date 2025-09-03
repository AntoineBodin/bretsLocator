import React from "react";
import { fontStack, colors, radii, transitions, panelStyle } from "./styleTokens";
import "../styles/main.scss";

export default function ControlsPanel({ children }) {
  return (
    <div className="controls-panel">
      <div className="controls-panel__group">
        {children}
      </div>
    </div>
  );
}