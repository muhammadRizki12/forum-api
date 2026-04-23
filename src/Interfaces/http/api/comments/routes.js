import express from 'express';

const createCommentsRouter = (handler, authenticationMiddleware) => {
  const router = express.Router();

  router.post(
    '/:threadId/comments',
    authenticationMiddleware,
    handler.postCommentHandler,
  );

  router.delete(
    '/:threadId/comments/:commentId',
    authenticationMiddleware,
    handler.deleteCommentHandler,
  );

  return router;
};

export default createCommentsRouter;
