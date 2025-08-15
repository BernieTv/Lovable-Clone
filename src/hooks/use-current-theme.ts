import { useTheme } from "next-themes";

const useCurrentTheme = () => {
  const {theme, systemTheme} = useTheme();

  if (theme === "dark" || theme === "light") {
    return theme;
  }

  return systemTheme;
};

export { useCurrentTheme };
