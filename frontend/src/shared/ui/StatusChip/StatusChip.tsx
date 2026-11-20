import { Box, Typography } from "@mui/material";

type StatusChipProps = {
  label: string;
  /** open — «Открыт» (зелёный), busy — «Занят» (тёмный) */
  variant: "open" | "busy";
};

// Чип статуса сеанса в таблицах админ-панели
export const StatusChip = ({ label, variant }: StatusChipProps) => {
  const isOpen = variant === "open";

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 34,
        px: "20px",
        borderRadius: "17px",
        bgcolor: isOpen ? "#E4F8F1" : "#0A2456",
      }}
    >
      <Typography
        sx={{
          color: isOpen ? "#148C75" : "#FFFFFF",
          fontSize: 13,
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </Typography>
    </Box>
  );
};
