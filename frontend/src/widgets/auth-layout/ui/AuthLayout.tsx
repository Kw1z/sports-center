
import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

type AuthLayoutProps = {
  children: ReactNode;
  title: string;
  description: string;
  showActivityCard?: boolean;
};

export const AuthLayout = ({
  children,
  title,
  description,
  showActivityCard = false,
}: AuthLayoutProps) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        bgcolor: '#F4F8FE',
      }}
    >
      {/* Левая часть */}
      <Box
        sx={{
          width: '46.5%',
          minHeight: '100vh',
          bgcolor: '#0A2456',
          color: '#FFFFFF',
          position: 'relative',
          overflow: 'hidden',
          p: { md: 5, lg: 7 },
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
        }}
      >
        {/* Логотип */}
        <Typography
          sx={{
            fontSize: 26,
            fontWeight: 800,
            zIndex: 1,
          }}
        >
          Blue
          <Box component="span" sx={{ color: '#69A6FF' }}>
            Pulse
          </Box>
        </Typography>

        {/* Декоративные круги */}
        <Box
          sx={{
            position: 'absolute',
            width: 322,
            height: 322,
            borderRadius: '50%',
            bgcolor: '#1B4084',
            top: 112,
            right: -19,
          }}
        />

        <Box
          sx={{
            position: 'absolute',
            width: 192,
            height: 192,
            borderRadius: '50%',
            bgcolor: '#176BFF',
            top: 258,
            right: 33,
          }}
        />

        <Box
          sx={{
            position: 'absolute',
            width: 106,
            height: 106,
            borderRadius: '50%',
            bgcolor: '#2998F5',
            top: 320,
            right: 56,
          }}
        />

        {/* Текст слева */}
        <Box sx={{ mt: 17, zIndex: 1 }}>
          <Typography
            sx={{
              fontSize: { md: 36, lg: 44 },
              fontWeight: 800,
              lineHeight: 1.15,
              maxWidth: 585,
            }}
          >
            {title}
          </Typography>

          <Typography
            sx={{
              mt: 3,
              fontSize: 17,
              color: '#DCE7F3',
              maxWidth: 565,
            }}
          >
            {description}
          </Typography>

          {showActivityCard && (
            <Box
              sx={{
                mt: 12,
                p: 3,
                maxWidth: 510,
                minHeight: 116,
                bgcolor: '#1B4084',
                borderRadius: 3,
              }}
            >
              <Typography sx={{ fontWeight: 600 }}>
                Йога · Пилатес · Массаж
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Правая часть */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          px: { xs: 3, md: 6, lg: 8 },
          py: 5,
        }}
      >
        <Typography
          component={Link}
          to="/"
          sx={{
            color: '#176BFF',
            fontSize: 14,
            fontWeight: 600,
            textAlign: 'right',
            textDecoration: 'none',
            mb: 5,
          }}
        >
          ← На главную
        </Typography>

        <Box
          sx={{
            width: '100%',
            maxWidth: 548,
            mx: 'auto',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};
