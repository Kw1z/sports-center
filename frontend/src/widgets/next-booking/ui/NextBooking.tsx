
import { useContext, useEffect, useState } from "react";
import { Alert, Box, CircularProgress, Typography } from "@mui/material";

import { AuthContext } from "../../../features/authorization/model/AuthProvider";
import { bookingsApi } from "../../../shared/api/bookings";
import {
  sessionsApi,
  type TrainingSession,
} from "../../../shared/api/sessions";

export const NextBooking = () => {
  const auth = useContext(AuthContext);

  const [session, setSession] = useState<TrainingSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token = auth?.token;

  useEffect(() => {
    if (!token) {
      setSession(null);
      setError("");
      return;
    }

    let cancelled = false;

    const loadNextBooking = async () => {
      setLoading(true);
      setError("");
      setSession(null);

      try {
        const bookings = await bookingsApi.getMyBookings(token);

        // Не учитываем отменённые бронирования
        const activeBookings = bookings.filter(
          (booking) =>
            booking.status !== "cancelled" &&
            booking.cancelled_at === null
        );

        const sessions = await Promise.all(
          activeBookings.map(async (booking) => {
            try {
              return await sessionsApi.getById(booking.session_id);
            } catch {
              return null;
            }
          })
        );

        const now = Date.now();

        const upcoming = sessions
          .filter(
            (item): item is TrainingSession =>
              item !== null &&
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
          setError("Не удалось загрузить ближайшую запись");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadNextBooking();

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (auth?.isLoading) {
    return <CircularProgress size={24} />;
  }

  if (!auth?.isAuthenticated) {
    return null;
  }

  return (
    <Box
      sx={{
        mt: 4,
        p: 3,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
      }}
    >
      <Typography
        component="h2"
        sx={{
          fontSize: 24,
          fontWeight: 700,
          color: "text.primary",
          mb: 2,
        }}
      >
        Ближайшая запись
      </Typography>

      {loading ? (
        <CircularProgress size={24} />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : session ? (
        <Box>
          <Typography sx={{ fontSize: 20, fontWeight: 600 }}>
            {session.service_name}
          </Typography>

          <Typography sx={{ mt: 1, color: "text.secondary" }}>
            {new Date(session.starts_at).toLocaleString("ru-RU", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Typography>

          {session.staff_name && (
            <Typography sx={{ mt: 1, color: "text.secondary" }}>
              Тренер: {session.staff_name}
            </Typography>
          )}

          <Typography sx={{ mt: 1, color: "text.secondary" }}>
            Зал: {session.room_name}
          </Typography>
        </Box>
      ) : (
        <Typography color="text.secondary">
          У вас пока нет предстоящих записей.
        </Typography>
      )}
    </Box>
  );
};
