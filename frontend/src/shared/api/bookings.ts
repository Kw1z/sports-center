
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

export const bookingsApi = {
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
      throw new Error("Не удалось загрузить записи пользователя");
    }

    return response.json() as Promise<Booking[]>;
  },
};
