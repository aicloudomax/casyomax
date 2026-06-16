import { Alert as RNAlert, Platform } from 'react-native';
import Toast from 'react-native-toast-message';

// Infer a Toast type from the alert title so web snackbars are colored sensibly.
const inferType = (title = '') => {
    if (/error|fail|denied|invalid|incorrect|wrong|unable|not found|missing|limit/i.test(title)) {
        return 'error';
    }
    if (/success|saved|sent|updated|added|removed|deleted|complete/i.test(title)) {
        return 'success';
    }
    return 'info';
};

// Web-safe implementation of RN's Alert.alert.
// React Native Web does not implement Alert.alert (it is a no-op), which means
// success messages never show and any onPress that closes a modal never fires.
// This maps notifications to Toast and confirmations to window.confirm.
const webAlert = (title, message, buttons, _options) => {
    // No buttons, or a single button: it's a notification. Show a snackbar and
    // still fire the button's onPress (often used to close a form / navigate).
    if (!buttons || buttons.length <= 1) {
        Toast.show({
            type: inferType(title),
            text1: title,
            text2: message,
            visibilityTime: 3000,
        });
        buttons?.[0]?.onPress?.();
        return;
    }

    // Multiple buttons: it's a confirmation. window.confirm is blocking and reliable on web.
    const confirmBtn = buttons.find((b) => b.style !== 'cancel') || buttons[buttons.length - 1];
    const cancelBtn = buttons.find((b) => b.style === 'cancel');
    const text = [title, message].filter(Boolean).join('\n\n');

    if (typeof window !== 'undefined' && window.confirm(text)) {
        confirmBtn?.onPress?.();
    } else {
        cancelBtn?.onPress?.();
    }
};

// Drop-in replacement: import { Alert } from '@/services/CrossPlatformAlert'
// and keep every existing Alert.alert(...) call unchanged.
export const Alert = {
    alert: (title, message, buttons, options) => {
        if (Platform.OS === 'web') {
            return webAlert(title, message, buttons, options);
        }
        return RNAlert.alert(title, message, buttons, options);
    },
};

export default Alert;
