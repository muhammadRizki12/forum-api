import createAuthenticationMiddleware from '../middlewares/authentication.js';
import RepliesHandler from './handler.js';
import createRepliesRouter from './routes.js';

export default (container) => {
  const repliesHandler = new RepliesHandler(container);
  const authenticationMiddleware = createAuthenticationMiddleware(container);

  return createRepliesRouter(repliesHandler, authenticationMiddleware);
};
