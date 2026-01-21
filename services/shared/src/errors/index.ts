// Shared error types

export class ApiException extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public error?: string,
  ) {
    super(message);
    this.name = 'ApiException';
  }
}

export class ValidationException extends ApiException {
  constructor(message: string, public errors?: any[]) {
    super(400, message, 'Validation Error');
    this.name = 'ValidationException';
  }
}

export class NotFoundException extends ApiException {
  constructor(resource: string) {
    super(404, `${resource} not found`, 'Not Found');
    this.name = 'NotFoundException';
  }
}

