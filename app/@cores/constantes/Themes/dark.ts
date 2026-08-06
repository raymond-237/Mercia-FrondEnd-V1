import { colors } from './colors'

export const darkTheme = {
  dark: true,
  colors: {
    background:  colors.darkBg,
    surface:     colors.darkSurface,
    primary:     colors.caramel,
    secondary:   colors.acajou,
    accent:      colors.caramel,
    error:       colors.alerte,
    success:     colors.success,
    'on-primary': colors.darkBg,
    'on-surface': colors.darkText,
    'surface-variant': colors.darkCard,
    'on-surface-variant': colors.darkTextSoft,
    outline:     colors.darkLigne,
  },
  variables: {
    'border-radius-root': '16px',
    'border-color':       colors.darkLigne,
    'font-family':        "'Inter', sans-serif",
  },
}