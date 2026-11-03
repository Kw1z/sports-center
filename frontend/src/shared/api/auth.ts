
const API_URL = import.meta.env.VITE_API_URL || '/api';

export type User = {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
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

type ApiErrorResponse = {
  detail?: string | { msg: string }[];
};

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  } catch {
    throw new Error('Не удалось подключиться к серверу');
  }

  if (!response.ok) {
    const error: ApiErrorResponse = await response.json().catch(() => ({}));

    const message =
      typeof error.detail === 'string'
        ? error.detail
        : Array.isArray(error.detail)
          ? error.detail.map((item) => item.msg).join(', ')
          : 'Произошла ошибка. Попробуйте ещё раз';

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export const authApi = {
  register(data: RegisterData) {
    return apiRequest<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  login(data: LoginData) {
    return apiRequest<TokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getMe(token: string) {
    return apiRequest<User>('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};
