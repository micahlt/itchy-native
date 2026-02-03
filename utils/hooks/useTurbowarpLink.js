import { useEffect, useState } from "react";
import { useTheme } from "../theme";
import { useMMKVObject, useMMKVString } from "react-native-mmkv";

export default function useTurbowarpLink(id) {
    const [link, setLink] = useState(new URL(`https://turbowarp.org/${id}/embed`));
    const [username] = useMMKVString("username");
    const [twConfig] = useMMKVObject("twConfig");
    const { colors, isDark } = useTheme();
    useEffect(() => {
        if (id) {
            const newLink = link;
            newLink.pathname = `/${id}/embed`;
            newLink.searchParams.set("fullscreen-background", colors.background);
            newLink.searchParams.set("settings-button", "true");
            newLink.searchParams.set("addons", "pause")
            if (!!username) {
                newLink.searchParams.set("username", encodeURIComponent(username));
            }
            if (twConfig?.interpolate) {
                newLink.searchParams.set("interpolate", "true");
            }
            if (twConfig?.fps60) {
                newLink.searchParams.set("fps", "60");
            }
            if (twConfig?.hqPen) {
                newLink.searchParams.set("hqpen", "true");
            }
            if (twConfig?.turbo) {
                newLink.searchParams.set("turbo", "true");
            }
            if (twConfig?.autoplay) {
                newLink.searchParams.set("autoplay", "true");
            }
            setLink(newLink);
        }
    }, [id, isDark, username, twConfig]);

    return link.toString();
};