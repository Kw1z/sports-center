
export type Service = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  booking_type: string;
  duration_minutes: number;
  requires_staff: boolean;
  price: string | number;
  currency_code: string;
  is_active: boolean;
};

export const servicesApi = {
  getAll: async (): Promise<Service[]> => {
    const response = await fetch("/api/services");

    if (!response.ok) {
      throw new Error("Не удалось загрузить услуги");
    }

    return response.json();
  },

  getById: async (id: number): Promise<Service> => {
    const response = await fetch(`/api/services/${id}`);

    if (!response.ok) {
      throw new Error("Не удалось загрузить услугу");
    }

    return response.json();
  },
};
