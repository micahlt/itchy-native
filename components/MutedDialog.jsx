import React from 'react';
import { View, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../utils/theme';
import ItchyText from './ItchyText';
import SquircleView from './SquircleView';
import Pressable from './Pressable';
import TexturedButton from './TexturedButton';

/**
 * MutedDialog component
 * Displays when a user is muted and cannot post comments
 * @param {boolean} visible - Whether the dialog is visible
 * @param {number} muteExpiresAt - Unix timestamp when the mute expires
 * @param {function} onClose - Callback when the dialog is dismissed
 */
export default function MutedDialog({ visible, muteExpiresAt, onClose }) {
    const { colors } = useTheme();

    const getTimeRemaining = () => {
        if (!muteExpiresAt) return 'an unknown amount of time';

        const now = Date.now() / 1000; // Convert to seconds
        const secondsRemaining = muteExpiresAt - now;

        if (secondsRemaining <= 0) return 'a moment';

        const minutes = Math.floor(secondsRemaining / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days} day${days > 1 ? 's' : ''}`;
        } else if (hours > 0) {
            return `${hours} hour${hours > 1 ? 's' : ''}`;
        } else if (minutes > 0) {
            return `${minutes} minute${minutes > 1 ? 's' : ''}`;
        } else {
            const seconds = Math.floor(secondsRemaining);
            return `${seconds} second${seconds > 1 ? 's' : ''}`;
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View
                style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 40,
                }}
            >
                <SquircleView
                    cornerSmoothing={0.6}
                    style={{
                        backgroundColor: colors.background,
                        borderRadius: 20,
                        padding: 30,
                        width: '100%',
                        maxWidth: 350,
                        borderColor: colors.outline,
                        borderWidth: 1,
                    }}
                >
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 20,
                        }}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <Ionicons name="warning" size={24} color={colors.error || '#FF6B6B'} />
                            <ItchyText
                                style={{
                                    color: colors.text,
                                    fontSize: 18,
                                    fontWeight: 'bold',
                                }}
                            >
                                You're Muted
                            </ItchyText>
                        </View>
                        <Pressable onPress={onClose}>
                            <Ionicons name="close" size={24} color={colors.textSecondary} />
                        </Pressable>
                    </View>

                    <ItchyText
                        style={{
                            color: colors.textSecondary,
                            fontSize: 14,
                            lineHeight: 20,
                            marginBottom: 25,
                        }}
                    >
                        You have broken Scratch community guidelines and cannot post comments at this time.
                        {'\n\n'}
                        You'll be able to chat again in{' '}
                        <ItchyText style={{ fontWeight: 'bold', color: colors.text }}>
                            {getTimeRemaining()}
                        </ItchyText>
                        .
                    </ItchyText>

                    <View style={{ alignSelf: 'flex-end' }}>
                        <TexturedButton onPress={onClose} size={12}>
                            Okay
                        </TexturedButton>
                    </View>
                </SquircleView>
            </View>
        </Modal>
    );
}
