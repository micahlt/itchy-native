import { useWindowDimensions } from "react-native";
import { TABLET_BREAKPOINT } from "../breakpoints";

export function useIsTablet() {
  const { width } = useWindowDimensions();
  return width >= TABLET_BREAKPOINT;
}
