import ItchyText from "./ItchyText";
// @ts-expect-error
import Pressable from "./Pressable";
import { useTheme } from "../utils/theme";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import SquircleView from "./SquircleView";
import { Studio } from "../utils/api-wrapper/types/studio";
import { ViewStyle } from "react-native";

interface StudioCardProps {
  studio: Studio;
  width?: number;
  style?: ViewStyle;
}

export default function StudioCard({
  studio,
  width = 250,
  style = {},
}: StudioCardProps) {
  const { colors, dimensions } = useTheme();
  const router = useRouter();
  const openStudio = useCallback(() => {
    router.push(`/studios/${studio.id}`);
  }, [studio]);

  if (!!studio) {
    return (
      <SquircleView
        style={{ width, ...style, borderRadius: 16, overflow: "hidden" }}
      >
        <Pressable
          provider="gesture-handler"
          style={{
            overflow: "hidden",
            borderRadius: 10,
            ...style,
          }}
          android_ripple={{
            borderless: false,
            foreground: true,
            color: colors.ripple,
          }}
          onPress={openStudio}
        >
          <SquircleView
            style={{
              backgroundColor: colors.background,
              borderRadius: 16,
              overflow: "hidden",
              width: width,
              borderColor: colors.outline,
              borderWidth: dimensions.outlineWidth,
            }}
          >
            <Image
              placeholder={require("../assets/project.png")}
              placeholderContentFit="cover"
              source={{
                uri: `https://uploads.scratch.mit.edu/galleries/thumbnails/${studio.id}.png`,
              }}
              style={{ width: width, aspectRatio: "1.7 / 1" }}
              contentFit="fill"
            />
            {studio?.title && studio.title.trim() && (
              <ItchyText
                style={{
                  color: colors.text,
                  padding: 10,
                  paddingBottom: 10,
                  fontWeight: "bold",
                  fontSize: 14,
                }}
                numberOfLines={1}
              >
                {studio.title}
              </ItchyText>
            )}
          </SquircleView>
        </Pressable>
      </SquircleView>
    );
  }
}
