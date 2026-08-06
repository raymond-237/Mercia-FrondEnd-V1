import { colors } from './colors'

export const lightTheme = {
  dark: false,
  colors: {
    background:  colors.pageBg,
    surface:     colors.ivoire,
    primary:     colors.espresso,
    secondary:   colors.acajou,
    accent:      colors.caramel,
    error:       colors.alerte,
    success:     colors.success,
    'on-primary': colors.ivoire,
    'on-surface': colors.espresso,
    'surface-variant': colors.lin,
    'on-surface-variant': colors.texteDoux,
    outline:     colors.ligne,
  },
  variables: {
    'border-radius-root': '16px',
    'border-color':       colors.ligne,
    'font-family':        "'Inter', sans-serif",
  },
}