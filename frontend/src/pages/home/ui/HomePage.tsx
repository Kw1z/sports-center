
import { Box, Container, Typography } from '@mui/material';

export const HomePage = () => {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F4F8FE' }}>
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography
          component="h1"
          sx={{
            fontSize: { xs: 32, md: 48 },
            fontWeight: 800,
            color: '#0A2456',
          }}
        >
          Добро пожаловать в BluePulse
        </Typography>

        <Typography
          sx={{
            mt: 2,
            fontSize: 18,
            color: '#6B819E',
          }}
        >
          Спортивный центр для вашего здоровья и активного образа жизни.
        </Typography>
      </Container>
    </Box>
  );
};
