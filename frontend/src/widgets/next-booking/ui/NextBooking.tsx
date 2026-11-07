
import { useEffect, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";

import {
  sessionsApi,
  type TrainingSession,
} from "../../../shared/api/sessions";

export const NextBooking = () => {
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      try {
        const sessions = await sessionsApi.getAll();
        const now = Date.now();

        const upcoming = sessions
          .filter(
            (item) =>
              item.status === "open" &&
              new Date(item.starts_at).getTime() > now
          )
          .sort(
            (a, b) =>
              new Date(a.starts_at).getTime() -
              new Date(b.starts_at).getTime()
          );

        if (!cancelled) {
          setSession(upcoming[0] ?? null);
        }
      } catch {
        if (!cancelled) {
          setError("Не удалось загрузить занятия");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const formattedDate = session
    ? new Date(session.starts_at).toLocaleString("ru-RU", {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: 222,
        bgcolor: "#FFFFFF",
        borderRadius: "19px",
        p: "22px 25px",
        boxSizing: "border-box",
      }}
    >
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          bgcolor: "#E4F8F1",
          color: "#148C75",
          borderRadius: "17px",
          px: 2,
          minHeight: 34,
          mb: 2,
        }}
      >
        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
          ● Ближайшее занятие
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : error ? (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      ) : session ? (
        <>
          <Typography
            sx={{
              color: "#0A2456",
              fontSize: 28,
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            {session.service_name}
          </Typography>

          <Typography
            sx={{
              color: "#6B819E",
              fontSize: 15,
              mt: 1,
            }}
          >
            {formattedDate}
          </Typography>

          <Box
            sx={{
              mt: 2,
              width: "100%",
              height: 7,
              bgcolor: "#EAF3FF",
              borderRadius: 2,
            }}
          />

          <Typography
            sx={{
              mt: 1.5,
              color: "#176BFF",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {session.room_name}
          </Typography>
        </>
      ) : (
        <>
          <Typography
            sx={{
              color: "#0A2456",
              fontSize: 22,
              fontWeight: 700,
              mt: 1,
            }}
          >
            Пока нет занятий
          </Typography>

          <Typography
            sx={{
              color: "#6B819E",
              fontSize: 15,
              mt: 1,
            }}
          >
            Новые занятия скоро появятся.
          </Typography>
        </>
      )}
    </Box>
  );
};
