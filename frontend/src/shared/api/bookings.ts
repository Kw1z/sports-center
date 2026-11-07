
const API_URL = import.meta.env.VITE_API_URL || "/api";

// Тип данных бронирования, получаемый от backend
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

// Данные для создания бронирования
export type BookingCreate = {
  session_id: number;
};

// Получаем сообщение об ошибке от backend
const getErrorMessage = async (
  response: Response,
  fallback: string,
): Promise<string> => {
  try {
    const data: unknown = await response.json();

    if (
      typeof data === "object" &&
      data !== null &&
      "detail" in data &&
      typeof data.detail === "string"
    ) {
      return data.detail;
    }
  } catch {
    // Сервер вернул ответ не в формате JSON
  }

  return fallback;
};

export const bookingsApi = {
  // 1. Получить все бронирования текущего пользователя
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

  // 2. Создать бронирование на тренировку
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

  // 3. Отменить бронирование
  cancelBooking: async (
    bookingId: number,
    token: string,
  ): Promise<Booking> => {
    let response: Response;

    try {
      response = await fetch(
        `${API_URL}/bookings/${bookingId}/cancel`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
    } catch {
      throw new Error("Не удалось подключиться к серверу");
    }

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(
          response,
          "Не удалось отменить бронирование",
        ),
      );
    }

    return response.json() as Promise<Booking>;
  },
};
