import { vi } from 'vitest';
import createAuthenticationMiddleware from '../authentication.js';
import AuthenticationTokenManager from '../../../../../Applications/security/AuthenticationTokenManager.js';
import AuthenticationError from '../../../../../Commons/exceptions/AuthenticationError.js';

describe('createAuthenticationMiddleware', () => {
  it('should call next with AuthenticationError when authorization scheme is invalid', async () => {
    // Arrange
    const container = {
      getInstance: vi.fn(),
    };
    const middleware = createAuthenticationMiddleware(container);
    const req = {
      get: vi.fn().mockImplementation(() => 'Basic token-123'),
    };
    const next = vi.fn();

    // Action
    await middleware(req, {}, next);

    // Assert
    expect(container.getInstance).not.toBeCalled();
    expect(next).toBeCalledWith(expect.any(AuthenticationError));
  });

  it('should call next with AuthenticationError when bearer token is missing', async () => {
    // Arrange
    const container = {
      getInstance: vi.fn(),
    };
    const middleware = createAuthenticationMiddleware(container);
    const req = {
      get: vi.fn().mockImplementation(() => 'Bearer'),
    };
    const next = vi.fn();

    // Action
    await middleware(req, {}, next);

    // Assert
    expect(container.getInstance).not.toBeCalled();
    expect(next).toBeCalledWith(expect.any(AuthenticationError));
  });

  it('should set request auth credentials and call next without error for valid token', async () => {
    // Arrange
    const authenticationTokenManager = {
      verifyAccessToken: vi.fn().mockImplementation(() => Promise.resolve()),
      decodePayload: vi
        .fn()
        .mockImplementation(() => Promise.resolve({ id: 'user-123' })),
    };
    const container = {
      getInstance: vi.fn().mockImplementation((name) => {
        if (name === AuthenticationTokenManager.name) {
          return authenticationTokenManager;
        }
        return null;
      }),
    };
    const middleware = createAuthenticationMiddleware(container);
    const req = {
      get: vi.fn().mockImplementation(() => 'Bearer token-123'),
    };
    const next = vi.fn();

    // Action
    await middleware(req, {}, next);

    // Assert
    expect(authenticationTokenManager.verifyAccessToken).toBeCalledWith(
      'token-123',
    );
    expect(authenticationTokenManager.decodePayload).toBeCalledWith(
      'token-123',
    );
    expect(req.auth.credentials.id).toEqual('user-123');
    expect(next).toBeCalledWith();
  });
});
