export type ApiResponse<T = unknown> = {
  success?: boolean;
  message?: string;
  data?: T;
  msLeft?: number;
  remainingAttempts?: number;
  canResend?: boolean;
  [key: string]: unknown;
};

export const parseJsonResponse = async <T>(
  response: Response,
): Promise<T | null> => {
  const raw = await response.text();

  if (!raw.trim()) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};