import { useEffect, useState } from "react";
import * as Haptics from 'expo-haptics';
import { View } from "react-native";
import ItchyText from "./ItchyText";
import { useTheme } from "../utils/theme";
import Joystick from "./Controls/Joystick";
import Dpad from "./Controls/Dpad";
import ButtonPad from "./Controls/ButtonPad";
import ExtraButton from "./Controls/ExtraButton";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMMKVObject } from "react-native-mmkv";
import SquircleView from "./SquircleView";
import { dimensions } from "../utils/theme/dimensions";
import { LinearGradient } from "expo-linear-gradient";
import Pressable from "./Pressable";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
    interpolate,
    Extrapolate,
} from "react-native-reanimated";

// Create animated SquircleView component
const AnimatedSquircleView = Animated.createAnimatedComponent(SquircleView);

const MAPPING_CONFIG = {
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
            up: "ArrowUp",
            down: "ArrowDown",
            left: "ArrowLeft",
            right: "ArrowRight",
        },
        extra: [" "]
    },
}

export default function Controls({ onControlPress = () => { }, projectId = 0, showConfiguration = true, style = {} }) {
    const [currentMapping, setCurrentMapping] = useMMKVObject("currentMapping");
    const [localControllerMappings] = useMMKVObject("localControllerMappings");
    const [containerDimensions, setContainerDimensions] = useState({ width: 300, height: 200 });
    const [isCollapsed, setIsCollapsed] = useState(true);
    const { colors } = useTheme();

    // Reanimated values
    const animatedHeight = useSharedValue(0); // 0 = collapsed, 1 = expanded - start collapsed
    const expandedHeight = useSharedValue(300); // Start with generous height to prevent initial clipping
    const lockedExpandedHeight = useSharedValue(300); // Locked value used during animations
    const isAnimating = useSharedValue(false); // Shared value for animation state
    const collapsedHeight = 60; // Height when collapsed

    const onControlPressProxy = (key, action) => {
        if (action === "keydown") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
        }
        onControlPress(key, action);
    }

    const toggleCollapse = () => {
        const newCollapsedState = !isCollapsed;

        // Lock the current expanded height before animation to prevent snapping
        lockedExpandedHeight.value = expandedHeight.value;
        isAnimating.value = true;

        setIsCollapsed(newCollapsedState);
        animatedHeight.value = withTiming(
            newCollapsedState ? 0 : 1, // Fixed: 0 for collapsed, 1 for expanded
            {
                duration: 300, // Increased from 300ms to 1500ms to check smoothness
                easing: Easing.bezier(0.4, 0.0, 0.2, 1),
            },
            (finished) => {
                if (finished) {
                    isAnimating.value = false;
                }
            }
        );
    };

    const handleExpand = () => {
        if (isCollapsed) {
            toggleCollapse();
        }
    };

    // Animated styles
    const animatedContainerStyle = useAnimatedStyle(() => {
        const currentExpandedHeight = isAnimating.value ? lockedExpandedHeight.value : expandedHeight.value;

        const squircleHeight = interpolate(
            animatedHeight.value,
            [0, 1],
            [collapsedHeight, currentExpandedHeight],
            Extrapolate.CLAMP
        );

        const buttonSpaceHeight = 80; // Space needed for close/configure buttons (marginTop: -68 + paddingTop: 70 + button height)

        const totalHeight = interpolate(
            animatedHeight.value,
            [0, 1],
            [collapsedHeight, squircleHeight + buttonSpaceHeight], // Add button space when expanded
            Extrapolate.CLAMP
        );

        return {
            height: animatedHeight.value === 1 ? Math.max(totalHeight, 280) : totalHeight, // Ensure minimum height when expanded
            overflow: 'visible', // Allow buttons to be visible outside the squircle
        };
    }); const animatedSquircleStyle = useAnimatedStyle(() => {
        const borderRadius = interpolate(
            animatedHeight.value,
            [0, 1],
            [collapsedHeight / 2, 50], // Pill shape when collapsed
            Extrapolate.CLAMP
        );

        const height = interpolate(
            animatedHeight.value,
            [0, 1],
            [collapsedHeight - 10, Math.max(280, isAnimating.value ? lockedExpandedHeight.value : expandedHeight.value)], // Ensure adequate initial height
            Extrapolate.CLAMP
        );

        return {
            backgroundColor: colors.accent,
            borderRadius,
            borderWidth: 1,
            borderColor: colors.accent,
            outlineColor: colors.outline,
            outlineWidth: 2,
            overflow: 'hidden',
            boxShadow: "0px 10px 20px 0px #FFFFFF40 inset, 0px 2px 1px 0px #FFFFFF40 inset, 0px -5px 0px 0px #0000001A inset, 0px 2px 5px 2px rgba(76, 148, 255, 0.275), 0px 8px 6px 0px #FFFFFF33 inset, 0px 4px 0px 0px #FFFFFF4D inset",
            width: "100%",
            height: height, // Always use the calculated height
        };
    });

    const animatedContentStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            animatedHeight.value,
            [0, 0.3, 1],
            [0, 0, 1],
            Extrapolate.CLAMP
        );

        return {
            opacity,
            overflow: 'hidden'
        };
    });

    const animatedButtonsStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            animatedHeight.value,
            [0, 0.7, 1],
            [0, 0, 1],
            Extrapolate.CLAMP
        );

        const translateY = interpolate(
            animatedHeight.value,
            [0, 1],
            [50, 0], // When collapsed (0), push down by 50px. When expanded (1), at normal position (0)
            Extrapolate.CLAMP
        );

        return {
            opacity,
            transform: [{ translateY }],
        };
    });

    const animatedTitleStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            animatedHeight.value,
            [0, 0.7, 1],
            [1, 0, 0],
            Extrapolate.CLAMP
        );

        return {
            opacity,
        };
    });

    const animatedLinearGradientStyle = useAnimatedStyle(() => {
        const height = interpolate(
            animatedHeight.value,
            [0, 1],
            [collapsedHeight, Math.max(280, isAnimating.value ? lockedExpandedHeight.value : expandedHeight.value)], // Use full height, no subtraction
            Extrapolate.CLAMP
        );

        return {
            height: height
            // Remove paddingVertical from here since LinearGradient will handle its own padding
        };
    });

    useEffect(() => {
        fetch(`https://itchy-controldb.vercel.app/api/controllermapping?projectId=${projectId}&mappingId=${localControllerMappings ? (localControllerMappings[projectId] ? localControllerMappings[projectId] : "") : ""}`)
            .then((response) => response.json())
            .then((data) => {
                if (!data.error) {
                    setCurrentMapping(data[0]);
                } else {
                    setCurrentMapping(MAPPING_CONFIG);
                }
            });
    }, [projectId, localControllerMappings]);

    return (
        <Animated.View
            style={[{
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start"
            }, style, animatedContainerStyle]}
            onLayout={(event) => {
                const { width: containerWidth, height: containerHeight } = event.nativeEvent.layout;
                setContainerDimensions({ width: containerWidth, height: containerHeight });
            }}
        >
            {/* Hidden measurement view to get true content height */}
            <View
                style={{
                    position: 'absolute',
                    opacity: 0,
                    zIndex: -999,
                    pointerEvents: 'none',
                    width: '100%'
                }}
                onLayout={(event) => {
                    const { height } = event.nativeEvent.layout;
                    // Only measure when not animating and when content has loaded
                    if (height > 0 && !isAnimating.value && !isCollapsed && currentMapping?.controlOptions && Math.abs(height - expandedHeight.value) > 5) {
                        // Use the measured height minus a small adjustment for the border/outline
                        expandedHeight.value = height - 4; // Subtract outline width (2px top + 2px bottom)
                    }
                }}
            >
                <View style={{
                    backgroundColor: colors.accent,
                    borderRadius: dimensions.largeRadius,
                    borderWidth: 1,
                    borderColor: colors.accent,
                    outlineColor: colors.outline,
                    outlineWidth: 2,
                    overflow: 'hidden'
                }}>
                    <LinearGradient
                        colors={['rgba(255,255,255,0.2)', 'rgba(0,0,0,0.2)']}
                        dither={false}
                        style={{}}
                    >
                        {currentMapping?.controlOptions && (
                            <>
                                <View style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    width: "100%",
                                    paddingHorizontal: Math.max(10, containerDimensions.width * 0.02)
                                }}>
                                    {currentMapping.controlOptions.showPrimaryController && <>
                                        {currentMapping.controlOptions.primaryController === "joystick" && <Joystick onControlPress={() => { }} mapping={currentMapping.controls.primary} containerWidth={containerDimensions.width} />}
                                        {currentMapping.controlOptions.primaryController === "dpad" && <Dpad onControlPress={() => { }} mapping={currentMapping.controls.primary} containerWidth={containerDimensions.width} />}
                                        {currentMapping.controlOptions.primaryController === "buttonpad" && <ButtonPad onControlPress={() => { }} mapping={currentMapping.controls.primary} containerWidth={containerDimensions.width} />}
                                    </>}
                                    {currentMapping.controlOptions.showSecondaryController && <>
                                        {currentMapping.controlOptions.secondaryController === "joystick" && <Joystick onControlPress={() => { }} mapping={currentMapping.controls.secondary} containerWidth={containerDimensions.width} />}
                                        {currentMapping.controlOptions.secondaryController === "dpad" && <Dpad onControlPress={() => { }} mapping={currentMapping.controls.secondary} containerWidth={containerDimensions.width} />}
                                        {currentMapping.controlOptions.secondaryController === "buttonpad" && <ButtonPad onControlPress={() => { }} mapping={currentMapping.controls.secondary} containerWidth={containerDimensions.width} />}
                                    </>}
                                </View>
                                {currentMapping.controls.extra.length > 0 && (
                                    <View style={{
                                        flexDirection: "row",
                                        alignItems: "flex-start",
                                        justifyContent: "center",
                                        marginTop: 20,
                                        borderColor: "rgba(0,0,0,0.3)",
                                        borderTopWidth: 1,
                                        width: "90%",
                                        paddingTop: 10,
                                        marginHorizontal: containerDimensions.width * 0.05
                                    }}>
                                        {currentMapping.controls.extra.map((key, index) => (
                                            <ExtraButton key={index} onControlPress={() => { }} keyboardKey={key} />
                                        ))}
                                    </View>
                                )}
                            </>
                        )}
                    </LinearGradient>
                </View>
            </View>
            <Pressable
                onPress={handleExpand}
                style={{
                    width: "100%",
                    position: isCollapsed ? 'absolute' : 'relative',
                    top: 0,
                    zIndex: 10,
                }}
                disabled={!isCollapsed}
            >
                <AnimatedSquircleView
                    cornerSmoothing={0.6}
                    style={animatedSquircleStyle}
                >
                    {/* Collapsed title */}
                    <Animated.View style={[{
                        position: 'absolute',
                        top: -2,
                        left: 0,
                        right: 0,
                        height: collapsedHeight - 10,
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        zIndex: 5,
                        flexDirection: "row"
                    }, animatedTitleStyle]}>
                        <Ionicons name="game-controller" size={24} style={{ marginRight: 10, marginLeft: 20 }} color="#ffffff" />
                        <ItchyText style={{
                            color: "#ffffff",
                            fontSize: 16,
                            fontWeight: "bold",
                            textAlign: "left"
                        }}>
                            Virtual Controller
                        </ItchyText>
                    </Animated.View>

                    {/* Main content */}
                    <Animated.View style={animatedContentStyle}>
                        <Animated.View style={animatedLinearGradientStyle}>
                            <LinearGradient
                                colors={['rgba(255,255,255,0.2)', 'rgba(0,0,0,0.2)']}
                                dither={false}
                                style={{ flex: 1, paddingTop: 20 }}
                            >
                                {currentMapping?.controlOptions ? (
                                    <>
                                        <View style={{
                                            flex: 0,
                                            flexDirection: "row",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            width: "100%",
                                            paddingHorizontal: Math.max(10, containerDimensions.width * 0.02)
                                        }}>
                                            {currentMapping.controlOptions.showPrimaryController && <>
                                                {currentMapping.controlOptions.primaryController === "joystick" && <Joystick onControlPress={onControlPressProxy} mapping={currentMapping.controls.primary} containerWidth={containerDimensions.width} />}
                                                {currentMapping.controlOptions.primaryController === "dpad" && <Dpad onControlPress={onControlPressProxy} mapping={currentMapping.controls.primary} containerWidth={containerDimensions.width} />}
                                                {currentMapping.controlOptions.primaryController === "buttonpad" && <ButtonPad onControlPress={onControlPressProxy} mapping={currentMapping.controls.primary} containerWidth={containerDimensions.width} />}
                                            </>}
                                            {currentMapping.controlOptions.showSecondaryController && <>
                                                {currentMapping.controlOptions.secondaryController === "joystick" && <Joystick onControlPress={onControlPressProxy} mapping={currentMapping.controls.secondary} containerWidth={containerDimensions.width} />}
                                                {currentMapping.controlOptions.secondaryController === "dpad" && <Dpad onControlPress={onControlPressProxy} mapping={currentMapping.controls.secondary} containerWidth={containerDimensions.width} />}
                                                {currentMapping.controlOptions.secondaryController === "buttonpad" && <ButtonPad onControlPress={onControlPressProxy} mapping={currentMapping.controls.secondary} containerWidth={containerDimensions.width} />}
                                            </>}
                                        </View>
                                        {currentMapping.controls.extra.length > 0 && (
                                            <View style={{
                                                flex: 1,
                                                flexDirection: "row",
                                                alignItems: "flex-start",
                                                justifyContent: "center",
                                                marginTop: 20,
                                                borderColor: "rgba(0,0,0,0.3)",
                                                borderTopWidth: 1,
                                                width: "90%",
                                                paddingTop: 10,
                                                marginHorizontal: containerDimensions.width * 0.05,
                                                zIndex: 2
                                            }}>
                                                {currentMapping.controls.extra.map((key, index) => (
                                                    <ExtraButton key={index} onControlPress={onControlPressProxy} keyboardKey={key} />
                                                ))}
                                            </View>
                                        )}
                                    </>
                                ) : (
                                    <ItchyText style={{ color: colors.text, padding: 20 }}>Loading controls...</ItchyText>
                                )}
                            </LinearGradient>
                        </Animated.View>
                    </Animated.View>
                </AnimatedSquircleView>
            </Pressable>

            {/* Close and Configure buttons */}
            <Animated.View style={[{
                position: 'absolute',
                bottom: 30, // Position just slightly below the squircle
                left: 0,
                right: 0,
                zIndex: -1,
                alignItems: "center",
                width: "100%",
                flexDirection: 'row',
                justifyContent: 'center',
                pointerEvents: isCollapsed ? "none" : "auto"
            }, animatedButtonsStyle]}>
                <Pressable
                    onPress={toggleCollapse}
                    style={{
                        margin: "auto",
                        marginRight: 0,
                        padding: 15,
                        paddingTop: 70,
                        paddingBottom: 10,
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: colors.background,
                        borderRadius: dimensions.smallRadius,
                        marginTop: 5,
                        outlineWidth: dimensions.outlineWidth,
                        outlineColor: colors.outline,
                        borderWidth: 1,
                        borderColor: colors.background,
                        borderBottomWidth: 4,
                        borderBottomColor: colors.backgroundSecondary
                    }}
                    disabled={isCollapsed}
                >
                    <Ionicons
                        name="chevron-up"
                        backgroundColor="transparent"
                        color={colors.textSecondary}
                        size={16}
                    />
                    <ItchyText style={{
                        marginLeft: 10,
                        color: colors.textSecondary,
                        fontSize: 14,
                        fontWeight: "bold"
                    }}>
                        Close
                    </ItchyText>
                </Pressable>
                <Pressable
                    onPress={() => router.push(`/projects/${projectId}/controls/find`)}
                    style={{
                        margin: "auto",
                        marginLeft: 10,
                        padding: 15,
                        paddingTop: 70,
                        paddingBottom: 10,
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: colors.background,
                        borderRadius: dimensions.smallRadius,
                        marginTop: 5,
                        outlineWidth: dimensions.outlineWidth,
                        outlineColor: colors.outline,
                        borderWidth: 1,
                        borderColor: colors.background,
                        borderBottomWidth: 4,
                        borderBottomColor: colors.backgroundSecondary
                    }}
                    disabled={isCollapsed}
                >
                    <MaterialIcons
                        name="settings"
                        backgroundColor="transparent"
                        color={colors.textSecondary}
                        size={16}
                    />
                    <ItchyText style={{
                        marginLeft: 10,
                        color: colors.textSecondary,
                        fontSize: 14,
                        fontWeight: "bold"
                    }}>
                        Configure Controls
                    </ItchyText>
                </Pressable>
            </Animated.View>

            {/* Attribution text */}
            {showConfiguration && (
                <Animated.View style={[{
                    justifyContent: "center",
                    alignItems: "center",
                    width: "100%",
                    paddingHorizontal: 20,
                    paddingVertical: 5,
                    marginTop: 50
                }, animatedContentStyle]}>
                    {currentMapping?.username && (
                        <ItchyText style={{
                            color: colors.text,
                            opacity: 0.4,
                            marginBottom: 5,
                            textAlign: "center",
                            fontSize: 12
                        }}>
                            Current control setup provided by @{currentMapping.username}
                        </ItchyText>
                    )}
                </Animated.View>
            )}
        </Animated.View>
    );
}