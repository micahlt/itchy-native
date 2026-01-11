import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  TextInput,
  ScrollView,
  TouchableWithoutFeedback,
  useWindowDimensions,
} from "react-native";
import ItchyText from "./ItchyText";
import { useTheme } from "../utils/theme";
// @ts-expect-error
import Pressable from "./Pressable";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { getLiquidPlusPadding } from "../utils/platformUtils";

interface PickerOption {
  label: string;
  value: string | number;
}

interface PickerBottomSheetProps {
  options: PickerOption[];
  selectedValue: string | number | undefined;
  onValueChange: (value: string | number) => void;
  placeholder?: string;
  searchable?: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export default function PickerBottomSheet({
  options,
  selectedValue,
  onValueChange,
  placeholder = "Select an option...",
  searchable = false,
  isOpen,
  onClose,
}: PickerBottomSheetProps) {
  const { colors } = useTheme();
  const sheetRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    console.log("PickerBottomSheet isOpen changed:", isOpen);
    console.log("Options count:", options.length);
    if (isOpen) {
      console.log("Presenting bottom sheet modal");
      sheetRef.current?.present();
    } else {
      console.log("Dismissing bottom sheet modal");
      sheetRef.current?.dismiss();
    }
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    if (!searchable || !searchQuery.trim()) {
      return options;
    }
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery, searchable]);

  const handleSelect = useCallback(
    (value: string | number) => {
      onValueChange(value);
      setSearchQuery("");
      onClose();
    },
    [onValueChange, onClose]
  );

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.6}
      />
    ),
    []
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      enablePanDownToClose={true}
      onDismiss={() => {
        setSearchQuery("");
        onClose();
      }}
      backgroundStyle={{ backgroundColor: colors.backgroundSecondary }}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: colors.textSecondary }}
      enableDynamicSizing={true}
      maxDynamicContentSize={height / 1.5}
    >
      <BottomSheetScrollView
        style={{
          flex: 1,
          paddingTop: getLiquidPlusPadding(0, 0),
          backgroundColor: colors.backgroundSecondary,
        }}
      >
        <ItchyText
          style={{
            color: colors.text,
            fontSize: 22,
            fontWeight: "bold",
            marginBottom: 15,
            paddingHorizontal: 20,
          }}
        >
          {placeholder}
        </ItchyText>

        {searchable && (
          <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
            <TextInput
              placeholder="Search..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{
                backgroundColor: colors.backgroundTertiary,
                color: colors.text,
                padding: 12,
                borderRadius: 8,
                fontSize: 16,
                fontFamily: "Inter_400Regular",
              }}
            />
          </View>
        )}

        {filteredOptions.map((option, index) => {
          const isSelected = option.value === selectedValue;
          const isFirst = index === 0;
          const isLast = index === filteredOptions.length - 1;

          return (
            <Pressable
              key={option.value}
              onPress={() => handleSelect(option.value)}
              style={{
                backgroundColor: isSelected
                  ? colors.accent + "22"
                  : colors.backgroundSecondary,
                paddingVertical: 16,
                paddingHorizontal: 20,
                borderBottomWidth: isLast ? 0 : 0.5,
                marginBottom: isLast ? insets.bottom : 0,
                borderBottomColor: colors.backgroundTertiary,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <ItchyText
                style={{
                  color: isSelected ? colors.accent : colors.text,
                  fontSize: 16,
                  fontWeight: isSelected ? "bold" : "normal",
                }}
              >
                {option.label}
              </ItchyText>
              {isSelected && (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: colors.accent,
                  }}
                />
              )}
            </Pressable>
          );
        })}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}
