import {
  ScrollView,
  Switch,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import ItchyText from "../components/ItchyText";
import ScratchAPIWrapper from "../utils/api-wrapper";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { version } from "../package.json";
import {
  useMMKVObject,
  useMMKVString,
  useMMKVBoolean,
} from "react-native-mmkv";
import storage from "../utils/storage";
import linkWithFallback from "../utils/linkWithFallback";
import { Platform } from "react-native";
import FastSquircleView from "react-native-fast-squircle";
import Chip from "../components/Chip";
import { useTheme } from "../utils/theme";
import { getLiquidPlusPadding } from "../utils/platformUtils";
import { getCrashlytics, setCrashlyticsCollectionEnabled } from "@react-native-firebase/crashlytics";

const c = getCrashlytics();

export default function SettingsScreen() {
  const { colors, dimensions, isDark } = useTheme();
  const router = useRouter();
  const [username] = useMMKVString("username");
  const [twConfig, setTWConfig] = useMMKVObject("twConfig");
  // Local state for switches to enable smooth animations
  const [localSwitchState, setLocalSwitchState] = useState({
    interpolate: false,
    autoplay: false,
    fps60: false,
    hqPen: false,
    turbo: false,
  });
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
          minHeight: 50,
          paddingVertical: Platform.OS == "ios" ? 12 : 3,
          marginHorizontal: 15,
          paddingLeft: 20,
          paddingRight: 12,
        },
        topSettingContainer: {
          borderTopLeftRadius: dimensions.mediumRadius,
          borderTopRightRadius: dimensions.mediumRadius,
          borderTopWidth: 1.5,
          borderTopColor: colors.backgroundTertiary,
          borderLeftWidth: 1.5,
          borderLeftColor: colors.backgroundTertiary,
          borderRightWidth: 1.5,
          borderRightColor: colors.backgroundTertiary,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.backgroundTertiary,
        },
        middleSettingContainer: {
          borderLeftWidth: 1.5,
          borderLeftColor: colors.backgroundTertiary,
          borderRightWidth: 1.5,
          borderRightColor: colors.backgroundTertiary,
          borderBottomWidth: 0,
          borderBottomColor: colors.backgroundTertiary,
          borderTopWidth: 1,
          borderTopColor: colors.backgroundTertiary,
        },
        bottomSettingContainer: {
          borderBottomLeftRadius: dimensions.mediumRadius,
          borderBottomRightRadius: dimensions.mediumRadius,
          borderBottomWidth: 3,
          borderBottomColor: colors.backgroundTertiary,
          borderLeftWidth: 1.5,
          borderLeftColor: colors.backgroundTertiary,
          borderRightWidth: 1.5,
          borderRightColor: colors.backgroundTertiary,
          borderTopWidth: 1.2,
          borderTopColor: colors.backgroundTertiary,
        },
        settingTitle: {
          color: colors.text,
          fontSize: 16,
          flex: 1,
        },
      }),
    [isDark]
  );

  useEffect(() => {
    if (!twConfig) {
      setTWConfig({});
    } else {
      setLocalSwitchState({
        interpolate: twConfig.interpolate || false,
        autoplay: twConfig.autoplay || false,
        fps60: twConfig.fps60 || false,
        hqPen: twConfig.hqPen || false,
        turbo: twConfig.turbo || false,
      });
    }
  }, [twConfig]);

  const handleSwitchToggle = (key, value) => {
    setLocalSwitchState((prev) => ({ ...prev, [key]: value }));
    setTWConfig({ ...twConfig, [key]: value });
  };

  // Force dark theme setting persisted in MMKV
  const [forceDark, setForceDark] = useMMKVBoolean("forceDark");
  const [crashlyticsEnabled, setCrashlyticsEnabled] = useState(c.isCrashlyticsCollectionEnabled);
  const [experimentalFeed, setExperimentalFeed] =
    useMMKVBoolean("experimentalFeed");

  const handleForceDarkToggle = (v) => {
    // MMKV boolean hook stores true/false; clear not needed.
    setForceDark(v);
    // ThemeProvider reads this MMKV key and will update automatically.
  };

  async function handleCrashlyticsToggle() {
    await setCrashlyticsCollectionEnabled(c, !crashlyticsEnabled)
      .then(() => setCrashlyticsEnabled(c.isCrashlyticsCollectionEnabled));
  }

  return (
    <ScrollView
      overScrollMode="always"
      bounces={true}
      contentContainerStyle={{ paddingTop: getLiquidPlusPadding() }}
    >
      <ItchyText style={s.sectionHeader}>Account</ItchyText>
      <FastSquircleView
        cornerSmoothing={0.6}
        style={[
          s.settingContainer,
          s.topSettingContainer,
          !username && s.bottomSettingContainer,
          username && s.middleSettingContainer,
        ]}
      >
        <ItchyText style={s.settingTitle}>
          {username ? `Signed in as ` : "Signed out"}
          {username && (
            <ItchyText style={{ fontWeight: "bold" }}>{username}</ItchyText>
          )}
        </ItchyText>
        <Chip.Icon
          mode="filled"
          text={username ? "Log Out" : "Log In"}
          icon="key"
          color={username ? "#ff5555" : colors.accent}
          style={{ marginTop: 0 }}
          onPress={() => {
            if (username) {
              ScratchAPIWrapper.auth
                .logout(storage.getString("cookieSet"))
                .then(() => {
                  storage.clearAll();
                  storage.set("hasOpenedBefore", true);
                })
                .catch((e) => {
                  console.error(e);
                  console.error("Proceeding with login anyway.");
                  storage.clearAll();
                });
            } else {
              router.push("/login");
            }
          }}
        />
      </FastSquircleView>
      {username && (
        <FastSquircleView
          cornerSmoothing={0.6}
          style={[s.settingContainer, s.bottomSettingContainer]}
        >
          <TouchableOpacity onPress={() => router.push(`/users/${username}`)}>
            <ItchyText style={{ color: colors.accent, fontSize: 16 }}>
              Open your profile
            </ItchyText>
          </TouchableOpacity>
        </FastSquircleView>
      )}
      <ItchyText style={s.sectionHeader}>Player</ItchyText>
      <FastSquircleView
        cornerSmoothing={0.6}
        style={[
          s.settingContainer,
          s.topSettingContainer,
          s.middleSettingContainer,
        ]}
      >
        <ItchyText style={s.settingTitle}>Frame interpolation</ItchyText>
        <Switch
          thumbColor="white"
          trackColor={{ false: "#686868", true: colors.accent }}
          onValueChange={(v) => setTWConfig({ ...twConfig, interpolate: v })}
          value={twConfig?.interpolate}
        />
      </FastSquircleView>
      <FastSquircleView
        cornerSmoothing={0.6}
        style={[s.settingContainer, s.middleSettingContainer]}
      >
        <ItchyText style={s.settingTitle}>Autoplay</ItchyText>
        <Switch
          thumbColor="white"
          trackColor={{ false: "#686868", true: colors.accent }}
          onValueChange={(v) => setTWConfig({ ...twConfig, autoplay: v })}
          value={twConfig?.autoplay}
        />
      </FastSquircleView>
      <FastSquircleView
        cornerSmoothing={0.6}
        style={[s.settingContainer, s.middleSettingContainer]}
      >
        <ItchyText style={s.settingTitle}>Force 60 FPS</ItchyText>
        <Switch
          thumbColor="white"
          trackColor={{ false: "#686868", true: colors.accent }}
          onValueChange={(v) => setTWConfig({ ...twConfig, fps60: v })}
          value={twConfig?.fps60}
        />
      </FastSquircleView>
      <FastSquircleView
        cornerSmoothing={0.6}
        style={[s.settingContainer, s.middleSettingContainer]}
      >
        <ItchyText style={s.settingTitle}>High-quality pen</ItchyText>
        <Switch
          thumbColor="white"
          trackColor={{ false: "#686868", true: colors.accent }}
          onValueChange={(v) => setTWConfig({ ...twConfig, hqPen: v })}
          value={twConfig?.hqPen}
        />
      </FastSquircleView>
      <FastSquircleView
        cornerSmoothing={0.6}
        style={[s.settingContainer, s.middleSettingContainer]}
      >
        <ItchyText style={s.settingTitle}>Turbo mode</ItchyText>
        <Switch
          thumbColor="white"
          trackColor={{ false: "#686868", true: colors.accent }}
          onValueChange={(v) => setTWConfig({ ...twConfig, turbo: v })}
          value={twConfig?.turbo}
        />
      </FastSquircleView>
      <FastSquircleView
        cornerSmoothing={0.6}
        style={[
          s.settingContainer,
          s.bottomSettingContainer,
          { justifyContent: "flex-start", flexDirection: "row" },
        ]}
      >
        <ItchyText style={{ color: colors.text, fontSize: 12, opacity: 0.6 }}>
          Options provided by{" "}
        </ItchyText>
        <TouchableOpacity
          onPress={() => linkWithFallback("https://turbowarp.org")}
        >
          <ItchyText style={{ color: colors.accent, fontSize: 12 }}>
            TurboWarp
          </ItchyText>
        </TouchableOpacity>
      </FastSquircleView>
      <ItchyText style={s.sectionHeader}>App</ItchyText>
      <FastSquircleView
        cornerSmoothing={0.6}
        style={[
          s.settingContainer,
          s.topSettingContainer,
          s.middleSettingContainer,
        ]}
      >
        <ItchyText style={s.settingTitle}>Experimental feed</ItchyText>
        <Switch
          thumbColor="white"
          trackColor={{ false: "#686868", true: colors.accent }}
          onValueChange={(v) => setExperimentalFeed(v)}
          value={experimentalFeed === true}
        />
      </FastSquircleView>
      <FastSquircleView
        cornerSmoothing={0.6}
        style={[
          s.settingContainer,
          s.middleSettingContainer,
          {
            justifyContent: "flex-start",
            alignItems: "flex-start",
            paddingVertical: 12,
            borderBottomWidth: 0.5,
          },
        ]}
      >
        <ItchyText style={{ color: colors.text, fontSize: 12, opacity: 0.6 }}>
          Displays an "Explore more" button at the bottom of the screen that
          opens an experimental infinite-scrolling feed of projects and studios.
        </ItchyText>
      </FastSquircleView>
      <FastSquircleView
        cornerSmoothing={0.6}
        style={[s.settingContainer, s.middleSettingContainer]}
      >
        <ItchyText style={s.settingTitle}>Force dark theme</ItchyText>
        <Switch
          thumbColor="white"
          trackColor={{ false: "#686868", true: colors.accent }}
          onValueChange={(v) => handleForceDarkToggle(v)}
          value={forceDark === true}
        />
      </FastSquircleView>
      <FastSquircleView
        cornerSmoothing={0.6}
        style={[
          s.settingContainer,
          s.middleSettingContainer,
          {
            justifyContent: "flex-start",
            alignItems: "flex-start",
            paddingVertical: 12,
          },
        ]}
      >
        <ItchyText style={{ color: colors.text, fontSize: 12, opacity: 0.6 }}>
          When enabled, the app will always use the dark theme even if your
          device is set to light mode.
        </ItchyText>
      </FastSquircleView>
      <FastSquircleView
        cornerSmoothing={0.6}
        style={[s.settingContainer, s.middleSettingContainer]}
      >
        <ItchyText style={s.settingTitle}>Crash reports</ItchyText>
        <Switch
          thumbColor="white"
          trackColor={{ false: "#686868", true: colors.accent }}
          onValueChange={() => handleCrashlyticsToggle()}
          value={crashlyticsEnabled === true}
        />
      </FastSquircleView>
      <FastSquircleView
        cornerSmoothing={0.6}
        style={[
          s.settingContainer,
          s.bottomSettingContainer,
          {
            justifyContent: "flex-start",
            alignItems: "flex-start",
            paddingVertical: 12,
          },
        ]}
      >
        <ItchyText style={{ color: colors.text, fontSize: 12, opacity: 0.6 }}>
          Opt in or out of crash reporting.  Reports do not include any information about your Scratch account, and are only sent when Itchy crashes.  This helps us improve the app
        </ItchyText>
      </FastSquircleView>
      <ItchyText style={s.sectionHeader}>About</ItchyText>
      <FastSquircleView
        cornerSmoothing={0.6}
        style={[
          s.settingContainer,
          s.topSettingContainer,
          s.middleSettingContainer,
        ]}
      >
        <ItchyText style={{ color: colors.text, fontSize: 16 }}>
          Itchy v{version}
        </ItchyText>
      </FastSquircleView>
      <FastSquircleView
        cornerSmoothing={0.6}
        style={[s.settingContainer, s.middleSettingContainer]}
      >
        <TouchableOpacity onPress={() => router.push("/onboarding")}>
          <ItchyText style={{ color: colors.accent, fontSize: 16 }}>
            Redo onboarding flow
          </ItchyText>
        </TouchableOpacity>
      </FastSquircleView>
      <FastSquircleView
        cornerSmoothing={0.6}
        style={[s.settingContainer, s.middleSettingContainer]}
      >
        <TouchableOpacity
          onPress={() =>
            linkWithFallback("https://itchy.micahlindley.com/privacy.html")
          }
        >
          <ItchyText style={{ color: colors.accent, fontSize: 16 }}>
            Privacy Policy
          </ItchyText>
        </TouchableOpacity>
      </FastSquircleView>
      <FastSquircleView
        cornerSmoothing={0.6}
        style={[
          s.settingContainer,
          s.bottomSettingContainer,
          {
            justifyContent: "flex-start",
            alignItems: "flex-start",
            flexDirection: "column",
            paddingVertical: 15,
          },
        ]}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <ItchyText style={{ color: colors.text, fontSize: 12, opacity: 0.6 }}>
            Made{" "}
          </ItchyText>
          <TouchableOpacity
            onPress={() =>
              linkWithFallback("https://github.com/micahlt/itchy-native")
            }
          >
            <ItchyText style={{ color: colors.accent, fontSize: 12 }}>
              open source
            </ItchyText>
          </TouchableOpacity>
          <ItchyText style={{ color: colors.text, fontSize: 12, opacity: 0.6 }}>
            {" "}
            with ❤️
          </ItchyText>
        </View>
        <View style={{ flexDirection: "row", paddingTop: 8 }}>
          <ItchyText style={{ color: colors.text, fontSize: 12, opacity: 0.6 }}>
            Created by Micah Lindley. Contributions to code, UI, and graphics
            made by David Noé Bänziger and Sean Wallace. Made possible by open-source
            projects like TurboWarp, Scratch, React Native, Expo, and many
            others.
          </ItchyText>
        </View>
      </FastSquircleView>
      <View style={{ height: 120 }}></View>
    </ScrollView>
  );
}
