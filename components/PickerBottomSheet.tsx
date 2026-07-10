import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { View, useWindowDimensions } from "react-native";
import { useTheme } from "../utils/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TABLET_BREAKPOINT } from "utils/magicNumbers";
import {
  Host,
  ScrollView,
  TextInput,
  BottomSheet,
  Text,
  Row,
  List,
  ListItem,
  Column,
  FieldGroup,
} from "@expo/ui";

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
  height: "full" | "half";
  onClose: () => void;
}

export default function PickerBottomSheet({
  options,
  selectedValue,
  onValueChange,
  placeholder = "Select an option...",
  searchable = false,
  isOpen,
  height = "half",
  onClose,
}: PickerBottomSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOptions = useMemo(() => {
    if (!searchable || !searchQuery.trim()) {
      return options;
    }
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [options, searchQuery, searchable]);

  const handleSelect = useCallback(
    (value: string | number) => {
      onValueChange(value);
      setSearchQuery("");
      onClose();
    },
    [onValueChange, onClose],
  );

  const marginHorizontal = useMemo(
    () => (screenWidth > TABLET_BREAKPOINT ? (screenWidth - 600) / 2 : 0),
    [screenWidth],
  );

  console.log(filteredOptions);

  return (
    <Host>
      <BottomSheet
        isPresented={isOpen}
        showDragIndicator={true}
        onDismiss={() => {
          setSearchQuery("");
          onClose();
        }}
        snapPoints={["half", "full"]}
      >
        <ScrollView
          style={{
            paddingTop: 20,
          }}
        >
          <Text
            style={{
              paddingBottom: 0,
            }}
            textStyle={{
              fontFamily: "Inter",
              fontWeight: "700",
              fontSize: 20,
            }}
          >
            {placeholder}
          </Text>

          {searchable && (
            <TextInput
              placeholder="Search..."
              placeholderTextColor={colors.textSecondary}
              onChangeText={setSearchQuery}
              textStyle={{
                fontFamily: "Inter",
              }}
              style={{
                backgroundColor: colors.backgroundSecondary,
                padding: 12,
                borderRadius: 8,
              }}
            />
          )}
          {filteredOptions.map((option, index) => {
            const isSelected = option.value === selectedValue;
            const isFirst = index === 0;
            const isLast = index === filteredOptions.length - 1;

            return (
              <>
                <ListItem
                  key={option.value}
                  onPress={() => handleSelect(option.value)}
                  leading={<Column></Column>}
                >
                  {option.label}
                </ListItem>
              </>
            );
          })}
        </ScrollView>
      </BottomSheet>
    </Host>
  );
}
