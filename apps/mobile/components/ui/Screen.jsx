import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';

/**
 * Screen wrapper: themed background + safe area.
 * scroll: render children inside a ScrollView.
 * padded: apply horizontal padding (default true).
 * edges: safe-area edges (default top/bottom/left/right via SafeAreaView default).
 */
export function Screen({
    children,
    scroll = false,
    padded = true,
    edges = ['top', 'left', 'right'],
    background,
    contentContainerStyle,
    style,
    ...rest
}) {
    const { colors, spacing } = useTheme();
    const bg = background || colors.background;
    const pad = padded ? { paddingHorizontal: spacing.lg } : null;

    const Inner = scroll ? ScrollView : View;
    const innerProps = scroll
        ? {
              showsVerticalScrollIndicator: false,
              contentContainerStyle: [pad, { paddingBottom: spacing.xxxl }, contentContainerStyle],
              keyboardShouldPersistTaps: 'handled',
          }
        : { style: [{ flex: 1 }, pad, contentContainerStyle] };

    return (
        <SafeAreaView edges={edges} style={[{ flex: 1, backgroundColor: bg }, style]}>
            <Inner {...innerProps} {...rest}>
                {children}
            </Inner>
        </SafeAreaView>
    );
}

export default Screen;
