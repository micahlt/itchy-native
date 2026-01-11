import { View } from "react-native";
import ItchyText from "../components/ItchyText";
import { useTheme } from "../utils/theme";
import { MaterialIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
// @ts-expect-error
import Pressable from "../components/Pressable";

export default function Error() {
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "flex-start",
        backgroundColor: colors.background,
        paddingTop: 30,
      }}
    >
      <MaterialIcons
        name="error-outline"
        size={80}
        color={colors.accent}
        style={{ marginBottom: 20 }}
      />
      <ItchyText
        style={{
          color: colors.accent,
          fontSize: 24,
          fontWeight: "bold",
          textAlign: "center",
          width: "80%",
          marginBottom: 10,
        }}
      >
        Whoops, the app is scratching its head!
      </ItchyText>
      {params.errorText ? (
        <ItchyText style={{ color: colors.textSecondary }}>
          {params.errorText}
        </ItchyText>
      ) : (
        <ItchyText style={{ color: colors.textSecondary }}>
          We ran into an issue. Please try again.
        </ItchyText>
      )}
      <View
        style={{
          borderRadius: 10,
          overflow: "hidden",
          backgroundColor: colors.accent,
          margin: 10,
          elevation: 2,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{ padding: 10, paddingHorizontal: 15 }}
          android_ripple={{
            color: colors.ripple,
            borderless: false,
            foreground: true,
          }}
        >
          <ItchyText
            style={{
              color: colors.text,
              textAlign: "center",
              fontWeight: "bold",
            }}
          >
            Go back
          </ItchyText>
        </Pressable>
      </View>
    </View>
  );
}
