
import { createTheme } from '@mui/material/styles';

// Глобальная тема сайта BluePulse
export const theme = createTheme({
  // Цветовая палитра
  palette: {
    mode: 'light',

    primary: {
      main: '#176BFF',
      light: '#EAF3FF',
      dark: '#0A2456',
      contrastText: '#FFFFFF',
    },

    success: {
      main: '#148C75',
    },

    background: {
      default: '#F4F8FE',
      paper: '#FFFFFF',
    },

    text: {
      primary: '#0A2456',
      secondary: '#6B819E',
    },

    divider: '#DCE7F3',
  },

  // Шрифт сайта
  typography: {
    fontFamily: '"Inter", Arial, sans-serif',
  },

  // Общие скругления
  shape: {
    borderRadius: 12,
  },

  // Настройки компонентов Material UI
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 17,
        },
      },
    },
  },
});


//! palette.primary	Фирменные синие цвета
//! palette.success	Цвет положительных статусов
//! background.default	Фон всего сайта
//! background.paper	Фон карточек и форм
//! text.primary	Основной цвет текста
//! text.secondary	Цвет второстепенного текста
//! divider	Цвет разделителей
//! typography	Общий шрифт Inter
//! shape.borderRadius	Стандартное скругление 12 px
//! components	Глобальные настройки кнопок и карточек