const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpData {
  email: string;
  password: string;
  username?: string;
}

export interface AuthResponse {
  token?: string;
  user?: {
    id: number;
    email: string;
    username: string;
  };
  message?: string;
}

export interface ApiError {
  message: string;
  status?: number;
}

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.message || "Login failed");
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw { message: error.message };
    }
    throw { message: "An unexpected error occurred" };
  }
}

export async function signUp(data: SignUpData): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const dataResponse = await response.json();

    if (!response.ok) {
      throw new Error(dataResponse.detail || dataResponse.message || "Sign up failed");
    }

    return dataResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw { message: error.message };
    }
    throw { message: "An unexpected error occurred" };
  }
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.message || "Failed to send reset email");
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw { message: error.message };
    }
    throw { message: "An unexpected error occurred" };
  }
}

