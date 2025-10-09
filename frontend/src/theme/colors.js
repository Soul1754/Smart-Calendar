// Modern Dark Theme Color Palette
export const colors = {
  // Primary dark backgrounds
  dark: {
    900: "#0a0e27", // Deepest background
    800: "#10162f", // Secondary background
    700: "#1a2038", // Card background
    600: "#242b43", // Elevated elements
    500: "#2d3548", // Borders
  },

  // Accent colors
  primary: {
    500: "#6366f1", // Indigo
    600: "#4f46e5",
    700: "#4338ca",
    glow: "rgba(99, 102, 241, 0.5)",
  },

  secondary: {
    500: "#8b5cf6", // Purple
    600: "#7c3aed",
    glow: "rgba(139, 92, 246, 0.5)",
  },

  accent: {
    cyan: "#06b6d4",
    cyanGlow: "rgba(6, 182, 212, 0.5)",
    pink: "#ec4899",
    pinkGlow: "rgba(236, 72, 153, 0.5)",
  },

  // Text colors
  text: {
    primary: "#f1f5f9",
    secondary: "#cbd5e1",
    tertiary: "#94a3b8",
    muted: "#64748b",
  },

  // Event colors
  events: {
    blue: { bg: "#3b82f6", text: "#eff6ff" },
    purple: { bg: "#8b5cf6", text: "#f5f3ff" },
    pink: { bg: "#ec4899", text: "#fdf2f8" },
    orange: { bg: "#f97316", text: "#fff7ed" },
    green: { bg: "#10b981", text: "#f0fdf4" },
    cyan: { bg: "#06b6d4", text: "#ecfeff" },
  },

  // Status colors
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
};

export const gradients = {
  primary: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
  secondary: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
  accent: "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
  dark: "linear-gradient(135deg, #0a0e27 0%, #1a2038 100%)",
};

export const shadows = {
  sm: "0 2px 8px rgba(0, 0, 0, 0.3)",
  md: "0 4px 16px rgba(0, 0, 0, 0.4)",
  lg: "0 8px 32px rgba(0, 0, 0, 0.5)",
  glow: {
    primary: `0 0 20px ${colors.primary.glow}`,
    secondary: `0 0 20px ${colors.secondary.glow}`,
    cyan: `0 0 20px ${colors.accent.cyanGlow}`,
  },
};

// Default export
export default {
  colors,
  gradients,
  shadows,
};
