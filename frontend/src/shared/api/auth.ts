
const API_URL = import.meta.env.VITE_API_URL || "/api";

export type User = {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  role: string;
};

export type RegisterData = {
  full_name: string;
  email: string;
  password: string;
  phone?: string | null;
};

export type LoginData = {
  email: string;
  password: string;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
};

export type ProfileUpdateData = {
  full_name: string;
  email: string;
  phone: string | null;
};

export type ChangePasswordData = {
  current_password: string;
  new_password: string;
};

type ApiErrorResponse = {
  detail?: string | { msg: string }[];
};

const getErrorMessage = async (response: Response): Promise<string> => {
  const error: ApiErrorResponse = await response
    .json()
    .catch(() => ({}));

  if (typeof error.detail === "string") {
    return error.detail;
  }

  if (Array.isArray(error.detail)) {
    return error.detail.map((item) => item.msg).join(", ");
  }

  if (response.status === 404 || response.status === 405) {
    return "Эта функция пока не поддерживается сервером";
  }

  return "Произошла ошибка. Попробуйте ещё раз";
};

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch {
    throw new Error("Не удалось подключиться к серверу");
  }

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json() as Promise<T>;
}

export const authApi = {
  register(data: RegisterData) {
    return apiRequest<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  login(data: LoginData) {
    return apiRequest<TokenResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getMe(token: string) {
    return apiRequest<User>("/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Изменение имени, email и телефона
  updateMe(token: string, data: ProfileUpdateData) {
    return apiRequest<User>("/auth/me", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  },

  // Изменение пароля
  async changePassword(
    token: string,
    data: ChangePasswordData,
  ): Promise<void> {
    let response: Response;

    try {
      response = await fetch(`${API_URL}/auth/password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
    } catch {
      throw new Error("Не удалось подключиться к серверу");
    }

    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }

    // Успешный ответ может быть 200 или 204 без JSON.
  },
};
