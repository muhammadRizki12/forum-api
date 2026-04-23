import NewComment from '../../Domains/comments/entities/NewComment.js';

class CommentUseCase {
  constructor({ threadRepository, commentRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
  }

  async add(useCasePayload, threadId, owner) {
    await this._threadRepository.getThreadById(threadId);

    const newComment = new NewComment({
      ...useCasePayload,
      threadId,
      owner,
    });

    return this._commentRepository.addComment(newComment);
  }

  async delete(useCasePayload) {
    this._validateDeletePayload(useCasePayload);

    const { threadId, commentId, owner } = useCasePayload;

    await this._threadRepository.getThreadById(threadId);
    await this._commentRepository.verifyCommentOwner(
      commentId,
      threadId,
      owner,
    );
    await this._commentRepository.deleteCommentById(commentId);
  }

  _validateDeletePayload(payload) {
    const { threadId, commentId, owner } = payload;

    if (!threadId || !commentId || !owner) {
      throw new Error('DELETE_COMMENT_USE_CASE.NOT_CONTAIN_NEEDED_PROPERTY');
    }

    if (
      typeof threadId !== 'string' ||
      typeof commentId !== 'string' ||
      typeof owner !== 'string'
    ) {
      throw new Error(
        'DELETE_COMMENT_USE_CASE.NOT_MEET_DATA_TYPE_SPECIFICATION',
      );
    }
  }
}

export default CommentUseCase;
