import { router, Stack, useLocalSearchParams } from "expo-router";
import { ScrollView, useWindowDimensions, View } from "react-native";
import ItchyText from "../../../../components/ItchyText";
import { StyleSheet } from "react-native";
import { useTheme } from "../../../../utils/theme";
import APIProject from "../../../../utils/api-wrapper/project";
import { useMMKVObject, useMMKVString } from "react-native-mmkv";
import { useEffect, useMemo, useState } from "react";
import getControlOptions from "../../../../utils/controlOptions";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { getLiquidPlusPadding } from "../../../../utils/platformUtils";
import PickerBottomSheet from "../../../../components/PickerBottomSheet";
// @ts-expect-error
import Pressable from "../../../../components/Pressable";
import PressableIcon from "components/PressableIcon";

interface ControlMapping {
  controlOptions: {
    showPrimaryController?: boolean;
    showSecondaryController?: boolean;
    primaryController: string;
    secondaryController: string;
    extrasCount?: number;
  };
  controls: {
    primary: {
      up: string;
      down: string;
      left: string;
      right: string;
    };
    secondary: {
      up: string;
      down: string;
      left: string;
      right: string;
    };
    extra: string[];
  };
  username?: string;
}

interface Project {
  title: string;
  author?: {
    username: string;
  };
  [key: string]: any;
}

