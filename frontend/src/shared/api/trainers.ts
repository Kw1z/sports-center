
const API_URL = import.meta.env.VITE_API_URL || "/api";

export type Trainer = {
  id: number;
  display_name: string;
  direction: string;
  specialization: string;
  experience_years: number;
  description: string;
  photo_url: string | null;
};

export const trainersApi = {
  async getAll(): Promise<Trainer[]> {
    let response: Response;

    try {
      response = await fetch(`${API_URL}/trainers`);
    } catch {
      throw new Error("Не удалось подключиться к серверу");
    }

    if (!response.ok) {
      throw new Error("Не удалось загрузить тренеров");
    }

    return response.json() as Promise<Trainer[]>;
  },
};
