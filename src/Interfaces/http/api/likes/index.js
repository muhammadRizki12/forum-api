import createAuthenticationMiddleware from '../middlewares/authentication.js';
import LikesHandler from './handler.js';
import createLikesRouter from './routes.js';

export default (container) => {
  const likesHandler = new LikesHandler(container);
  const authenticationMiddleware = createAuthenticationMiddleware(container);

  return createLikesRouter(likesHandler, authenticationMiddleware);
};
