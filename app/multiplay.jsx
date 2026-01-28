import { useRef } from "react";
import {
  View,
  TextInput,
  ActivityIndicator,
  useWindowDimensions,
  ScrollView,
  Platform,
} from "react-native";
import ItchyText from "../components/ItchyText";
import { RTCView } from "react-native-webrtc";
import { useTheme } from "../utils/theme";
import SquircleView from "../components/SquircleView";
import Card from "../components/Card";
import { Stack } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import Controls from "../components/Controls";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Chip from "../components/Chip";
import { useNavigation } from "expo-router";
import linkWithFallback from "../utils/linkWithFallback";
import { useMMKVObject } from "react-native-mmkv";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useMultiPlayClient } from "../utils/hooks/useMultiPlayClient";

export default function MultiPlay() {
  const {
    roomCode,
    setRoomCode,
    status,
    remoteStream,
    projectMetadata,
    loading,
    joinRoom,
    disconnect,
    sendKeyEvent,
  } = useMultiPlayClient();

  const { colors, dimensions, isDark } = useTheme();
  const { width, height: appHeight } = useWindowDimensions();
  // Controls are rendered inline (collapsible) instead of a separate sheet
  const [user] = useMMKVObject("user");
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const rtcViewRef = useRef(null);
  const lastMouseUpdate = useRef(0);

  // Check if user is under 13 years old
  const isUserUnder13 = () => {
    if (!user || !user.birthMonth || !user.birthYear) return true;

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11

    const age = currentYear - user.birthYear;

    // If they haven't had their birthday this year yet, subtract 1 from age
    if (currentMonth < user.birthMonth) {
      return age - 1 < 13;
    }

    return age < 13;
  };

  const viewWidth = width - 30;
  const viewHeight = viewWidth * (360 / 480);

  const getScratchCoords = (x, y) => {
    const scratchX = (x / viewWidth) * 480 - 240;
    const scratchY = 180 - (y / viewHeight) * 360;
    return { x: Math.round(scratchX), y: Math.round(scratchY) };
  };

  const tapGesture = Gesture.Tap()
    .runOnJS(true)
    .onBegin((e) => {
      sendKeyEvent("down", "mouse", getScratchCoords(e.x, e.y));
    })
    .onEnd((e) => {
      sendKeyEvent("up", "mouse", getScratchCoords(e.x, e.y));
    });

  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .onUpdate((e) => {
      sendKeyEvent("move", "mouse", getScratchCoords(e.x, e.y))
    });

  const composedGesture = Gesture.Simultaneous(tapGesture, panGesture);

  return (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: insets.bottom + 20,
          paddingTop: insets.top,
          backgroundColor: colors.accentTransparent,
        }}
      >
        <Stack.Screen options={{ headerShown: false, title: "MultiPlay" }} />
        <View
          style={{
            flexDirection: "row",
            columnGap: 15,
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 10,
            flex: 1,
          }}
        >
          <TextInput
            style={{
              backgroundColor: "transparent",
              color: colors.text,
              fontFamily: Platform.select({
                android: "Inter_400Regular",
                ios: "Inter-Regular",
              }),
              flex: 1,
              letterSpacing: -0.4,
              fontSize: 22,
              marginLeft: 20,
            }}
            value={roomCode}
            placeholder={isUserUnder13() ? "age restricted" : "Room Code"}
            autoCapitalize="characters"
            maxLength={6}
            onChangeText={(t) => {
              setRoomCode(t);
              const trimmed = t.trim().toUpperCase();
              if (trimmed.length === 6 && !isUserUnder13()) {
                joinRoom(trimmed);
              }
            }}
            clearTextOnFocus={true}
            clearButtonMode="always"
            editable={!isUserUnder13()}
          />
          <Chip.Icon
            icon={status == "Connected" ? "radio" : "warning"}
            text={status}
            mode="filled"
            style={{ marginRight: 15 }}
            color={status == "Connected" ? "#1fa81f" : (status == "Idle" ? colors.accent : undefined)}
          />
        </View>
        {isUserUnder13() && !remoteStream ? (
          <View style={{ paddingHorizontal: 20, marginTop: 10 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <MaterialIcons
                name="info"
                size={20}
                color={colors.accent}
                style={{ marginRight: 8 }}
              />
              <ItchyText
                style={{
                  color: colors.accent,
                  fontSize: 16,
                  fontWeight: "bold",
                }}
              >
                Age Restriction
              </ItchyText>
            </View>
            <ItchyText style={{ color: colors.text, lineHeight: 17, marginBottom: 5 }}>
              MultiPlay is restricted to users who are 13 years of age or older.
              This restriction is in place to comply with online privacy and
              safety regulations.
              {!user ? " We couldn't verify that you are over 13 since you aren't logged in to a Scratch account." : <></>}
            </ItchyText>
          </View>
        ) : <></>}
        {!!remoteStream ? (
          <GestureDetector gesture={composedGesture}>
            <View
              style={{
                width: width - 30,
                aspectRatio: 480 / 360,
                borderWidth: 2,
                borderRadius: 10,
                overflow: "hidden",
                marginHorizontal: 15,
                marginTop: 10,
                borderColor: colors.outline,
                borderWidth: dimensions.outlineWidth,
              }}
            >
              <RTCView
                streamURL={remoteStream.toURL()}
                style={{ height: "100%", width: "100%" }}
                objectFit="cover"
                onLayout={(event) => {
                  const { y, height } = event.nativeEvent.layout;
                }}
              />
            </View>
          </GestureDetector>
        ) : (
          loading ? (
            <View
              style={{
                width: width - 30,
                aspectRatio: 480 / 360,
                borderWidth: 2,
                borderRadius: 10,
                overflow: "hidden",
                marginHorizontal: 15,
                marginTop: 10,
                borderColor: colors.outline,
                borderWidth: dimensions.outlineWidth,
              }}
            >
              <View
                style={{
                  alignItems: "center",
                  height: "100%",
                  width: "100%",
                  justifyContent: "center",
                }}
              >
                <ActivityIndicator size={50} color={colors.accent} />
              </View>
            </View>
          ) : <></>
        )}
        {/* Stylized container similar to Search page */}
        <SquircleView
          cornerSmoothing={0.6}
          style={{
            backgroundColor: colors.background,
            marginTop: 15,
            marginHorizontal: 0,
            paddingBottom: 60,
            paddingHorizontal: 15,
            paddingTop: 10,
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            outlineColor: colors.outline,
            outlineStyle: "solid",
            outlineWidth: dimensions.outlineWidth,
            borderWidth: 0.1,
            borderColor: colors.background,
            borderTopWidth: 4,
            borderTopColor: colors.highlight,
            flex: 1,
            overflow: "visible",
            boxShadow: "0px -2px 10px rgba(0,94,185,0.15)",
            minHeight: appHeight - insets.top + insets.bottom / 2,
          }}
        >
          <Controls
            onControlPress={sendKeyEvent}
            projectId={projectMetadata?.id}
            showConfiguration={true}
          />
          {projectMetadata && (
            <Card
              style={{
                paddingHorizontal: 15,
                paddingVertical: 10,
                marginTop: 15,
                borderRadius: dimensions.mediumRadius,
              }}
            >
              <ItchyText
                style={{
                  color: colors.accent,
                  fontSize: 18,
                  fontWeight: "bold",
                }}
              >
                {projectMetadata.title}
              </ItchyText>
              <ItchyText style={{ color: colors.textSecondary, marginTop: 2 }}>
                by {projectMetadata.author?.username}
              </ItchyText>
              {projectMetadata.instructions && (
                <View style={{ marginTop: 8 }}>
                  <ItchyText
                    style={{
                      color: colors.text,
                      fontWeight: "bold",
                      fontSize: 14,
                    }}
                  >
                    Instructions
                  </ItchyText>
                  <ItchyText
                    style={{
                      color: colors.textSecondary,
                      marginTop: 4,
                      lineHeight: 17,
                    }}
                  >
                    {projectMetadata.instructions}
                  </ItchyText>
                </View>
              )}
              <View
                style={{
                  flexDirection: "row",
                  marginTop: 8,
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                <ItchyText
                  style={{ color: colors.textSecondary, fontSize: 12 }}
                >
                  ❤️ {projectMetadata.stats?.loves || 0}
                </ItchyText>
                <ItchyText
                  style={{ color: colors.textSecondary, fontSize: 12 }}
                >
                  ⭐ {projectMetadata.stats?.favorites || 0}
                </ItchyText>
                <ItchyText
                  style={{ color: colors.textSecondary, fontSize: 12 }}
                >
                  👁️ {projectMetadata.stats?.views || 0}
                </ItchyText>
              </View>
            </Card>
          )}
          {!remoteStream ? (
            <Card style={{ paddingHorizontal: 20, paddingVertical: 15, marginTop: 5 }}>
              <ItchyText
                style={{
                  color: colors.accent,
                  fontSize: 20,
                  fontWeight: "bold",
                }}
              >
                Introducing MultiPlay
              </ItchyText>
              <ItchyText
                style={{
                  color: colors.textSecondary,
                  marginTop: 8,
                  lineHeight: 17,
                }}
              >
                MultiPlay is the first-ever online multiplayer platform for
                local multiplayer style Scratch games, built-in to Itchy! You
                can host a game, make a join code, and send it to a friend to
                allow them to see and control game you're playing. Combine this
                with Itchy's customizable control setups and you can play local
                multiplayer games with keyboard controls on your phone.
              </ItchyText>
              <ItchyText
                style={{
                  color: colors.textSecondary,
                  marginTop: 8,
                  lineHeight: 17,
                }}
              >
                It's worth noting that MultiPlay is still in the alpha stage, so
                you may encounter connection issues, lag, random inputs, and
                other stuff like that.
              </ItchyText>
            </Card>
          ) : <></>}
          <ScrollView
            horizontal={true}
            style={{ flex: 1, marginTop: 10 }}
            contentContainerStyle={{ columnGap: 5 }}
          >
            <Chip.Icon
              icon="exit"
              text="Leave MultiPlay"
              onPress={() => nav.goBack()}
            />
            <Chip.Icon
              icon="help-circle"
              text="MultiPlay FAQ"
              onPress={() =>
                linkWithFallback(
                  "https://itchy.micahlindley.com/multiplay",
                  colors.accent
                )
              }
              color={colors.accent}
            />
          </ScrollView>
        </SquircleView>
      </ScrollView>
    </>
  );
}
