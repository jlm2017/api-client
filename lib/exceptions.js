class BaseError {
  constructor(message, meta) {
    this.name = 'ApiError';
    this.message = message;
    this.meta = meta;
    this.stack = new Error().stack;
  }
}

class NetworkError extends BaseError{}
class ApiError extends BaseError{}
class NotFoundError extends ApiError{}
class AuthorizationError extends ApiError{}
class ValidationError extends ApiError{}
class RateLimitedError extends ApiError{}
class UnknownServerError extends ApiError{}
class UnknownClientError extends ApiError{}

module.exports = {
  NetworkError, ApiError, NotFoundError, AuthorizationError, ValidationError, RateLimitedError, UnknownServerError,
  UnknownClientError
};
