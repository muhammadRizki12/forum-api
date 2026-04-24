import express from 'express';

const createLikesRouter = (handler, authenticationMiddleware) => {
  const router = express.Router();

  router.put(
    '/:threadId/comments/:commentId/likes',
    authenticationMiddleware,
    handler.putLikeHandler,
  );

  return router;
};

export default createLikesRouter;
