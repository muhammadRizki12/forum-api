import NewThread from '../../Domains/threads/entities/NewThread.js';

class ThreadUseCase {
  constructor({ threadRepository }) {
    this._threadRepository = threadRepository;
  }

  async add(useCasePayload, owner) {
    const newThread = new NewThread({
      ...useCasePayload,
      owner,
    });

    return this._threadRepository.addThread(newThread);
  }

  async getDetail(threadId) {
    const threadDetail =
      await this._threadRepository.getThreadDetailById(threadId);

    return {
      ...threadDetail,
      comments: threadDetail.comments.map((comment) => ({
        id: comment.id,
        username: comment.username,
        date: comment.date,
        content: comment.is_delete
          ? '**komentar telah dihapus**'
          : comment.content,
        likeCount: comment.likeCount,
        replies: comment.replies.map((reply) => ({
          id: reply.id,
          username: reply.username,
          date: reply.date,
          content: reply.is_delete
            ? '**balasan telah dihapus**'
            : reply.content,
        })),
      })),
    };
  }
}

export default ThreadUseCase;
