import { Platform, useWindowDimensions } from "react-native";
import SizeClass from "react-native-size-classes";
import { TABLET_BREAKPOINT } from "../magicNumbers";
import { useEffect, useState } from "react";

export function useIsTablet() {
  const [isTablet, setIsTablet] = useState(false);
  const { width } = useWindowDimensions();

  useEffect(() => {
    (async () => {
      if (Platform.OS === "ios") {
        const sizeClasses = await SizeClass.getSizeClasses();
        if (sizeClasses.horizontal == "compact") {
          setIsTablet(false);
        } else {
          setIsTablet(true);
        }
      } else {
        setIsTablet(width >= TABLET_BREAKPOINT);
      }
    })();
  }, [width]);

  return isTablet;
}
