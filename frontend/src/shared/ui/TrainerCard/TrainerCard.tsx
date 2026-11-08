import { useState } from "react";

import { Box, Typography } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";

type TrainerCardProps = {
  name: string;
  direction: string;
  image?: string;
  description?: string;
  experience?: string;
  specialization?: string;
};

export const TrainerCard = ({
  name,
  direction,
  image,
  description,
  experience,
  specialization,
}: TrainerCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <Box
      sx={{
        width: "100%",
        height: 380,
        display: "flex",
        flexDirection: "column",
        bgcolor: "#EAF2FD",
        borderRadius: "14px",
        overflow: "hidden",
        transition: "box-shadow 0.3s ease",
        "&:hover": {
          boxShadow: "0 14px 32px rgba(10,36,86,0.14)",
        },
      }}
    >
      {/* Верхние 10% — имя тренера */}
      <Box
        sx={{
          minHeight: 42,
          px: 2,
          display: "flex",
          alignItems: "center",
          bgcolor: "#EAF2FD",
          flexShrink: 0,
        }}
      >
        <Typography
          sx={{
            color: "#0A2456",
            fontSize: 16,
            fontWeight: 800,
            lineHeight: 1.2,
          }}
        >
          {name}
        </Typography>
      </Box>

      {/* Центральная часть — фото / оборот */}
      <Box
        component="button"
        type="button"
        aria-label={`Показать информацию о тренере ${name}`}
        aria-pressed={isFlipped}
        onClick={() => setIsFlipped((previous) => !previous)}
        sx={{
          position: "relative",
          display: "block",
          width: "100%",
          flex: 1,
          border: 0,
          p: 0,
          m: 0,
          cursor: "pointer",
          background: "transparent",
          perspective: "1200px",
          textAlign: "left",
          outline: "none",

          "@media (hover: hover)": {
            "&:hover .trainer-flip-inner": {
              transform: "rotateY(180deg)",
            },
          },
        }}
      >
        <Box
          className="trainer-flip-inner"
          sx={{
            position: "relative",
            width: "100%",
            height: "100%",
            transformStyle: "preserve-3d",
            transition: "transform 2s cubic-bezier(0.22, 1, 0.36, 1)",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Передняя сторона */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              bgcolor: "#DCE7F5",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {image ? (
              <Box
                component="img"
                src={image}
                alt={name}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1.5,
                  color: "#6B819E",
                }}
              >
                <Box
                  sx={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    bgcolor: "#C5D8EF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <PersonIcon
                    sx={{
                      fontSize: 42,
                      color: "#6B819E",
                    }}
                  />
                </Box>

                <Typography
                  sx={{
                    fontSize: 12,
                    color: "#6B819E",
                  }}
                >
                  Фото тренера
                </Typography>
              </Box>
            )}

            <Box
              sx={{
                position: "absolute",
                right: 12,
                bottom: 12,
                bgcolor: "rgba(10,36,86,0.82)",
                color: "#FFFFFF",
                borderRadius: "20px",
                px: 1.5,
                py: 0.7,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Подробнее
            </Box>
          </Box>

          {/* Обратная сторона */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              bgcolor: "#0A2456",
              color: "#FFFFFF",
              boxSizing: "border-box",
              px: 3,
              py: 3,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "flex-start",
              overflowY: "auto",
            }}
          >
            <Typography
              sx={{
                fontSize: 20,
                fontWeight: 800,
                lineHeight: 1.2,
                mb: 1.5,
                width: "100%",
                wordBreak: "break-word",
              }}
            >
              {name}
            </Typography>

            {specialization && (
              <Typography
                sx={{
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: "#BBD5FF",
                  mb: 1.5,
                  width: "100%",
                }}
              >
                {specialization}
              </Typography>
            )}

            {experience && (
              <Typography
                sx={{
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: "#E5EEFF",
                  mb: 1.5,
                  width: "100%",
                }}
              >
                Стаж: {experience}
              </Typography>
            )}

            <Typography
              sx={{
                fontSize: 13,
                lineHeight: 1.7,
                color: "#E5EEFF",
                width: "100%",
                wordBreak: "break-word",
              }}
            >
              {description || "Информация о тренере скоро появится."}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Нижние 10% — направление */}
      <Box
        sx={{
          minHeight: 42,
          px: 2,
          display: "flex",
          alignItems: "center",
          bgcolor: "#0A2456",
          flexShrink: 0,
        }}
      >
        <Typography
          sx={{
            color: "#FFFFFF",
            fontSize: 14,
            fontWeight: 700,
            lineHeight: 1.2,
          }}
        >
          {direction}
        </Typography>
      </Box>
    </Box>
  );
};