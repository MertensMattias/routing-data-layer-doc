// Shared DTOs for API contracts

export interface HealthCheckDto {
  status: string;
  timestamp: string;
  service: string;
}

export interface DatabaseHealthDto {
  status: string;
  database: string;
  timestamp: string;
  error?: string;
}

