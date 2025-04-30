import React, { useEffect, useRef } from 'react';
import BottomSheet from '@devvie/bottom-sheet';
import { Text } from 'react-native';
import { useTheme } from '../utils/theme';
import { useMMKVObject, useMMKVString } from 'react-native-mmkv';

export default function CommentOptionSheet({ comment, context }) {
    const { colors } = useTheme();
    const [user] = useMMKVObject("user");
    const [csrf] = useMMKVString("csrfToken");
    const sheetRef = useRef(null);
    useEffect(() => {
        if (!!comment) {
            sheetRef.current?.open()
            return;
        } else {
            sheetRef.current?.close()
        }
    }, [comment])

    if (!comment) return null;

    return (
        <BottomSheet ref={sheetRef} style={{ backgroundColor: colors.backgroundSecondary }}>
            <Text style={{ color: colors.text, padding: 20, fontSize: 16 }}>
                {comment?.content}
            </Text>
        </BottomSheet>
    );
};