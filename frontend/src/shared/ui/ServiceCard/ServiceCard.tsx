
import { Box, Typography } from "@mui/material";
import { Link } from "react-router-dom";

import type { Service } from "../../api/services";

type ServiceCardProps = {
  service: Service;
  variant?: "catalog" | "featured";
  roomName?: string;
};

const getServiceKey = (service: Service): string => {
  const value = `${service.name} ${service.code}`.toLowerCase();

  if (/йога|yoga/.test(value)) return "yoga";
  if (/пилатес|pilates/.test(value)) return "pilates";
  if (/сайкл|cycling|cycle|spin/.test(value)) return "cycling";
  if (/растяж|stretch/.test(value)) return "stretching";
  if (/массаж|massage/.test(value)) return "massage";
  if (/диагност|diagnos/.test(value)) return "diagnostics";

  return "other";
};

const serviceImages: Record<string, string> = {
  yoga: "/images/yoga.jpg",
  pilates: "/images/pilates.jpg",
  cycling: "/images/cycling.jpg",
  stretching: "/images/stretching.jpg",
  massage: "/images/massazh.jpg",
  diagnostics: "/images/diagnostics.jpg",
};

// Общая вместимость из макета Figma.
// Это НЕ количество свободных мест на конкретный сеанс.
const groupCapacity: Record<string, number> = {
  yoga: 13,
  pilates: 8,
  cycling: 6,
  stretching: 9,
};

const formatPrice = (service: Service): string => {
  const price = Number(service.price);

  if (!Number.isFinite(price)) {
    return `${service.price} ${service.currency_code}`;
  }

  try {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: service.currency_code,
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${price} ${service.currency_code}`;
  }
};

export const ServiceCard = ({
  service,
  variant = "catalog",
  roomName,
}: ServiceCardProps) => {
  const key = getServiceKey(service);
  const image = serviceImages[key];

  const isGroup =
    key in groupCapacity || service.booking_type === "group";

  const capacity = groupCapacity[key];

  const isFeatured = variant === "featured";

  return (
    <Box
      component={Link}
      to="/schedule"
      sx={{
        display: "flex",
        flexDirection: "column",
        bgcolor: "#FFFFFF",
        borderRadius: "13px",
        overflow: "hidden",
        textDecoration: "none",
        color: "inherit",
        minHeight: isFeatured ? 350 : 155,
        p: isFeatured ? 0 : 1.4,
        border: "1px solid transparent",
        transition:
          "transform 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: "0 8px 24px rgba(10,36,86,0.10)",
          borderColor: "#DCE7F3",
        },
      }}
    >
      {isFeatured ? (
        // Вариант карточки для главной страницы
        <>
          <Box
            sx={{
              height: 170,
              bgcolor: "#DCEBFF",
              overflow: "hidden",
            }}
          >
            {image && (
              <Box
                component="img"
                src={image}
                alt={service.name}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            )}
          </Box>

          <Box
            sx={{
              p: 2.5,
              display: "flex",
              flexDirection: "column",
              flexGrow: 1,
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <Typography
              component="h3"
              sx={{
                color: "#0A2456",
                fontSize: 19,
                fontWeight: 800,
                mb: 1,
              }}
            >
              {service.name}
            </Typography>

            <Typography
              sx={{
                color: "#6B819E",
                fontSize: 12,
                mb: 1,
              }}
            >
              {service.description}
            </Typography>

            {roomName && (
              <Typography
                sx={{
                  color: "#6B819E",
                  fontSize: 12,
                  mb: 2,
                }}
              >
                Зал: {roomName}
              </Typography>
            )}

            <Box sx={{ flexGrow: 1 }} />

            <Typography
              sx={{
                borderTop: "1px solid #DCE7F3",
                width: "100%",
                pt: 2,
                mt: 2,
                fontSize: 15,
                fontWeight: 800,
                color: "#176BFF",
              }}
            >
              {service.duration_minutes} мин · {formatPrice(service)}
            </Typography>
          </Box>
        </>
      ) : (
        // Компактная карточка каталога по Figma
        <>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 1.7,
              flexGrow: 1,
            }}
          >
            <Box
              sx={{
                width: 82,
                height: 82,
                flexShrink: 0,
                borderRadius: "12px",
                bgcolor: "#DCEBFF",
                overflow: "hidden",
              }}
            >
              {image && (
                <Box
                  component="img"
                  src={image}
                  alt={service.name}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              )}
            </Box>

            <Box
              sx={{
                flex: 1,
                minWidth: 0,
                pt: 0.4,
              }}
            >
              <Typography
                component="h2"
                sx={{
                  color: "#0A2456",
                  fontSize: 18,
                  fontWeight: 800,
                  mb: 0.6,
                  lineHeight: 1.25,
                }}
              >
                {service.name}
              </Typography>

              <Typography
                sx={{
                  color: "#6B819E",
                  fontSize: 11,
                  mb: 1,
                }}
              >
                {isGroup ? "Группа" : "Услуга"} ·{" "}
                {service.duration_minutes} мин
              </Typography>

              <Typography
                sx={{
                  color: "#6B819E",
                  fontSize: 11,
                  lineHeight: 1.55,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {service.description ||
                  "Описание направления скоро появится."}
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              mt: 2.3,
              px: 0.5,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Typography
              sx={{
                color: "#176BFF",
                fontSize: 20,
                fontWeight: 800,
                whiteSpace: "nowrap",
              }}
            >
              {formatPrice(service)}
            </Typography>

            <Box
              sx={{
                bgcolor: "#E8F1FE",
                color: "#176BFF",
                borderRadius: "30px",
                minWidth: 100,
                px: 1.2,
                py: 0.7,
                fontSize: 11,
                fontWeight: 700,
                textAlign: "center",
                whiteSpace: "nowrap",
              }}
            >
              {capacity !== undefined
                ? `${capacity} мест`
                : isGroup
                  ? "Групповое"
                  : "По времени"}
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};
