import { Platform, useWindowDimensions } from "react-native";
import { useSizeClass } from "react-native-size-class";
import { TABLET_BREAKPOINT } from "../magicNumbers";
import { useEffect, useState } from "react";

export function useIsTablet() {
  const [isTablet, setIsTablet] = useState(false);
  const { width } = useWindowDimensions();
  const { horizontal } = useSizeClass();

  useEffect(() => {
    (async () => {
      if (Platform.OS === "ios") {
        if (horizontal === "regular") {
          setIsTablet(true);
        } else {
          setIsTablet(false);
        }
      } else {
        setIsTablet(width >= TABLET_BREAKPOINT);
      }
    })();
  }, [width]);

  return isTablet;
}
