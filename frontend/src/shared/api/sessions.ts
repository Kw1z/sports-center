
export type TrainingSession = {
  id: number;
  service_id: number;
  service_name: string;
  room_id: number;
  room_name: string;
  staff_id: number | null;
  staff_name: string | null;
  starts_at: string;
  ends_at: string;
  capacity: number;
  status: string;

  // Данные о заполненности из backend
  booked_count: number | null;
  available_spots: number | null;
};

export const sessionsApi = {
  getAll: async (): Promise<TrainingSession[]> => {
    const response = await fetch("/api/sessions", {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Не удалось загрузить расписание");
    }

    return response.json();
  },

  getById: async (id: number): Promise<TrainingSession> => {
    const response = await fetch(`/api/sessions/${id}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Не удалось загрузить занятие");
    }

    return response.json();
  },
};
