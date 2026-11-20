
import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Typography,
} from "@mui/material";

import { Header } from "../../../widgets/header/ui/Header";
import { TrainerCard } from "../../../shared/ui/TrainerCard/TrainerCard";

import {
  trainersApi,
  type Trainer,
} from "../../../shared/api/trainers";

export const TrainersPage = () => {
  // Список тренеров из backend
  const [trainers, setTrainers] = useState<Trainer[]>([]);

  // Состояния загрузки
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // Получение тренеров из базы данных
  useEffect(() => {
    let cancelled = false;

    const loadTrainers = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await trainersApi.getAll();

        if (!cancelled) {
          setTrainers(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Не удалось загрузить тренеров",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadTrainers();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#F3F7FD",
      }}
    >
      <Header />

      <Container
        component="main"
        maxWidth={false}
        sx={{
          maxWidth: "1440px",
          px: { xs: 2, sm: 3, md: 5.5 },
          pt: { xs: 3, md: 3.5 },
          pb: 8,
        }}
      >
        {/* Заголовок */}
        <Box sx={{ mb: 4 }}>
          <Typography
            sx={{
              color: "#176BFF",
              fontSize: 11,
              fontWeight: 800,
              mb: 1.4,
            }}
          >
            КОМАНДА BLUEPULSE
          </Typography>

          <Typography
            component="h1"
            sx={{
              color: "#0A2456",
              fontSize: { xs: 29, md: 32 },
              fontWeight: 800,
              letterSpacing: "-0.035em",
              mb: 1,
            }}
          >
            Наши тренеры
          </Typography>

          <Typography
            sx={{
              color: "#6B819E",
              fontSize: 13,
              lineHeight: 1.7,
            }}
          >
            Познакомьтесь со специалистами нашего клуба.
            Наведите на карточку или нажмите на неё,
            чтобы узнать больше.
          </Typography>
        </Box>

        {/* Загрузка данных */}
        {loading && (
          <Box
            sx={{
              minHeight: 260,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <CircularProgress />
          </Box>
        )}

        {/* Ошибка загрузки */}
        {!loading && error && (
          <Alert
            severity="error"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => setReloadKey((value) => value + 1)}
                sx={{ textTransform: "none" }}
              >
                Повторить
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {/* Нет тренеров */}
        {!loading && !error && trainers.length === 0 && (
          <Box
            sx={{
              bgcolor: "#FFFFFF",
              border: "1px solid #DCE7F3",
              borderRadius: "16px",
              textAlign: "center",
              py: 8,
              px: 3,
            }}
          >
            <Typography
              sx={{
                color: "#0A2456",
                fontSize: 22,
                fontWeight: 700,
                mb: 1,
              }}
            >
              Тренеры пока не добавлены
            </Typography>

            <Typography sx={{ color: "#6B819E" }}>
              Информация о специалистах клуба скоро появится.
            </Typography>
          </Box>
        )}

        {/* Карточки настоящих тренеров */}
        {!loading && !error && trainers.length > 0 && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                lg: "repeat(3, minmax(0, 1fr))",
              },
              gap: { xs: 2, md: 2.5 },
            }}
          >
            {trainers.map((trainer) => (
              <TrainerCard
                key={trainer.id}
                name={trainer.display_name}
                direction={trainer.direction}
                specialization={trainer.specialization}
                experience={`${trainer.experience_years} лет`}
                description={trainer.description}
                image={trainer.photo_url ?? undefined}
              />
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
};
