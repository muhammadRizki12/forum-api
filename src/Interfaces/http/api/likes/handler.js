import autoBind from 'auto-bind';
import LikeUseCase from '../../../../Applications/use_case/LikeUseCase.js';

class LikesHandler {
  constructor(container) {
    this._container = container;

    autoBind(this);
  }

  async putLikeHandler(req, res, next) {
    try {
      const likeUseCase = this._container.getInstance(LikeUseCase.name);

      const { id: owner } = req.auth.credentials;
      const { threadId, commentId } = req.params;

      await likeUseCase.toggleLike({
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

export default LikesHandler;
