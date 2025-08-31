export const fontStack = "-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',Roboto,'SF Pro Display',system-ui,sans-serif";

export const colors = {
  bgApp: "#f5f7fa",
  bgPanel: "#ffffff",
  bgSubtle: "#f0f3f7",
  border: "rgba(20,32,50,0.12)",
  borderStrong: "rgba(20,32,50,0.18)",
  text: "#1d2734",
  textSoft: "#5a6675",
  accent: "#2563eb",
  accentSoft: "#e3efff",
  success: "#2f9e44",
  successBg: "#e6f8ed",
  danger: "#e03131",
  dangerBg: "#ffe9e9",
  warn: "#f59f00",
  warnBg: "#fff4d6",
  neutralChip: "#eef0f3",
  focus: "#3b82f6"
};

export const radii = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14
};

export const shadows = {
  panel: "0 4px 18px -2px rgba(15,23,42,0.10), 0 2px 4px rgba(15,23,42,0.06)",
  soft: "0 2px 8px rgba(15,23,42,0.08)"
};

export const transitions = {
  base: "150ms cubic-bezier(.4,0,.2,1)"
};

export const panelStyle = {
  background: colors.bgPanel,
  border: `1px solid ${colors.border}`,
  borderRadius: radii.lg,
  boxShadow: shadows.panel,
  overflow: "hidden",
  position: "relative"
};

export const softTextStyle = {
  fontSize: 13,
  lineHeight: "18px",
  color: colors.textSoft,
  fontWeight: 400
};

export const badgeStyles = {
  base: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: ".5px",
    padding: "2px 8px 3px",
    borderRadius: 999,
    display: "inline-flex",
    alignItems: "center",
    gap: 4
  },
  success: { background: colors.successBg, color: colors.success },
  danger: { background: colors.dangerBg, color: colors.danger },
  warn: { background: colors.warnBg, color: colors.warn },
  neutral: { background: colors.neutralChip, color: colors.textSoft }
};