export default function ControlsScreen() {
  const params = useLocalSearchParams();
  const id =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
      ? params.id[0]
      : undefined;
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [project, setProject] = useState<Project>();
  const [currentMapping, setCurrentMapping] =
    useMMKVObject<ControlMapping>("currentMapping");
  const [activePicker, setActivePicker] = useState<string | null>(null);
  const [controls, setControls] = useState<ControlMapping>(
    currentMapping || {
      controlOptions: {
        showPrimaryController: true,
        showSecondaryController: true,
        primaryController: "joystick",
        secondaryController: "buttonpad",
      },
      controls: {
        primary: {
          up: "W",
          down: "S",
          left: "A",
          right: "D",
        },
        secondary: {
          up: "E",
          down: " ",
          left: "Q",
          right: "E",
        },
        extra: [],
      },
    }
  );
  const { width } = useWindowDimensions();
  const [token] = useMMKVString("token");
  const [username] = useMMKVString("username");
  const [localControllerMappings, setLocalControllerMappings] = useMMKVObject<
    Record<string, string>
  >("localControllerMappings");

  const controlOptions = useMemo(() => getControlOptions(), []);

  const applyPreset = (
    controlType: "primary" | "secondary",
    preset: string
  ) => {
    const presets: Record<
      string,
      { up: string; down: string; left: string; right: string }
    > = {
      wasd: { up: "W", down: "S", left: "A", right: "D" },
      arrows: {
        up: "ArrowUp",
        down: "ArrowDown",
        left: "ArrowLeft",
        right: "ArrowRight",
      },
      ijkl: { up: "I", down: "K", left: "J", right: "L" },
    };

    if (preset === "custom" || !presets[preset]) return; // Don't change anything for custom option or invalid preset

    setControls((prev) => ({
      ...prev,
      controls: {
        ...prev.controls,
        [controlType]: {
          ...prev.controls[controlType],
          ...presets[preset],
        },
      },
    }));
  };

  const getSelectedPreset = (controlType: "primary" | "secondary") => {
    const current = controls?.controls?.[controlType];
    if (!current) return "custom";

    // Check WASD preset
    if (
      current.up === "W" &&
      current.down === "S" &&
      current.left === "A" &&
      current.right === "D"
    ) {
      return "wasd";
    }
    // Check Arrow keys preset
    if (
      current.up === "ArrowUp" &&
      current.down === "ArrowDown" &&
      current.left === "ArrowLeft" &&
      current.right === "ArrowRight"
    ) {
      return "arrows";
    }
    // Check IJKL preset
    if (
      current.up === "I" &&
      current.down === "K" &&
      current.left === "J" &&
      current.right === "L"
    ) {
      return "ijkl";
    }
    return "custom";
  };

  // Picker configuration
  const pickerConfig = useMemo(() => {
    const baseControlOptions = [
      { label: "Joystick", value: "joystick" },
      { label: "D-Pad", value: "dpad" },
      { label: "Button Pad", value: "buttonpad" },
      { label: "None", value: "none" },
    ];

    const presetOptions = [
      { label: "Custom", value: "custom" },
      { label: "WASD", value: "wasd" },
      { label: "Arrow Keys", value: "arrows" },
      { label: "IJKL", value: "ijkl" },
    ];

    const extrasCountOptions = [
      { label: "None", value: 0 },
      { label: "1", value: 1 },
      { label: "2", value: 2 },
      { label: "3", value: 3 },
      { label: "4", value: 4 },
      { label: "5", value: 5 },
    ];

    const configs: Record<
      string,
      {
        options: { label: string; value: string | number }[];
        searchable: boolean;
        placeholder: string;
        currentValue: string | number | undefined;
        onSelect: (value: string | number) => void;
      }
    > = {
      primaryController: {
        options: baseControlOptions,
        searchable: false,
        placeholder: "Select Left Control",
        currentValue: controls?.controlOptions?.primaryController || "joystick",
        onSelect: (value) =>
          setControls((prev) => ({
            ...prev,
            controlOptions: {
              ...prev.controlOptions,
              primaryController: value as string,
            },
          })),
      },
      secondaryController: {
        options: baseControlOptions,
        searchable: false,
        placeholder: "Select Right Control",
        currentValue:
          controls?.controlOptions?.secondaryController || "buttonpad",
        onSelect: (value) =>
          setControls((prev) => ({
            ...prev,
            controlOptions: {
              ...prev.controlOptions,
              secondaryController: value as string,
            },
          })),
      },
      extrasCount: {
        options: extrasCountOptions,
        searchable: false,
        placeholder: "Select Extra Controls Count",
        currentValue: controls?.controlOptions?.extrasCount || 0,
        onSelect: (value) =>
          setControls((prev) => ({
            ...prev,
            controlOptions: {
              ...prev.controlOptions,
              extrasCount: value as number,
            },
            controls: {
              ...prev.controls,
              extra: Array.from(
                { length: value as number },
                (_, i) => prev.controls.extra[i] || "0"
              ),
            },
          })),
      },
      primaryPreset: {
        options: presetOptions,
        searchable: false,
        placeholder: "Select Left Preset",
        currentValue: getSelectedPreset("primary"),
        onSelect: (value) => applyPreset("primary", value as string),
      },
      secondaryPreset: {
        options: presetOptions,
        searchable: false,
        placeholder: "Select Right Preset",
        currentValue: getSelectedPreset("secondary"),
        onSelect: (value) => applyPreset("secondary", value as string),
      },
      primaryUp: {
        options: controlOptions,
        searchable: true,
        placeholder: "Select Primary Up Key",
        currentValue: controls?.controls?.primary?.up || "0",
        onSelect: (value) =>
          setControls((prev) => ({
            ...prev,
            controls: {
              ...prev.controls,
              primary: { ...prev.controls.primary, up: value as string },
            },
          })),
      },
      primaryDown: {
        options: controlOptions,
        searchable: true,
        placeholder: "Select Primary Down Key",
        currentValue: controls?.controls?.primary?.down || "0",
        onSelect: (value) =>
          setControls((prev) => ({
            ...prev,
            controls: {
              ...prev.controls,
              primary: { ...prev.controls.primary, down: value as string },
            },
          })),
      },
      primaryLeft: {
        options: controlOptions,
        searchable: true,
        placeholder: "Select Primary Left Key",
        currentValue: controls?.controls?.primary?.left || "0",
        onSelect: (value) =>
          setControls((prev) => ({
            ...prev,
            controls: {
              ...prev.controls,
              primary: { ...prev.controls.primary, left: value as string },
            },
          })),
      },
      primaryRight: {
        options: controlOptions,
        searchable: true,
        placeholder: "Select Primary Right Key",
        currentValue: controls?.controls?.primary?.right || "0",
        onSelect: (value) =>
          setControls((prev) => ({
            ...prev,
            controls: {
              ...prev.controls,
              primary: { ...prev.controls.primary, right: value as string },
            },
          })),
      },
      secondaryUp: {
        options: controlOptions,
        searchable: true,
        placeholder: "Select Secondary Up Key",
        currentValue: controls?.controls?.secondary?.up || "0",
        onSelect: (value) =>
          setControls((prev) => ({
            ...prev,
            controls: {
              ...prev.controls,
              secondary: { ...prev.controls.secondary, up: value as string },
            },
          })),
      },
      secondaryDown: {
        options: controlOptions,
        searchable: true,
        placeholder: "Select Secondary Down Key",
        currentValue: controls?.controls?.secondary?.down || "0",
        onSelect: (value) =>
          setControls((prev) => ({
            ...prev,
            controls: {
              ...prev.controls,
              secondary: { ...prev.controls.secondary, down: value as string },
            },
          })),
      },
      secondaryLeft: {
        options: controlOptions,
        searchable: true,
        placeholder: "Select Secondary Left Key",
        currentValue: controls?.controls?.secondary?.left || "0",
        onSelect: (value) =>
          setControls((prev) => ({
            ...prev,
            controls: {
              ...prev.controls,
              secondary: { ...prev.controls.secondary, left: value as string },
            },
          })),
      },
      secondaryRight: {
        options: controlOptions,
        searchable: true,
        placeholder: "Select Secondary Right Key",
        currentValue: controls?.controls?.secondary?.right || "0",
        onSelect: (value) =>
          setControls((prev) => ({
            ...prev,
            controls: {
              ...prev.controls,
              secondary: { ...prev.controls.secondary, right: value as string },
            },
          })),
      },
    };

    // Add extra control pickers dynamically
    for (let i = 0; i < 5; i++) {
      configs[`extra${i}`] = {
        options: controlOptions,
        searchable: true,
        placeholder: `Select Extra ${i + 1} Key`,
        currentValue: controls?.controls?.extra?.[i] || "0",
        onSelect: (value) =>
          setControls((prev) => {
            const newExtras = [...(prev.controls.extra || [])];
            newExtras[i] = value as string;
            return {
              ...prev,
              controls: { ...prev.controls, extra: newExtras },
            };
          }),
      };
    }

    return configs;
  }, [controls, controlOptions]);

  const activePickerConfig = activePicker ? pickerConfig[activePicker] : null;

  useEffect(() => {
    if (id) {
      console.log("Loading project with ID:", id);
      APIProject.getProject(id)
        .then((project) => {
          console.log("Project loaded:", project);
          setProject(project);
        })
        .catch((error) => {
          console.error("Failed to load project:", error);
        });
    } else {
      console.log("No project ID available");
    }
  }, [id]);

  const s = useMemo(
    () =>
      StyleSheet.create({
        sectionHeader: {
          color: colors.textSecondary,
          fontSize: 12,
          paddingVertical: 10,
          paddingHorizontal: 20,
          marginTop: 10,
        },
        settingContainer: {
          backgroundColor: colors.backgroundSecondary,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          borderColor: colors.backgroundTertiary,
          borderBottomWidth: 0.5,
          height: 50,
          marginHorizontal: 15,
          paddingHorizontal: 20,
          paddingRight: 8,
        },
        topSettingContainer: {
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
        },
        bottomSettingContainer: {
          borderBottomLeftRadius: 10,
          borderBottomRightRadius: 10,
          borderBottomWidth: 0,
        },
        settingTitle: {
          color: colors.text,
          fontSize: 16,
        },
      }),
    [isDark]
  );

  const handleSave = () => {
    if (!id || !username || !token) return;

    fetch(
      `https://itchy-controldb.vercel.app/api/controllermapping?projectId=${id}&username=${username}`,
      {
        method: "PUT",
        headers: {
          "X-Token": token,
        },
        body: JSON.stringify({
          controlOptions: controls.controlOptions,
          controls: controls.controls,
        }),
      }
    )
      .then((response) => response.json())
      .then((data) => {
        if (!data.error && id) {
          setLocalControllerMappings((prev) => ({
            ...prev,
            [id]: data.id,
          }));
          setCurrentMapping({
            controlOptions: controls.controlOptions,
            controls: controls.controls,
            username: username,
          });
          router.dismissTo(`/projects/${id}/controls/find`);
          return;
        } else {
          console.log(data);
        }
      });
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <PressableIcon
              name="save"
              onPress={handleSave}
              size={24}
              color={colors.text}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 0,
              }}
            />
          ),
        }}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: getLiquidPlusPadding(),
          paddingBottom: insets.bottom * 4,
        }}
      >
        {!project ? (
          <View style={{ padding: 20, alignItems: "center" }}>
            <ItchyText style={{ color: colors.text }}>
              Loading project...
            </ItchyText>
          </View>
        ) : (
          <>
            <ItchyText style={s.sectionHeader}>Preferences</ItchyText>
            <View style={{ ...s.settingContainer, ...s.topSettingContainer }}>
              <ItchyText style={s.settingTitle}>
                <ItchyText style={{ color: colors.accent, fontWeight: "bold" }}>
                  {project.title}
                </ItchyText>{" "}
                by {project.author?.username}
              </ItchyText>
            </View>
            <Pressable
              style={{ ...s.settingContainer }}
              onPress={() => {
                console.log("Setting activePicker to primaryController");
                setActivePicker("primaryController");
              }}
            >
              <ItchyText style={s.settingTitle}>Left Control</ItchyText>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <ItchyText
                  style={{ color: colors.textSecondary, fontSize: 16 }}
                >
                  {controls?.controlOptions?.primaryController === "joystick" &&
                    "Joystick"}
                  {controls?.controlOptions?.primaryController === "dpad" &&
                    "D-Pad"}
                  {controls?.controlOptions?.primaryController ===
                    "buttonpad" && "Button Pad"}
                  {controls?.controlOptions?.primaryController === "none" &&
                    "None"}
                </ItchyText>
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={24}
                  color={colors.textSecondary}
                />
              </View>
            </Pressable>
            <Pressable
              style={{ ...s.settingContainer }}
              onPress={() => setActivePicker("secondaryController")}
            >
              <ItchyText style={s.settingTitle}>Right Control</ItchyText>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <ItchyText
                  style={{ color: colors.textSecondary, fontSize: 16 }}
                >
                  {controls?.controlOptions?.secondaryController ===
                    "joystick" && "Joystick"}
                  {controls?.controlOptions?.secondaryController === "dpad" &&
                    "D-Pad"}
                  {controls?.controlOptions?.secondaryController ===
                    "buttonpad" && "Button Pad"}
                  {controls?.controlOptions?.secondaryController === "none" &&
                    "None"}
                </ItchyText>
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={24}
                  color={colors.textSecondary}
                />
              </View>
            </Pressable>
            <Pressable
              style={{ ...s.settingContainer, ...s.bottomSettingContainer }}
              onPress={() => setActivePicker("extrasCount")}
            >
              <ItchyText style={s.settingTitle}>Extra Controls</ItchyText>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <ItchyText
                  style={{ color: colors.textSecondary, fontSize: 16 }}
                >
                  {controls?.controlOptions?.extrasCount || "None"}
                </ItchyText>
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={24}
                  color={colors.textSecondary}
                />
              </View>
            </Pressable>
            <ItchyText style={s.sectionHeader}>Left Control</ItchyText>
            <Pressable
              style={{ ...s.settingContainer, ...s.topSettingContainer }}
              onPress={() => setActivePicker("primaryPreset")}
            >
              <ItchyText style={s.settingTitle}>Preset</ItchyText>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <ItchyText
                  style={{ color: colors.textSecondary, fontSize: 16 }}
                >
                  {getSelectedPreset("primary") === "custom" && "Custom"}
                  {getSelectedPreset("primary") === "wasd" && "WASD"}
                  {getSelectedPreset("primary") === "arrows" && "Arrow Keys"}
                  {getSelectedPreset("primary") === "ijkl" && "IJKL"}
                </ItchyText>
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={24}
                  color={colors.textSecondary}
                />
              </View>
            </Pressable>
            <Pressable
              style={{ ...s.settingContainer }}
              onPress={() => setActivePicker("primaryUp")}
            >
              <ItchyText style={s.settingTitle}>Up</ItchyText>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <ItchyText
                  style={{ color: colors.textSecondary, fontSize: 16 }}
                >
                  {controlOptions.find(
                    (o) => o.value === controls?.controls?.primary?.up
                  )?.label || "None"}
                </ItchyText>
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={24}
                  color={colors.textSecondary}
                />
              </View>
            </Pressable>
            <Pressable
              style={{ ...s.settingContainer }}
              onPress={() => setActivePicker("primaryDown")}
            >
              <ItchyText style={s.settingTitle}>Down</ItchyText>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <ItchyText
                  style={{ color: colors.textSecondary, fontSize: 16 }}
                >
                  {controlOptions.find(
                    (o) => o.value === controls?.controls?.primary?.down
                  )?.label || "None"}
                </ItchyText>
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={24}
                  color={colors.textSecondary}
                />
              </View>
            </Pressable>
            <Pressable
              style={{ ...s.settingContainer }}
              onPress={() => setActivePicker("primaryLeft")}
            >
              <ItchyText style={s.settingTitle}>Left</ItchyText>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <ItchyText
                  style={{ color: colors.textSecondary, fontSize: 16 }}
                >
                  {controlOptions.find(
                    (o) => o.value === controls?.controls?.primary?.left
                  )?.label || "None"}
                </ItchyText>
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={24}
                  color={colors.textSecondary}
                />
              </View>
            </Pressable>
            <Pressable
              style={{ ...s.settingContainer, ...s.bottomSettingContainer }}
              onPress={() => setActivePicker("primaryRight")}
            >
              <ItchyText style={s.settingTitle}>Right</ItchyText>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <ItchyText
                  style={{ color: colors.textSecondary, fontSize: 16 }}
                >
                  {controlOptions.find(
                    (o) => o.value === controls?.controls?.primary?.right
                  )?.label || "None"}
                </ItchyText>
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={24}
                  color={colors.textSecondary}
                />
              </View>
            </Pressable>
            <ItchyText style={s.sectionHeader}>Right Control</ItchyText>
            <Pressable
              style={{ ...s.settingContainer, ...s.topSettingContainer }}
              onPress={() => setActivePicker("secondaryPreset")}
            >
              <ItchyText style={s.settingTitle}>Preset</ItchyText>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <ItchyText
                  style={{ color: colors.textSecondary, fontSize: 16 }}
                >
                  {getSelectedPreset("secondary") === "custom" && "Custom"}
                  {getSelectedPreset("secondary") === "wasd" && "WASD"}
                  {getSelectedPreset("secondary") === "arrows" && "Arrow Keys"}
                  {getSelectedPreset("secondary") === "ijkl" && "IJKL"}
                </ItchyText>
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={24}
                  color={colors.textSecondary}
                />
              </View>
            </Pressable>
            <Pressable
              style={{ ...s.settingContainer }}
              onPress={() => setActivePicker("secondaryUp")}
            >
              <ItchyText style={s.settingTitle}>Up</ItchyText>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <ItchyText
                  style={{ color: colors.textSecondary, fontSize: 16 }}
                >
                  {controlOptions.find(
                    (o) => o.value === controls?.controls?.secondary?.up
                  )?.label || "None"}
                </ItchyText>
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={24}
                  color={colors.textSecondary}
                />
              </View>
            </Pressable>
            <Pressable
              style={{ ...s.settingContainer }}
              onPress={() => setActivePicker("secondaryDown")}
            >
              <ItchyText style={s.settingTitle}>Down</ItchyText>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <ItchyText
                  style={{ color: colors.textSecondary, fontSize: 16 }}
                >
                  {controlOptions.find(
                    (o) => o.value === controls?.controls?.secondary?.down
                  )?.label || "None"}
                </ItchyText>
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={24}
                  color={colors.textSecondary}
                />
              </View>
            </Pressable>
            <Pressable
              style={{ ...s.settingContainer }}
              onPress={() => setActivePicker("secondaryLeft")}
            >
              <ItchyText style={s.settingTitle}>Left</ItchyText>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <ItchyText
                  style={{ color: colors.textSecondary, fontSize: 16 }}
                >
                  {controlOptions.find(
                    (o) => o.value === controls?.controls?.secondary?.left
                  )?.label || "None"}
                </ItchyText>
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={24}
                  color={colors.textSecondary}
                />
              </View>
            </Pressable>
            <Pressable
              style={{ ...s.settingContainer, ...s.bottomSettingContainer }}
              onPress={() => setActivePicker("secondaryRight")}
            >
              <ItchyText style={s.settingTitle}>Right</ItchyText>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <ItchyText
                  style={{ color: colors.textSecondary, fontSize: 16 }}
                >
                  {controlOptions.find(
                    (o) => o.value === controls?.controls?.secondary?.right
                  )?.label || "None"}
                </ItchyText>
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={24}
                  color={colors.textSecondary}
                />
              </View>
            </Pressable>
            <ItchyText style={s.sectionHeader}>Extra Controls</ItchyText>
            {Array.from({
              length: controls?.controlOptions?.extrasCount || 0,
            }).map((_, index) => (
              <Pressable
                key={index}
                style={{
                  ...s.settingContainer,
                  ...(index === 0 ? s.topSettingContainer : {}),
                  ...(index === (controls?.controlOptions?.extrasCount || 0) - 1
                    ? s.bottomSettingContainer
                    : {}),
                }}
                onPress={() => setActivePicker(`extra${index}`)}
              >
                <ItchyText style={s.settingTitle}>Extra {index + 1}</ItchyText>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <ItchyText
                    style={{ color: colors.textSecondary, fontSize: 16 }}
                  >
                    {controlOptions.find(
                      (o) => o.value === controls?.controls?.extra?.[index]
                    )?.label || "None"}
                  </ItchyText>
                  <MaterialIcons
                    name="keyboard-arrow-down"
                    size={24}
                    color={colors.textSecondary}
                  />
                </View>
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>

      {/* Single Picker Bottom Sheet */}
      <PickerBottomSheet
        options={activePickerConfig?.options || []}
        selectedValue={activePickerConfig?.currentValue}
        onValueChange={activePickerConfig?.onSelect || (() => {})}
        placeholder={activePickerConfig?.placeholder || "Select an option"}
        searchable={activePickerConfig?.searchable || false}
        isOpen={activePicker !== null}
        onClose={() => setActivePicker(null)}
      />
    </>
  );
}
