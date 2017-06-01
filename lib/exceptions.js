'use strict';

class BaseError {
  constructor(message, meta, details) {
    this.name = 'ApiError';
    this.message = message;
    this.meta = meta;
    this.details = details;
    this.stack = new Error().stack;
  }
}

class NetworkError extends BaseError{}

class ApiError extends BaseError{}

class NotFoundError extends ApiError{}

class ClientError extends ApiError{}

class BadRequestError extends ClientError{}
class AuthorizationError extends ClientError{}
class ValidationError extends ClientError{}
class RateLimitedError extends ClientError{}

class ServerError extends ApiError{}



module.exports = {
  NetworkError, ApiError, NotFoundError,
  ClientError, BadRequestError, AuthorizationError, ValidationError, RateLimitedError,
  ServerError
};
