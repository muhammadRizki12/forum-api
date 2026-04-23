import CommentUseCase from '../../../../Applications/use_case/CommentUseCase.js';
class CommentsHandler {
  constructor(container) {
    this._container = container;

    this.postCommentHandler = this.postCommentHandler.bind(this);
    this.deleteCommentHandler = this.deleteCommentHandler.bind(this);
  }

  async postCommentHandler(req, res, next) {
    try {
      const commentUseCase = this._container.getInstance(CommentUseCase.name);

      const { id: owner } = req.auth.credentials;
      const { threadId } = req.params;

      const addedComment = await commentUseCase.add(req.body, threadId, owner);

      res.status(201).json({
        status: 'success',
        data: {
          addedComment,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCommentHandler(req, res, next) {
    try {
      const commentUseCase = this._container.getInstance(CommentUseCase.name);

      const { id: owner } = req.auth.credentials;
      const { threadId, commentId } = req.params;

      await commentUseCase.delete({
        threadId,
        commentId,
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

export default CommentsHandler;
