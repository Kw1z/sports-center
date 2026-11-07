import { Box, Button, Container, Typography } from "@mui/material";

import { Header } from "../../../widgets/header/ui/Header";
import { NextBooking } from "../../../widgets/next-booking/ui/NextBooking";
import { PopularServices } from "../../../widgets/popular-services/ui/PopularServices";

export const HomePage = () => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#F4F8FE",
      }}
    >
      {/* Шапка сайта */}
      <Header />

      <Box component="main">
        <Container
          maxWidth={false}
          sx={{
            maxWidth: "1440px",
            px: { xs: 2, sm: 3, lg: "48px" },
            pt: { xs: 3, lg: "29px" },
            pb: 6,
          }}
        >
          {/* Главный баннер */}
          <Box
            sx={{
              bgcolor: "#0A2456",
              borderRadius: "24px",
              minHeight: { xs: "auto", lg: "448px" },
              px: { xs: 3, md: "41px" },
              py: { xs: 5, lg: 0 },
              position: "relative",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
            }}
          >
            {/* Декоративные круги */}
            <Box
              sx={{
                position: "absolute",
                width: 360,
                height: 360,
                borderRadius: "50%",
                bgcolor: "rgba(23,107,255,0.12)",
                top: 18,
                right: 97,
                pointerEvents: "none",
              }}
            />

            <Box
              sx={{
                position: "absolute",
                width: 245,
                height: 245,
                borderRadius: "50%",
                bgcolor: "rgba(23,107,255,0.10)",
                top: 95,
                right: 109,
                pointerEvents: "none",
              }}
            />

            {/* Содержимое баннера */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  lg: "minmax(0, 740px) 375px",
                },
                gap: { xs: 4, lg: "39px" },
                alignItems: "center",
                position: "relative",
                zIndex: 1,
                width: "100%",
              }}
            >
              {/* Левая часть */}
              <Box>
                <Typography
                  sx={{
                    color: "#8CC3FF",
                    fontSize: 15,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    mb: 3,
                  }}
                >
                  ТВОЙ РИТМ. ТВОЯ ЭНЕРГИЯ.
                </Typography>

                <Typography
                  component="h1"
                  sx={{
                    color: "#FFFFFF",
                    fontSize: {
                      xs: 34,
                      sm: 44,
                      lg: 49,
                    },
                    fontWeight: 800,
                    lineHeight: 1.2,
                    letterSpacing: "-0.03em",
                  }}
                >
                  Больше движения.
                  <Box component="span" sx={{ display: "block" }}>
                    Больше жизни.
                  </Box>
                </Typography>

                <Typography
                  sx={{
                    color: "#D0E2FB",
                    fontSize: { xs: 16, lg: 18 },
                    lineHeight: 1.5,
                    mt: 3,
                    maxWidth: 700,
                  }}
                >
                  Групповые тренировки и забота о себе.
                  <Box component="span" sx={{ display: "block" }}>
                    Выбирай занятие и бронируй место онлайн.
                  </Box>
                </Typography>

                {/* Кнопки */}
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 2,
                    mt: 5,
                  }}
                >
                  <Button
                    variant="contained"
                    sx={{
                      bgcolor: "#176BFF",
                      borderRadius: "12px",
                      minHeight: 51,
                      px: 3,
                      fontWeight: 600,
                      textTransform: "none",
                      "&:hover": {
                        bgcolor: "#0F57D9",
                      },
                    }}
                  >
                    Выбрать занятие →
                  </Button>

                  <Button
                    component="a"
                    href="/about"
                    variant="contained"
                    sx={{
                      bgcolor: "#FFFFFF",
                      color: "#176BFF",
                      borderRadius: "12px",
                      minHeight: 51,
                      px: 3,
                      fontWeight: 600,
                      textTransform: "none",
                      "&:hover": {
                        bgcolor: "#EAF3FF",
                      },
                    }}
                  >
                    Узнать о клубе
                  </Button>
                </Box>
              </Box>

              {/* Ближайшее занятие из backend */}
              <Box
                sx={{
                  width: "100%",
                  maxWidth: 375,
                  justifySelf: {
                    xs: "start",
                    lg: "end",
                  },
                }}
              >
                <NextBooking />
              </Box>
            </Box>
          </Box>

          {/* Популярные услуги из backend */}
          <PopularServices />
        </Container>
      </Box>
    </Box>
  );
};
