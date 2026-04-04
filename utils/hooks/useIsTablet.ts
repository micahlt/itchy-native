import { useWindowDimensions } from "react-native";
import { TABLET_BREAKPOINT } from "../magicNumbers";

export function useIsTablet() {
  const { width } = useWindowDimensions();
  return width >= TABLET_BREAKPOINT;
}
