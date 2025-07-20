import { router, Stack, useLocalSearchParams } from "expo-router";
import { ScrollView, Text, useWindowDimensions, View } from "react-native";
import { StyleSheet } from "react-native";
import { useTheme } from "../../../../utils/theme";
import APIProject from "../../../../utils/api-wrapper/project";
import { useMMKVObject, useMMKVString } from "react-native-mmkv";
import { useEffect, useMemo, useState } from "react";
import { Selector } from "rn-selector";
import getControlOptions from "../../../../utils/controlOptions";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

export default function ControlsScreen() {
    const { id } = useLocalSearchParams();
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets(); // Add this line
    const [project, setProject] = useState();
    const [currentMapping, setCurrentMapping] = useMMKVObject("currentMapping");
    const [controls, setControls] = useState(currentMapping || {
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
            extra: []
        },
    });
    const { width } = useWindowDimensions();
    const [token] = useMMKVString("token");
    const [username] = useMMKVString("username");
    const [localControllerMappings, setLocalControllerMappings] = useMMKVObject("localControllerMappings");

    useEffect(() => {
        APIProject.getProject(id).then((project) => {
            setProject(project);
        });
    }, [id]);

    const s = useMemo(() => StyleSheet.create({
        sectionHeader: {
            color: colors.textSecondary,
            fontSize: 12,
            paddingVertical: 10,
            paddingHorizontal: 20,
            marginTop: 10
        },
        settingContainer: {
            backgroundColor: colors.backgroundSecondary,
            flexDirection: 'row',
            justifyContent: "space-between",
            alignItems: 'center',
            borderColor: colors.backgroundTertiary,
            borderBottomWidth: 0.5,
            height: 50,
            marginHorizontal: 15,
            paddingHorizontal: 20,
            paddingRight: 8
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
        }
    }), [isDark]);

    const controlOptions = useMemo(() => getControlOptions(), []);
    const selectorStyles = useMemo(() => ({
        container: {
            width: width * 0.5,
            backgroundColor: colors.backgroundSecondary,
            borderWidth: 0,
        },
        text: {
            color: colors.textSecondary,
            alignSelf: "flex-end",
            textAlign: "right",
        },
        option: {
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.backgroundTertiary,
        },
        selectedOption: {
            color: colors.accent,
            backgroundColor: colors.backgroundTertiary,
        },
        dropdown: {
            borderRadius: 10,
            backgroundColor: colors.backgroundSecondary,
            overflow: "hidden",
        },
        searchInput: {
            color: colors.textSecondary,
            backgroundColor: colors.backgroundTertiary,
            borderBottomWidth: 0.5,
            borderColor: colors.textSecondary
        }
    }), [colors, width]);

    const SelectorComponent = ({ options, selectedValue, onValueChange, searchable = true }) => (
        <Selector
            options={options}
            selectedValue={selectedValue}
            onValueChange={onValueChange}
            style={selectorStyles.container}
            textStyle={selectorStyles.text}
            optionStyle={selectorStyles.option}
            selectedOptionStyle={selectorStyles.selectedOption}
            searchInputStyle={selectorStyles.searchInput}
            dropdownStyle={selectorStyles.dropdown}
            searchable={searchable}
            searchPlaceholder="Search a key..."
        />
    );

    const handleSave = () => {
        fetch(`https://itchy-controldb.vercel.app/api/controllermapping?projectId=${id}&username=${username}`, {
            method: "PUT",
            headers: {
                "X-Token": token
            },
            body: JSON.stringify({
                controlOptions: controls.controlOptions,
                controls: controls.controls
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                if (!data.error) {
                    setLocalControllerMappings((prev) => ({
                        ...prev,
                        [id]: data.id
                    }));
                    setCurrentMapping({
                        controlOptions: controls.controlOptions,
                        controls: controls.controls,
                        username: username,
                    })
                    router.dismissTo(`/projects/${id}/controls/find`);
                    return;
                }
            });
    }

    return (
        <>
            <Stack.Screen options={{ headerRight: () => (<MaterialIcons.Button name="save" onPressIn={handleSave} size={24} color={colors.text} backgroundColor="transparent" style={{ paddingRight: 0 }} />) }} />
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: insets.bottom * 4 }} // Add paddingBottom here
            >
                {project && <>
                    <Text style={s.sectionHeader}>Preferences</Text>
                    <View style={{ ...s.settingContainer, ...s.topSettingContainer }}>
                        <Text style={s.settingTitle}><Text style={{ color: colors.accent, fontWeight: "bold" }}>{project.title}</Text> by {project.author?.username}</Text>
                    </View>
                    <View style={{ ...s.settingContainer }}>
                        <Text style={s.settingTitle}>Left Control</Text>
                        <SelectorComponent
                            searchable={false}
                            options={[
                                { label: "Joystick", value: "joystick" },
                                { label: "D-Pad", value: "dpad" },
                                { label: "Button Pad", value: "buttonpad" },
                                { label: "None", value: "none" },
                            ]}
                            selectedValue={controls?.controlOptions?.primaryController || "joystick"}
                            onValueChange={(value) => {
                                setControls((prev) => ({
                                    ...prev,
                                    controlOptions: {
                                        ...prev.controlOptions,
                                        primaryController: value,
                                    },
                                }));
                            }}
                        />
                    </View>
                    <View style={{ ...s.settingContainer }}>
                        <Text style={s.settingTitle}>Right Control</Text>
                        <SelectorComponent
                            searchable={false}
                            options={[
                                { label: "Joystick", value: "joystick" },
                                { label: "D-Pad", value: "dpad" },
                                { label: "Button Pad", value: "buttonpad" },
                                { label: "None", value: "none" },
                            ]}
                            selectedValue={controls?.controlOptions?.secondaryController || "buttonpad"}
                            onValueChange={(value) => {
                                setControls((prev) => ({
                                    ...prev,
                                    controlOptions: {
                                        ...prev.controlOptions,
                                        secondaryController: value,
                                    },
                                }));
                            }}
                        />
                    </View>
                    <View style={{ ...s.settingContainer, ...s.bottomSettingContainer }}>
                        <Text style={s.settingTitle}>Extra Controls</Text>
                        <SelectorComponent
                            searchable={false}
                            options={[
                                { label: "None", value: 0 },
                                { label: "1", value: 1 },
                                { label: "2", value: 2 },
                                { label: "3", value: 3 },
                                { label: "4", value: 4 },
                                { label: "5", value: 5 },
                            ]}
                            selectedValue={controls?.controlOptions?.extrasCount || 0}
                            onValueChange={(value) => {
                                setControls((prev) => ({
                                    ...prev,
                                    controlOptions: {
                                        ...prev.controlOptions,
                                        extrasCount: value,
                                    },
                                    controls: {
                                        ...prev.controls,
                                        extra: Array.from({ length: value }, (_, i) => prev.controls.extra[i] || 0),
                                    }
                                }));
                            }}
                        />
                    </View>
                    <Text style={s.sectionHeader}>Left Control</Text>
                    <View style={{ ...s.settingContainer, ...s.topSettingContainer }}>
                        <Text style={s.settingTitle}>Up</Text>
                        <SelectorComponent
                            options={controlOptions}
                            selectedValue={controls?.controls?.primary?.up || 0}
                            onValueChange={(value) => {
                                setControls((prev) => ({
                                    ...prev,
                                    controls: {
                                        ...prev.controls,
                                        primary: {
                                            ...prev.controls.primary,
                                            up: value,
                                        },
                                    },
                                }));
                            }}
                        />
                    </View>
                    <View style={{ ...s.settingContainer }}>
                        <Text style={s.settingTitle}>Down</Text>
                        <SelectorComponent
                            options={controlOptions}
                            selectedValue={controls?.controls?.primary?.down || 0}
                            onValueChange={(value) => {
                                setControls((prev) => ({
                                    ...prev,
                                    controls: {
                                        ...prev.controls,
                                        primary: {
                                            ...prev.controls.primary,
                                            down: value,
                                        },
                                    },
                                }));
                            }}
                        />
                    </View>
                    <View style={{ ...s.settingContainer }}>
                        <Text style={s.settingTitle}>Left</Text>
                        <SelectorComponent
                            options={controlOptions}
                            selectedValue={controls?.controls?.primary?.left || 0}
                            onValueChange={(value) => {
                                setControls((prev) => ({
                                    ...prev,
                                    controls: {
                                        ...prev.controls,
                                        primary: {
                                            ...prev.controls.primary,
                                            left: value,
                                        },
                                    },
                                }));
                            }}
                        />
                    </View>
                    <View style={{ ...s.settingContainer, ...s.bottomSettingContainer }}>
                        <Text style={s.settingTitle}>Right</Text>
                        <SelectorComponent
                            options={controlOptions}
                            selectedValue={controls?.controls?.primary?.right || 0}
                            onValueChange={(value) => {
                                setControls((prev) => ({
                                    ...prev,
                                    controls: {
                                        ...prev.controls,
                                        primary: {
                                            ...prev.controls.primary,
                                            right: value,
                                        },
                                    },
                                }));
                            }}
                        />
                    </View>
                    <Text style={s.sectionHeader}>Right Control</Text>
                    <View style={{ ...s.settingContainer, ...s.topSettingContainer }}>
                        <Text style={s.settingTitle}>Up</Text>
                        <SelectorComponent
                            options={controlOptions}
                            selectedValue={controls?.controls?.secondary?.up || 0}
                            onValueChange={(value) => {
                                setControls((prev) => ({
                                    ...prev,
                                    controls: {
                                        ...prev.controls,
                                        secondary: {
                                            ...prev.controls.secondary,
                                            up: value,
                                        },
                                    },
                                }));
                            }}
                        />
                    </View>
                    <View style={{ ...s.settingContainer }}>
                        <Text style={s.settingTitle}>Down</Text>
                        <SelectorComponent
                            options={controlOptions}
                            selectedValue={controls?.controls?.secondary?.down || 0}
                            onValueChange={(value) => {
                                setControls((prev) => ({
                                    ...prev,
                                    controls: {
                                        ...prev.controls,
                                        secondary: {
                                            ...prev.controls.secondary,
                                            down: value,
                                        },
                                    },
                                }));
                            }}
                        />
                    </View>
                    <View style={{ ...s.settingContainer }}>
                        <Text style={s.settingTitle}>Left</Text>
                        <SelectorComponent
                            options={controlOptions}
                            selectedValue={controls?.controls?.secondary?.left || 0}
                            onValueChange={(value) => {
                                setControls((prev) => ({
                                    ...prev,
                                    controls: {
                                        ...prev.controls,
                                        secondary: {
                                            ...prev.controls.secondary,
                                            left: value,
                                        },
                                    },
                                }));
                            }}
                        />
                    </View>
                    <View style={{ ...s.settingContainer, ...s.bottomSettingContainer }}>
                        <Text style={s.settingTitle}>Right</Text>
                        <SelectorComponent
                            options={controlOptions}
                            selectedValue={controls?.controls?.secondary?.right || 0}
                            onValueChange={(value) => {
                                setControls((prev) => ({
                                    ...prev,
                                    controls: {
                                        ...prev.controls,
                                        secondary: {
                                            ...prev.controls.secondary,
                                            right: value,
                                        },
                                    },
                                }));
                            }}
                        />
                    </View>
                    <Text style={s.sectionHeader}>Extra Controls</Text>
                    {Array.from({ length: controls?.controlOptions?.extrasCount || 0 }).map((_, index) => (
                        <View key={index} style={{ ...s.settingContainer, ...(index === 0 ? s.topSettingContainer : {}), ...(index === (controls?.controlOptions?.extrasCount || 0) - 1 ? s.bottomSettingContainer : {}) }}>
                            <Text style={s.settingTitle}>Extra {index + 1}</Text>
                            <SelectorComponent
                                options={controlOptions}
                                selectedValue={controls?.controls?.extra?.[index] || 0}
                                onValueChange={(value) => {
                                    setControls((prev) => {
                                        const newExtras = [...(prev.controls.extra || [])];
                                        newExtras[index] = value;
                                        return {
                                            ...prev,
                                            controls: {
                                                ...prev.controls,
                                                extra: newExtras,
                                            },
                                        };
                                    });
                                }}
                            />
                        </View>
                    ))}
                </>}
            </ScrollView>
        </>
    );
};