import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useIsTablet } from "./useIsTablet";
import { useMemo } from "react";
import { Platform } from "react-native";
import { isiOS18Plus, isiOSLiquidPlus } from "utils/platformUtils";
import { IPADOS_TOP_TABS_OFFSET } from "utils/magicNumbers";

export default function useiPadOSTopMargin() {
  const insets = useSafeAreaInsets();
  const isTablet = useIsTablet();
  const iPadOSTopMargin = useMemo(() => {
    if (Platform.OS === "ios" && isTablet && isiOS18Plus()) {
      if (isiOSLiquidPlus()) {
        return insets.top + IPADOS_TOP_TABS_OFFSET;
      } else {
        return insets.top + IPADOS_TOP_TABS_OFFSET + 5;
      }
    } else {
      return 0;
    }
  }, [insets, isTablet, Platform]);

  return iPadOSTopMargin;
}
