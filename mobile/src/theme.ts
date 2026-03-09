import { MD3DarkTheme, type MD3Theme } from 'react-native-paper';

const palette = {
  bg0: '#05070B',
  bg1: '#0A0F1A',
  card: '#0E1626',
  card2: '#111C2F',
  primary: '#FF8A00',
  primary2: '#FFC857',
  text: '#F5F7FF',
  muted: '#B9C2D6',
  danger: '#FF4D4D',
};

export const appTheme: MD3Theme = {
  ...MD3DarkTheme,
  dark: true,
  colors: {
    ...MD3DarkTheme.colors,
    primary: palette.primary,
    secondary: palette.primary2,
    background: palette.bg0,
    surface: palette.bg1,
    surfaceVariant: palette.card,
    onPrimary: '#101010',
    onSecondary: '#101010',
    onBackground: palette.text,
    onSurface: palette.text,
    onSurfaceVariant: palette.muted,
    outline: 'rgba(255,255,255,0.16)',
    error: palette.danger,
  },
};

export const colors = palette;

