import { Text as RNText } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

/**
 * Themed text primitive.
 * <AppText variant="title" color="textSecondary">Hello</AppText>
 *
 * variant: key of theme.typography (displayLg, display, titleLg, title, subtitle,
 *          bodyLg, body, label, caption). Default "body".
 * color:   semantic color key (text, textSecondary, textMuted, primary, danger…)
 *          or any raw color string. Default "text".
 * weight:  optional override (regular|medium|semibold|bold|extrabold).
 */
export function AppText({
    variant = 'body',
    color = 'text',
    weight,
    align,
    style,
    children,
    ...rest
}) {
    const { typography, colors, fonts } = useTheme();
    const t = typography[variant] || typography.body;
    const resolvedColor = colors[color] || color;
    const family = weight ? fonts[weight] || t.family : t.family;

    return (
        <RNText
            allowFontScaling
            style={[
                {
                    fontSize: t.fontSize,
                    lineHeight: t.lineHeight,
                    fontFamily: family,
                    color: resolvedColor,
                    textAlign: align,
                },
                style,
            ]}
            {...rest}
        >
            {children}
        </RNText>
    );
}

export default AppText;
