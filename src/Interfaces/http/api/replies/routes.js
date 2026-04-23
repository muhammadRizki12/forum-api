import express from 'express';

const createRepliesRouter = (handler, authenticationMiddleware) => {
  const router = express.Router();

  router.post(
    '/:threadId/comments/:commentId/replies',
    authenticationMiddleware,
    handler.postReplyHandler,
  );

  router.delete(
    '/:threadId/comments/:commentId/replies/:replyId',
    authenticationMiddleware,
    handler.deleteReplyHandler,
  );

  return router;
};

export default createRepliesRouter;
