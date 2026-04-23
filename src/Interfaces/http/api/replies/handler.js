import ReplyUseCase from '../../../../Applications/use_case/ReplyUseCase.js';

class ThreadsHandler {
  constructor(container) {
    this._container = container;

    this.postReplyHandler = this.postReplyHandler.bind(this);
    this.deleteReplyHandler = this.deleteReplyHandler.bind(this);
  }

  async postReplyHandler(req, res, next) {
    try {
      const replyUseCase = this._container.getInstance(ReplyUseCase.name);

      const { id: owner } = req.auth.credentials;
      const { threadId, commentId } = req.params;
      const addedReply = await replyUseCase.add(
        req.body,
        threadId,
        commentId,
        owner,
      );

      res.status(201).json({
        status: 'success',
        data: {
          addedReply,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteReplyHandler(req, res, next) {
    try {
      const replyUseCase = this._container.getInstance(ReplyUseCase.name);

      const { id: owner } = req.auth.credentials;
      const { threadId, commentId, replyId } = req.params;

      await replyUseCase.delete({
        threadId,
        commentId,
        replyId,
        owner,
      });

      res.json({
        status: 'success',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ThreadsHandler;
