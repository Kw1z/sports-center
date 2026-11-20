
import { apiRequest } from "./auth";

// Ключ токена в sessionStorage
const TOKEN_KEY = "bluepulse_token";

// Услуга
export type AdminService = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  booking_type: string;
  duration_minutes: number;
  requires_staff: boolean;
  price: number;
  currency_code: string;
  is_active: boolean;
};

// Помещение
export type AdminRoom = {
  id: number;
  code: string;
  name: string;
  max_capacity: number;
  is_active: boolean;
};

// Сотрудник с данными публичного профиля
export type AdminStaff = {
  id: number;
  user_id: number | null;
  display_name: string;
  position: string;
  is_active: boolean;
  photo_url: string | null;

  code: string | null;
  direction: string | null;
  specialization: string | null;
  experience_years: number | null;
  description: string | null;
};

// Занятие
export type AdminSession = {
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
};

// Бронирование
export type AdminBooking = {
  id: number;
  client_id: number;
  session_id: number;
  service_id: number;
  price_at_booking: number;
  currency_at_booking: string;
  status: string;
  booked_at: string;
  cancelled_at: string | null;
};

// Создание занятия
export type CreateSessionData = {
  service_id: number;
  room_id: number;
  staff_id: number | null;
  starts_at: string;
  ends_at: string;
  capacity: number;
  status: "draft" | "open";
};

// Авторизация администратора
const getAuthHeaders = () => {
  const token = sessionStorage.getItem(TOKEN_KEY);

  if (!token) {
    throw new Error(
      "Требуется вход в аккаунт администратора"
    );
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

// Создание услуги
export type CreateServiceData = {
  code: string;
  name: string;
  description: string | null;
  booking_type: "group" | "individual";
  duration_minutes: number;
  requires_staff: boolean;
  price: number;
  currency_code: string;
};

// Пользователь
export type AdminUser = {
  id: number;
  role_id: number;
  full_name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
};

// Создание и обновление сотрудника
export type CreateStaffData = {
  display_name: string;
  position: string;

  code?: string | null;
  direction?: string | null;
  specialization?: string | null;
  experience_years?: number | null;
  description?: string | null;
};

// Создание аккаунта тренера
export type CreateStaffAccountData = {
  email: string;
  password: string;
};

// Создание помещения
export type CreateRoomData = {
  code: string;
  name: string;
  max_capacity: number;
};

export const adminApi = {
  // ==========================
  // Получение данных
  // ==========================

  getServices: () =>
    apiRequest<AdminService[]>("/admin/services", {
      headers: getAuthHeaders(),
    }),

  getRooms: () =>
    apiRequest<AdminRoom[]>("/admin/rooms", {
      headers: getAuthHeaders(),
    }),

  getStaff: () =>
    apiRequest<AdminStaff[]>("/admin/staff", {
      headers: getAuthHeaders(),
    }),

  getSessions: () =>
    apiRequest<AdminSession[]>("/admin/sessions", {
      headers: getAuthHeaders(),
    }),

  getBookings: () =>
    apiRequest<AdminBooking[]>("/admin/bookings", {
      headers: getAuthHeaders(),
    }),

  // ==========================
  // Занятия
  // ==========================

  createSession: (data: CreateSessionData) =>
    apiRequest<{ id: number }>("/admin/sessions", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }),

  // ==========================
  // Услуги
  // ==========================

  createService: (data: CreateServiceData) =>
    apiRequest<AdminService>("/admin/services", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }),

  updateServicePrice: (
    serviceId: number,
    price: number
  ) =>
    apiRequest<AdminService>(
      `/admin/services/${serviceId}/price`,
      {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ price }),
      }
    ),

  updateServiceStatus: (
    serviceId: number,
    isActive: boolean
  ) =>
    apiRequest<AdminService>(
      `/admin/services/${serviceId}/status`,
      {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_active: isActive }),
      }
    ),

  // ==========================
  // Сотрудники и тренеры
  // ==========================

  // Создание сотрудника с профилем тренера
  createStaff: (data: CreateStaffData) =>
    apiRequest<AdminStaff>("/admin/staff", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }),

  // Обновление информации о сотруднике
  updateStaff: (
    staffId: number,
    data: CreateStaffData
  ) =>
    apiRequest<AdminStaff>(
      `/admin/staff/${staffId}`,
      {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }
    ),

  // Создание аккаунта для входа тренера
  createStaffAccount: (
    staffId: number,
    data: CreateStaffAccountData
  ) =>
    apiRequest<AdminStaff>(
      `/admin/staff/${staffId}/account`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      }
    ),

  // Активность сотрудника
  updateStaffStatus: (
    staffId: number,
    isActive: boolean
  ) =>
    apiRequest<AdminStaff>(
      `/admin/staff/${staffId}/status`,
      {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          is_active: isActive,
        }),
      }
    ),

  // Услуги сотрудника
  getStaffServices: (staffId: number) =>
    apiRequest<AdminService[]>(
      `/admin/staff/${staffId}/services`,
      {
        headers: getAuthHeaders(),
      }
    ),

  assignStaffService: (
    staffId: number,
    serviceId: number
  ) =>
    apiRequest<unknown>(
      `/admin/staff/${staffId}/services`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          service_id: serviceId,
        }),
      }
    ),

  removeStaffService: (
    staffId: number,
    serviceId: number
  ) =>
    apiRequest<unknown>(
      `/admin/staff/${staffId}/services/${serviceId}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      }
    ),

  // ==========================
  // Помещения
  // ==========================

  createRoom: (data: CreateRoomData) =>
    apiRequest<AdminRoom>("/admin/rooms", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }),

  updateRoomName: (
    roomId: number,
    name: string
  ) =>
    apiRequest<AdminRoom>(
      `/admin/rooms/${roomId}`,
      {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name }),
      }
    ),

  updateRoomCapacity: (
    roomId: number,
    capacity: number
  ) =>
    apiRequest<AdminRoom>(
      `/admin/rooms/${roomId}/capacity`,
      {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          max_capacity: capacity,
        }),
      }
    ),

  updateRoomStatus: (
    roomId: number,
    isActive: boolean
  ) =>
    apiRequest<AdminRoom>(
      `/admin/rooms/${roomId}/status`,
      {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          is_active: isActive,
        }),
      }
    ),

  // ==========================
  // Бронирования
  // ==========================

  cancelBooking: (bookingId: number) =>
    apiRequest<AdminBooking>(
      `/admin/bookings/${bookingId}/cancel`,
      {
        method: "PATCH",
        headers: getAuthHeaders(),
      }
    ),

  // ==========================
  // Пользователи
  // ==========================

  getUsers: () =>
    apiRequest<AdminUser[]>("/admin/users", {
      headers: getAuthHeaders(),
    }),

  updateUserStatus: (
    userId: number,
    isActive: boolean
  ) =>
    apiRequest<AdminUser>(
      `/admin/users/${userId}/status`,
      {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          is_active: isActive,
        }),
      }
    ),
};
