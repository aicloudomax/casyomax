import { Platform } from 'react-native';
import * as ExpoSecureStore from 'expo-secure-store';

// Drop-in replacement for `expo-secure-store` that also works on web.
//
// expo-secure-store has no web implementation (its web module is an empty
// object), so any call throws "getValueWithKeyAsync is not a function" in the
// browser. On web we fall back to localStorage; on native we delegate to the
// real secure, encrypted store.
//
// NOTE: localStorage is NOT secure (any script on the page can read it). The
// web fallback is intended for development/testing only — keep real secrets
// on native, or use httpOnly cookies for a secure web auth story.

const isWeb = Platform.OS === 'web';

function hasLocalStorage() {
    return typeof window !== 'undefined' && !!window.localStorage;
}

export async function getItemAsync(key, options) {
    if (isWeb) {
        return hasLocalStorage() ? window.localStorage.getItem(key) : null;
    }
    return ExpoSecureStore.getItemAsync(key, options);
}

export async function setItemAsync(key, value, options) {
    if (isWeb) {
        if (hasLocalStorage()) window.localStorage.setItem(key, value);
        return;
    }
    return ExpoSecureStore.setItemAsync(key, value, options);
}

export async function deleteItemAsync(key, options) {
    if (isWeb) {
        if (hasLocalStorage()) window.localStorage.removeItem(key);
        return;
    }
    return ExpoSecureStore.deleteItemAsync(key, options);
}
