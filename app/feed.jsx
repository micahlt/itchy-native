import { useMMKVString } from "react-native-mmkv";
import APIExplore from "../utils/api-wrapper/explore";
import { useEffect, useState } from "react";
import { ScrollView } from "react-native";
import { useTheme } from "../utils/theme";
import FeedItem from "../components/FeedItem";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getLiquidPlusPadding } from "../utils/platformUtils";

export default function Feed({ }) {
  const { colors } = useTheme();
  const [feed, setFeed] = useState([]);
  const [token] = useMMKVString("token");
  const [username] = useMMKVString("username");
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!token || !username) return;
    APIExplore.getFeed(username, token, 0, 40).then((f) => {
      setFeed(f);
    });
  }, [username, token]);

  return (
    <ScrollView
      collapsable={false}
      style={{ flex: 1 }}
      contentContainerStyle={{
        paddingHorizontal: 15,
        paddingTop: getLiquidPlusPadding(),
        paddingBottom: insets.bottom + 35,
      }}
    >
      {feed.map((item) => (
        <FeedItem
          key={item.id}
          item={item}
          textColor={colors.text}
          backgroundColor={colors.background}
        />
      ))}
    </ScrollView>
  );
}
