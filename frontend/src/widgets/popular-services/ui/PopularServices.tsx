
import { useEffect, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";

import {
  servicesApi,
  type Service,
} from "../../../shared/api/services";

import {
  sessionsApi,
  type TrainingSession,
} from "../../../shared/api/sessions";

// На frontend храним только выбор популярных направлений
// и пути к изображениям.
// Остальные данные поступают из backend.
const popularCategories = [
  {
    key: "yoga",
    searchName: "йога",
    image: "/images/yoga.jpg",
  },
  {
    key: "pilates",
    searchName: "пилатес",
    image: "/images/pilates.jpg",
  },
  {
    key: "massage",
    searchName: "массаж",
    image: "/images/massazh.jpg",
  },
];

// Находим ближайшее предстоящее занятие определённой услуги
const getNearestSession = (
  sessions: TrainingSession[],
  serviceId: number,
): TrainingSession | undefined => {
  const now = Date.now();

  return sessions
    .filter(
      (session) =>
        session.service_id === serviceId &&
        session.status === "open" &&
        new Date(session.starts_at).getTime() > now,
    )
    .sort(
      (a, b) =>
        new Date(a.starts_at).getTime() -
        new Date(b.starts_at).getTime(),
    )[0];
};

// Отображаем стоимость в нужной валюте
const formatPrice = (
  price: string | number,
  currencyCode: string,
): string => {
  const amount = Number(price);

  if (!Number.isFinite(amount)) {
    return String(price);
  }

  try {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount} ${currencyCode}`;
  }
};

export const PopularServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const [servicesData, sessionsData] = await Promise.all([
          servicesApi.getAll(),
          sessionsApi.getAll(),
        ]);

        if (!cancelled) {
          setServices(servicesData);
          setSessions(sessionsData);
          setError("");
        }
      } catch (err) {
        console.error("Ошибка загрузки популярных услуг:", err);

        if (!cancelled) {
          setError("Не удалось загрузить популярные услуги");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  // Выбираем популярные направления из списка услуг
  const popularServices = popularCategories
    .map((category) => {
      const service = services.find((item) => {
        const name = item.name.toLowerCase();
        const code = item.code.toLowerCase();

        return (
          name.includes(category.searchName) ||
          code.includes(category.key)
        );
      });

      if (!service) {
        return null;
      }

      return {
        ...service,
        image: category.image,
      };
    })
    .filter(
      (service): service is Service & { image: string } =>
        service !== null,
    );

  return (
    <Box
      component="section"
      sx={{
        mt: { xs: 5, lg: "35px" },
        px: { xs: 0, md: 2 },
      }}
    >
      {/* Заголовок раздела */}
      <Typography
        component="h2"
        sx={{
          fontSize: { xs: 26, md: 29 },
          fontWeight: 700,
          color: "#0A2456",
          mb: 1,
        }}
      >
        Популярное в BluePulse
      </Typography>

      <Typography
        sx={{
          fontSize: 16,
          color: "#6B819E",
          mb: "30px",
        }}
      >
        Найди занятие по настроению
      </Typography>

      {/* Загрузка */}
      {loading && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            py: 6,
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {/* Ошибка загрузки */}
      {!loading && error && (
        <Typography color="error">
          {error}
        </Typography>
      )}

      {/* Если услуг нет */}
      {!loading && !error && popularServices.length === 0 && (
        <Typography sx={{ color: "#6B819E" }}>
          Популярные услуги пока не найдены.
        </Typography>
      )}

      {/* Карточки популярных услуг */}
      {!loading && !error && popularServices.length > 0 && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(3, minmax(0, 1fr))",
            },
            gap: "30px",
          }}
        >
          {popularServices.map((service) => {
            const nearestSession = getNearestSession(
              sessions,
              service.id,
            );

            return (
              <Box
                key={service.id}
                sx={{
                  bgcolor: "#FFFFFF",
                  borderRadius: "17px",
                  overflow: "hidden",
                  border: "1px solid #DCE7F3",
                  display: "flex",
                  flexDirection: "column",
                  transition:
                    "transform 0.2s ease, box-shadow 0.2s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow:
                      "0 12px 25px rgba(10,36,86,0.10)",
                  },
                }}
              >
                {/* Фотография */}
                <Box
                  component="img"
                  src={service.image}
                  alt={service.name}
                  sx={{
                    width: "100%",
                    height: 210,
                    objectFit: "cover",
                    display: "block",
                  }}
                />

                {/* Информация об услуге */}
                <Box
                  sx={{
                    p: 3,
                    display: "flex",
                    flexDirection: "column",
                    flexGrow: 1,
                    minHeight: 215,
                  }}
                >
                  {/* Название */}
                  <Typography
                    component="h3"
                    sx={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: "#0A2456",
                      mb: 1,
                    }}
                  >
                    {service.name}
                  </Typography>

                  {/* Описание */}
                  <Typography
                    sx={{
                      fontSize: 14,
                      color: "#6B819E",
                      mb: 2,
                    }}
                  >
                    {service.description ||
                      "Описание скоро появится"}
                  </Typography>

                  {/* Зал — по центру карточки */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1,
                      width: "100%",
                      mb: 2,
                    }}
                  >
                    <LocationOnOutlinedIcon
                      sx={{
                        fontSize: 20,
                        color: "#176BFF",
                        flexShrink: 0,
                      }}
                    />

                    <Typography
                      sx={{
                        fontSize: 14,
                        color: "#6B819E",
                        textAlign: "center",
                      }}
                    >
                      {nearestSession
                        ? `Зал: ${nearestSession.room_name}`
                        : "Нет ближайших занятий"}
                    </Typography>
                  </Box>

                  {/* Разделитель */}
                  <Box
                    sx={{
                      mt: "auto",
                      height: "1px",
                      bgcolor: "#DCE7F3",
                      mb: 2,
                    }}
                  />

                  {/* Продолжительность и цена */}
                  <Typography
                    sx={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#176BFF",
                    }}
                  >
                    {service.duration_minutes} мин ·{" "}
                    {formatPrice(
                      service.price,
                      service.currency_code,
                    )}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};
