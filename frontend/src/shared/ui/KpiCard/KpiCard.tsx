import { Box, Typography } from "@mui/material";

type KpiCardProps = {
  label: string;
  value: string;
  footnote?: string;
  /** Синее число — вариант KPI на экране «Сеансы» */
  accent?: boolean;
  sx?: object;
};

// Карточка KPI-показателя (Обзор, Сеансы)
export const KpiCard = ({
  label,
  value,
  footnote,
  accent = false,
  sx,
}: KpiCardProps) => {
  return (
    <Box
      sx={{
        bgcolor: "#FFFFFF",
        borderRadius: accent ? "15px" : "17px",
        p: "19px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        ...sx,
      }}
    >
      <Typography sx={{ color: "#6B819E", fontSize: 14 }}>
        {label}
      </Typography>

      <Typography
        sx={{
          color: accent ? "#176BFF" : "#0A2456",
          fontSize: accent ? 28 : 35,
          fontWeight: 800,
          mt: accent ? "8px" : "12px",
        }}
      >
        {value}
      </Typography>

      {footnote && (
        <Typography
          sx={{
            color: "#176BFF",
            fontSize: 13,
            fontWeight: 500,
            mt: "auto",
            pt: 1,
          }}
        >
          {footnote}
        </Typography>
      )}
    </Box>
  );
};
