
import {
  Box,
  Button,
  Container,
  Typography,
} from "@mui/material";

import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import FitnessCenterOutlinedIcon from "@mui/icons-material/FitnessCenterOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import { Header } from "../../../widgets/header/ui/Header";

// Информационные блоки страницы
const advantages = [
  {
    title: "Движение для каждого",
    description:
      "Выбирай активные тренировки или спокойные занятия в комфортном темпе.",
    icon: <FitnessCenterOutlinedIcon sx={{ fontSize: 32 }} />,
  },
  {
    title: "Забота о себе",
    description:
      "Уделяй время не только тренировкам, но и восстановлению своего организма.",
    icon: <FavoriteBorderOutlinedIcon sx={{ fontSize: 32 }} />,
  },
  {
    title: "Удобная запись",
    description:
      "Находи подходящее занятие и выбирай удобное время в онлайн-расписании.",
    icon: <EventAvailableOutlinedIcon sx={{ fontSize: 32 }} />,
  },
];

const directions = [
  "Йога",
  "Пилатес",
  "Сайкл",
  "Растяжка",
  "Массаж",
  "Диагностика",
];

export const AboutPage = () => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#F4F8FE",
      }}
    >
      <Header />

      <Box component="main">
        <Container
          maxWidth={false}
          sx={{
            maxWidth: "1440px",
            px: { xs: 2, sm: 3, lg: "48px" },
            pt: { xs: 3, lg: "29px" },
            pb: 8,
          }}
        >
          {/* Главный баннер */}
          <Box
            sx={{
              position: "relative",
              overflow: "hidden",
              minHeight: { xs: 450, md: 480 },
              borderRadius: "24px",
              bgcolor: "#0A2456",
              display: "flex",
              alignItems: "center",
              px: { xs: 3, sm: 5, lg: 7 },
              py: 6,
            }}
          >
            {/* Декоративные круги */}
            <Box
              sx={{
                position: "absolute",
                width: 430,
                height: 430,
                borderRadius: "50%",
                bgcolor: "rgba(23,107,255,0.15)",
                top: -40,
                right: -70,
                pointerEvents: "none",
              }}
            />

            <Box
              sx={{
                position: "absolute",
                width: 280,
                height: 280,
                borderRadius: "50%",
                border: "35px solid rgba(140,195,255,0.12)",
                right: 110,
                top: 110,
                pointerEvents: "none",
              }}
            />

            <Box
              sx={{
                position: "relative",
                zIndex: 1,
                maxWidth: 800,
              }}
            >
              <Typography
                sx={{
                  color: "#8CC3FF",
                  fontWeight: 700,
                  fontSize: 15,
                  letterSpacing: "0.08em",
                  mb: 3,
                }}
              >
                ЗНАКОМЬСЯ С BLUEPULSE
              </Typography>

              <Typography
                component="h1"
                sx={{
                  color: "#FFFFFF",
                  fontSize: {
                    xs: 35,
                    sm: 46,
                    lg: 54,
                  },
                  fontWeight: 800,
                  lineHeight: 1.15,
                  letterSpacing: "-0.03em",
                }}
              >
                Пространство движения.
                <Box
                  component="span"
                  sx={{ display: "block", color: "#8CC3FF" }}
                >
                  Пространство для тебя.
                </Box>
              </Typography>

              <Typography
                sx={{
                  color: "#D0E2FB",
                  fontSize: { xs: 16, md: 18 },
                  lineHeight: 1.7,
                  mt: 3,
                  maxWidth: 650,
                }}
              >
                BluePulse объединяет групповые тренировки,
                восстановление и заботу о себе.
                Здесь можно найти занятие под своё настроение,
                уровень подготовки и привычный ритм жизни.
              </Typography>

              <Button
                component="a"
                href="/schedule"
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                sx={{
                  mt: 4,
                  bgcolor: "#176BFF",
                  color: "#FFFFFF",
                  borderRadius: "12px",
                  px: 3,
                  py: 1.5,
                  fontWeight: 600,
                  textTransform: "none",
                  "&:hover": {
                    bgcolor: "#0F57D9",
                  },
                }}
              >
                Выбрать занятие
              </Button>
            </Box>
          </Box>

          {/* О клубе */}
          <Box
            component="section"
            sx={{
              mt: { xs: 7, md: 9 },
              px: { xs: 0, md: 2 },
            }}
          >
            <Typography
              sx={{
                fontSize: 14,
                color: "#176BFF",
                fontWeight: 700,
                letterSpacing: "0.08em",
                mb: 2,
              }}
            >
              О НАС
            </Typography>

            <Typography
              component="h2"
              sx={{
                fontSize: { xs: 28, md: 36 },
                fontWeight: 800,
                color: "#0A2456",
                mb: 3,
              }}
            >
              Больше, чем просто тренировки
            </Typography>

            <Typography
              sx={{
                fontSize: { xs: 16, md: 18 },
                color: "#6B819E",
                lineHeight: 1.9,
                maxWidth: 1000,
              }}
            >
              Мы верим, что движение должно приносить удовольствие.
              Неважно, хочешь ли ты стать сильнее, улучшить
              гибкость, восстановиться после насыщенного дня
              или просто уделить время себе.
              В BluePulse можно выбрать занятие, которое
              подходит именно тебе.
            </Typography>
          </Box>

          {/* Преимущества */}
          <Box
            component="section"
            sx={{
              mt: 7,
              px: { xs: 0, md: 2 },
            }}
          >
            <Typography
              component="h2"
              sx={{
                fontSize: { xs: 27, md: 32 },
                color: "#0A2456",
                fontWeight: 700,
                mb: 4,
              }}
            >
              Почему BluePulse?
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(3, minmax(0, 1fr))",
                },
                gap: 3,
              }}
            >
              {advantages.map((item) => (
                <Box
                  key={item.title}
                  sx={{
                    bgcolor: "#FFFFFF",
                    border: "1px solid #DCE7F3",
                    borderRadius: "20px",
                    p: 3,
                    minHeight: 230,
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow:
                        "0 12px 25px rgba(10,36,86,0.08)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 65,
                      height: 65,
                      borderRadius: "16px",
                      bgcolor: "#EAF3FF",
                      color: "#176BFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 3,
                    }}
                  >
                    {item.icon}
                  </Box>

                  <Typography
                    component="h3"
                    sx={{
                      fontSize: 21,
                      fontWeight: 700,
                      color: "#0A2456",
                      mb: 1.5,
                    }}
                  >
                    {item.title}
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: 15,
                      color: "#6B819E",
                      lineHeight: 1.7,
                    }}
                  >
                    {item.description}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Направления */}
          <Box
            component="section"
            sx={{
              mt: 8,
              bgcolor: "#E6F0FF",
              borderRadius: "24px",
              p: { xs: 3, md: 5 },
            }}
          >
            <Typography
              sx={{
                fontSize: 14,
                color: "#176BFF",
                fontWeight: 700,
                letterSpacing: "0.08em",
                mb: 2,
              }}
            >
              НАПРАВЛЕНИЯ
            </Typography>

            <Typography
              component="h2"
              sx={{
                fontSize: { xs: 28, md: 34 },
                fontWeight: 800,
                color: "#0A2456",
                mb: 2,
              }}
            >
              Найди занятие по настроению
            </Typography>

            <Typography
              sx={{
                color: "#6B819E",
                fontSize: 16,
                mb: 4,
              }}
            >
              От активных тренировок до спокойных
              восстановительных практик.
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(3, 1fr)",
                },
                gap: 2,
              }}
            >
              {directions.map((direction) => (
                <Box
                  key={direction}
                  sx={{
                    bgcolor: "#FFFFFF",
                    borderRadius: "12px",
                    px: 3,
                    py: 2.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 17,
                      fontWeight: 600,
                      color: "#0A2456",
                    }}
                  >
                    {direction}
                  </Typography>

                  <ArrowForwardIcon
                    sx={{
                      color: "#176BFF",
                      fontSize: 20,
                    }}
                  />
                </Box>
              ))}
            </Box>
          </Box>

          {/* Нижний баннер */}
          <Box
            component="section"
            sx={{
              mt: 8,
              bgcolor: "#0A2456",
              borderRadius: "24px",
              p: { xs: 3, md: 5 },
              display: "flex",
              flexDirection: {
                xs: "column",
                md: "row",
              },
              alignItems: {
                xs: "flex-start",
                md: "center",
              },
              justifyContent: "space-between",
              gap: 3,
            }}
          >
            <Box>
              <Typography
                component="h2"
                sx={{
                  fontSize: { xs: 26, md: 32 },
                  fontWeight: 700,
                  color: "#FFFFFF",
                  mb: 1.5,
                }}
              >
                Начни движение вместе с BluePulse
              </Typography>

              <Typography
                sx={{
                  color: "#D0E2FB",
                  fontSize: 16,
                }}
              >
                Посмотри расписание и выбери удобное время.
              </Typography>
            </Box>

            <Button
              component="a"
              href="/schedule"
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              sx={{
                bgcolor: "#176BFF",
                color: "#FFFFFF",
                borderRadius: "12px",
                px: 3,
                py: 1.5,
                whiteSpace: "nowrap",
                textTransform: "none",
                fontWeight: 600,
                "&:hover": {
                  bgcolor: "#0F57D9",
                },
              }}
            >
              К расписанию
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};
