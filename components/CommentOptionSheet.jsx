import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import BottomSheet from '@devvie/bottom-sheet';
import { Text, View } from 'react-native';
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from '../utils/theme';
import { useMMKVObject, useMMKVString } from 'react-native-mmkv';
import Comment from './Comment';
import Pressable from './Pressable'
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import linkWithFallback from '../utils/linkWithFallback';
import ScratchAPIWrapper from '../utils/api-wrapper';

export default function CommentOptionSheet({ comment, context, setComment = () => { }, onDeleteCommentID = () => { } }) {
    const { colors } = useTheme();
    const [user] = useMMKVObject("user");
    const [csrf] = useMMKVString("csrfToken");
    const sheetRef = useRef(null);
    const [sheetHeight, setSheetHeight] = useState(0);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (!!comment) {
            sheetRef.current?.open()
            return;
        } else {
            sheetRef.current?.close()
        }
    }, [comment])

    const onViewLayout = (e) => {
        setSheetHeight(e.nativeEvent.layout.height);
    }

    const canDelete = useMemo(() => {
        if (!user || !comment) return false;
        if (user.username === comment.author.username && context.type != "studio") return true;
        if (context.type === "user" && user.username === context.owner) return true;
        if (context.type === "project" && user.username === context.owner) return true;
    }, [user, comment, csrf]);

    const openOnScratch = useCallback(() => {
        switch (context.type) {
            case "user":
                linkWithFallback(`https://scratch.mit.edu/users/${context.owner}#${comment.id}`, colors.accent);
                break;
            case "project":
                linkWithFallback(`https://scratch.mit.edu/projects/${context.projectID}/comments#comments-${comment.id}`, colors.accent);
                break;
            case "studio":
                linkWithFallback(`https://scratch.mit.edu/studios/${context.studioID}/comments#comments-${comment.id}`, colors.accent);
                break;
        }
    }, [comment]);

    const deleteComment = useCallback(() => {
        switch (context.type) {
            case "user":
                ScratchAPIWrapper.user.deleteComment(user.name, comment.id.split("comments-")[1], csrf, user.token).then((res) => {
                    onDeleteCommentID(comment);
                    setComment(undefined);
                }).catch(console.error);
                break;
            case "project":
                ScratchAPIWrapper.project.deleteComment(context.projectID, comment.id, csrf, user.token).then(() => {
                    onDeleteCommentID(comment);
                    setComment(undefined);
                }).catch(console.error);
                break;
            case "studio":
                ScratchAPIWrapper.studio.deleteComment(context.studioID, comment.id, csrf, user.token).then((r) => {
                    console.log(r);
                    onDeleteCommentID(comment);
                    setComment(undefined);
                }).catch(console.error);
                break;
        }
    }, [comment, csrf, user]);

    if (!comment) return null;

    return (
        <BottomSheet ref={sheetRef} style={{
            backgroundColor: colors.backgroundSecondary, borderTopLeftRadius: 10, borderTopRightRadius: 10,
        }} backdropMaskColor="#000000aa" height={sheetHeight + insets.bottom + 50} onClose={() => setComment(undefined)} onOpen={() => setComment(comment)}>
            <View onLayout={onViewLayout}>
                <Text style={{ color: colors.text, fontSize: 22, fontWeight: 'bold', marginBottom: 10, paddingHorizontal: 15 }}>Comment</Text>
                <View style={{ paddingHorizontal: 5 }}><Comment comment={comment} showReplies={false} isReply={false} fullWidth={true} /></View>
                {canDelete && <Pressable android_ripple={{ color: "#ffffff22", borderless: false, foreground: true }} onPress={deleteComment} style={{
                    paddingHorizontal: 20, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 10, borderColor: colors.backgroundTertiary,
                    borderBottomWidth: 0.5,
                    borderTopWidth: 0.5
                }}>
                    <MaterialIcons name="delete" color={colors.accent} size={22} /><Text style={{ color: colors.accent, fontSize: 16 }}>Delete</Text>
                </Pressable>}
                <Pressable android_ripple={{ color: "#ffffff22", borderless: false, foreground: true }} onPress={openOnScratch} style={{
                    paddingHorizontal: 20, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 10, borderColor: colors.backgroundTertiary,
                    borderBottomWidth: 0.5,
                    borderTopWidth: 0.5
                }}>
                    <MaterialIcons name="exit-to-app" color={colors.accent} size={22} /><Text style={{ color: colors.accent, fontSize: 16 }}>Open on Scratch</Text>
                </Pressable>
                <Pressable android_ripple={{ color: "#ffffff22", borderless: false, foreground: true }} onPress={openOnScratch} style={{
                    paddingHorizontal: 20, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 10, borderColor: colors.backgroundTertiary,
                    borderBottomWidth: 0.5,
                    borderTopWidth: 0.5
                }}>
                    <MaterialIcons name="flag" color={colors.accent} size={22} /><Text style={{ color: colors.accent, fontSize: 16 }}>Report comment</Text>
                </Pressable>
            </View>
        </BottomSheet >
    );
};