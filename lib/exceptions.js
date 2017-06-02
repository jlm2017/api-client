'use strict';

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

class BadRequestError extends ApiError{}
class AuthorizationError extends ApiError{}
class ValidationError extends ApiError{}
class RateLimitedError extends ApiError{}

class ServerError extends ApiError{}

class ClientError extends ApiError{}

module.exports = {
  NetworkError, ApiError, NotFoundError,
  ClientError, BadRequestError, AuthorizationError, ValidationError, RateLimitedError,
  ServerError,
};
