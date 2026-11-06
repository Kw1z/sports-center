
import { Box, Button, Container, Typography } from "@mui/material";

import { Header } from "../../../widgets/header/ui/Header";
import { NextBooking } from "../../../widgets/next-booking/ui/NextBooking";

export const HomePage = () => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      <Header />

      <Box component="main">
        <Container maxWidth="lg" sx={{ py: 5 }}>
          {/* Главный баннер */}
          <Box
            sx={{
              bgcolor: "#0A2456",
              borderRadius: "24px",
              px: { xs: 3, md: 7 },
              py: { xs: 6, md: 9 },
              color: "#FFFFFF",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Декоративный круг */}
            <Box
              sx={{
                position: "absolute",
                width: 340,
                height: 340,
                borderRadius: "50%",
                bgcolor: "rgba(23,107,255,0.16)",
                right: -80,
                top: -120,
                pointerEvents: "none",
              }}
            />

            <Box sx={{ position: "relative", zIndex: 1 }}>
              <Typography
                component="h1"
                sx={{
                  maxWidth: 650,
                  fontSize: { xs: 36, md: 56 },
                  fontWeight: 800,
                  lineHeight: 1.15,
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
                  mt: 3,
                  maxWidth: 520,
                  fontSize: { xs: 16, md: 18 },
                  color: "#D5E4FF",
                  lineHeight: 1.7,
                }}
              >
                Откройте для себя тренировки и услуги спортивного центра
                BluePulse.
              </Typography>

              {/* Кнопки главного баннера */}
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 2,
                  mt: 4,
                }}
              >
                <Button
                  variant="contained"
                  sx={{
                    bgcolor: "#176BFF",
                    px: 4,
                    py: 1.5,
                  }}
                >
                  Выбрать занятие
                </Button>

                <Button
                  variant="outlined"
                  sx={{
                    borderColor: "#FFFFFF",
                    color: "#FFFFFF",
                    px: 4,
                    py: 1.5,
                    "&:hover": {
                      borderColor: "#FFFFFF",
                      bgcolor: "rgba(255,255,255,0.08)",
                    },
                  }}
                >
                  Расписание
                </Button>
              </Box>
            </Box>
          </Box>

          {/* Ближайшая запись авторизованного пользователя */}
          <NextBooking />

          {/* Популярные услуги */}
          <Box sx={{ mt: 7 }}>
            <Typography
              component="h2"
              sx={{
                fontSize: { xs: 26, md: 34 },
                fontWeight: 800,
                color: "text.primary",
                mb: 3,
              }}
            >
              Популярное в BluePulse
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                },
                gap: 3,
              }}
            >
              {[
                {
                  title: "Йога",
                  image: "/images/yoga.jpg",
                },
                {
                  title: "Пилатес",
                  image: "/images/pilates.jpg",
                },
                {
                  title: "Массаж",
                  image: "/images/massazh.jpg",
                },
              ].map((service) => (
                <Box
                  key={service.title}
                  sx={{
                    bgcolor: "background.paper",
                    borderRadius: "17px",
                    overflow: "hidden",
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Box
                    component="img"
                    src={service.image}
                    alt={service.title}
                    sx={{
                      width: "100%",
                      height: 210,
                      objectFit: "cover",
                      display: "block",
                    }}
                  />

                  <Box sx={{ p: 3 }}>
                    <Typography
                      component="h3"
                      sx={{
                        fontSize: 22,
                        fontWeight: 700,
                        color: "text.primary",
                      }}
                    >
                      {service.title}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};
