// Shared error creator (no Express dependency)
export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function createError(statusCode: number, message: string, code?: string): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}
