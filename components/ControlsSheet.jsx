import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useRef } from "react";
import { useWindowDimensions } from "react-native";
import { useTheme } from "../utils/theme";
import Controls from "./Controls";
import { getLiquidPlusPadding } from "../utils/platformUtils";

export default function ControlsSheet({
  onControlPress = () => {},
  onClose = () => {},
  opened = false,
  height: passedHeight = 300,
  projectId = 0,
}) {
  const sheetRef = useRef(null);
  const { colors } = useTheme();
  const { width } = useWindowDimensions();

  return (
    <BottomSheet
      onClose={onClose}
      ref={sheetRef}
      index={opened ? 0 : -1}
      enablePanDownToClose={true}
      enableDynamicSizing={false}
      snapPoints={[passedHeight, width * 1.1]}
      enableOverDrag={true}
      enableContentPanningGesture={false}
      enableHandlePanningGesture={true}
      backgroundStyle={{ backgroundColor: colors.backgroundTertiary }}
      style={{
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        overflow: "hidden",
        shadowColor: "#000",
      }}
    >
      <BottomSheetView
        style={{
          backgroundColor: colors.backgroundTertiary,
          height: "100%",
          paddingTop: getLiquidPlusPadding(),
        }}
      >
        <Controls
          onControlPress={onControlPress}
          projectId={projectId}
          showConfiguration={true}
          style={{ height: "100%" }}
        />
      </BottomSheetView>
    </BottomSheet>
  );
}
