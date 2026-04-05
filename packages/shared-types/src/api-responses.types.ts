// Shared API response shapes used by both frontend and backend

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
}
