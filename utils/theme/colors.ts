export const lightColors: ItchyThemeColors = {
  background: "#FAF8F6",
  highlight: "#ffffff",
  topLight: "#FFFFFFAA",
  chipColor: "#5a5a5a",
  outline: "rgba(48, 48, 48, 0.15)",
  outlineCard: "rgba(48, 48, 48, 0.07)",
  outlineFill: "rgba(54, 105, 154, 0.7)",
  backgroundSecondary: "#efedeb",
  backgroundTertiary: "#dddddd",
  text: "black",
  textSecondary: "#2b2b2b",
  accent: "#0082FF",
  accentOverlay: "rgba(0,0,0,0.1)",
  accentTransparent: "rgba(59, 160, 255, 0.158)",
  button: "black",
  buttonText: "#e68a00",
  ripple: "rgba(199, 199, 199, 0.2)",
  shadow: {
    shadowColor: "black",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowRadius: 5,
    shadowOpacity: 1,
  },
};

// Dark theme colors
export const darkColors: ItchyThemeColors = {
  background: "#000000",
  highlight: "#1d1d1d",
  topLight: "#FFFFFF11",
  outline: "rgba(255, 255, 255, 0.15)",
  outlineCard: "rgba(48, 48, 48, 0.07)",
  outlineFill: "rgba(54, 105, 154, 0.7)",
  backgroundSecondary: "#1e1e1e",
  backgroundTertiary: "#363636",
  chipColor: "#888888",
  text: "#FFFFFF",
  textSecondary: "#bbbbbb",
  accent: "#3ba0ff",
  accentOverlay: "rgba(0,0,0,0.1)",
  accentTransparent: "rgba(59, 160, 255, 0.158)",
  button: "orange",
  buttonText: "black",
  ripple: "rgba(255, 255, 255, 0.2)",
  shadow: {
    shadowColor: "black",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowRadius: 5,
    shadowOpacity: 1,
  },
};

export type ItchyThemeColors = {
  background: string;
  highlight: string;
  topLight: string;
  outline: string;
  outlineCard: string;
  outlineFill: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  chipColor: string;
  text: string;
  textSecondary: string;
  accent: string;
  accentOverlay: string;
  accentTransparent: string;
  button: string;
  buttonText: string;
  ripple: string;
  shadow: {
    shadowColor: string;
    shadowOffset: {
      width: number;
      height: number;
    };
    shadowRadius: number;
    shadowOpacity: number;
  };
};
