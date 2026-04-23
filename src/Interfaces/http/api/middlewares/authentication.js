import AuthenticationError from '../../../../Commons/exceptions/AuthenticationError.js';
import AuthenticationTokenManager from '../../../../Applications/security/AuthenticationTokenManager.js';

const createAuthenticationMiddleware =
  (container) => async (req, res, next) => {
    try {
      const authorizationHeader = req.get('Authorization');

      if (!authorizationHeader) {
        throw new AuthenticationError('Missing authentication');
      }

      const [scheme, token] = authorizationHeader.split(' ');

      if (scheme !== 'Bearer' || !token) {
        throw new AuthenticationError('Missing authentication');
      }

      const authenticationTokenManager = container.getInstance(
        AuthenticationTokenManager.name,
      );
      await authenticationTokenManager.verifyAccessToken(token);
      const { id } = await authenticationTokenManager.decodePayload(token);

      req.auth = {
        credentials: {
          id,
        },
      };

      next();
    } catch (error) {
      next(error);
    }
  };

export default createAuthenticationMiddleware;
