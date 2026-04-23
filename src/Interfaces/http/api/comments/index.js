import createAuthenticationMiddleware from '../middlewares/authentication.js';
import CommentsHandler from './handler.js';
import createCommentsRouter from './routes.js';

export default (container) => {
  const commentsHandler = new CommentsHandler(container);
  const authenticationMiddleware = createAuthenticationMiddleware(container);

  return createCommentsRouter(commentsHandler, authenticationMiddleware);
};
