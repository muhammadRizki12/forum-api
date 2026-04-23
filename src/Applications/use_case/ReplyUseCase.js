import NewReply from '../../Domains/replies/entities/NewReply.js';

class ReplyUseCase {
  constructor({ threadRepository, commentRepository, replyRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
    this._replyRepository = replyRepository;
  }

  async add(useCasePayload, threadId, commentId, owner) {
    await this._threadRepository.getThreadById(threadId);
    await this._commentRepository.verifyCommentAvailability(
      commentId,
      threadId,
    );

    const newReply = new NewReply({
      ...useCasePayload,
      commentId,
      owner,
    });

    return this._replyRepository.addReply(newReply);
  }

  async delete(useCasePayload) {
    this._validateDeletePayload(useCasePayload);

    const { threadId, commentId, replyId, owner } = useCasePayload;

    await this._threadRepository.getThreadById(threadId);
    await this._commentRepository.verifyCommentAvailability(
      commentId,
      threadId,
    );
    await this._replyRepository.verifyReplyOwner(replyId, commentId, owner);
    await this._replyRepository.deleteReplyById(replyId);
  }

  _validateDeletePayload(payload) {
    const { threadId, commentId, replyId, owner } = payload;

    if (!threadId || !commentId || !replyId || !owner) {
      throw new Error('DELETE_REPLY_USE_CASE.NOT_CONTAIN_NEEDED_PROPERTY');
    }

    if (
      typeof threadId !== 'string' ||
      typeof commentId !== 'string' ||
      typeof replyId !== 'string' ||
      typeof owner !== 'string'
    ) {
      throw new Error('DELETE_REPLY_USE_CASE.NOT_MEET_DATA_TYPE_SPECIFICATION');
    }
  }
}

export default ReplyUseCase;
