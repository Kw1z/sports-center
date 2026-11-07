
const API_URL = import.meta.env.VITE_API_URL || "/api";

export type Booking = {
  id: number;
  client_id: number;
  session_id: number;
  service_id: number;
  price_at_booking: string;
  currency_at_booking: string;
  status: string;
  booked_at: string;
  cancelled_at: string | null;
};

export type BookingCreate = {
  session_id: number;
};

// Получаем текст ошибки от backend
const getErrorMessage = async (
  response: Response,
  fallback: string,
): Promise<string> => {
  try {
    const data = await response.json();

    if (typeof data.detail === "string") {
      return data.detail;
    }
  } catch {
    // Если сервер вернул ответ не в формате JSON
  }

  return fallback;
};

export const bookingsApi = {
  // Получить мои записи
  getMyBookings: async (token: string): Promise<Booking[]> => {
    let response: Response;

    try {
      response = await fetch(`${API_URL}/bookings/my`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      throw new Error("Не удалось подключиться к серверу");
    }

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(
          response,
          "Не удалось загрузить записи пользователя",
        ),
      );
    }

    return response.json() as Promise<Booking[]>;
  },

  // Создать запись на занятие
  createBooking: async (
    sessionId: number,
    token: string,
  ): Promise<Booking> => {
    let response: Response;

    try {
      response = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          session_id: sessionId,
        } satisfies BookingCreate),
      });
    } catch {
      throw new Error("Не удалось подключиться к серверу");
    }

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(
          response,
          "Не удалось записаться на занятие",
        ),
      );
    }

    return response.json() as Promise<Booking>;
  },
};
