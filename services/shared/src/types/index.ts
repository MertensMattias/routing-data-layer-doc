// Common types used across services

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

