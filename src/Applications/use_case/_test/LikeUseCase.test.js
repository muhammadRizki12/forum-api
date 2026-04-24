import LikeUseCase from '../LikeUseCase.js';
import ThreadRepository from '../../../Domains/threads/ThreadRepository.js';
import CommentRepository from '../../../Domains/comments/CommentRepository.js';
import LikeRepository from '../../../Domains/likes/LikeRepository.js';

describe('LikeUseCase', () => {
  it('should throw error if use case payload not contain needed property', async () => {
    // Arrange
    const useCasePayload = {};
    const likeUseCase = new LikeUseCase({});

    // Action & Assert
    await expect(likeUseCase.toggleLike(useCasePayload)).rejects.toThrowError('LIKE_USE_CASE.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error if use case payload not meet data type specification', async () => {
    // Arrange
    const useCasePayload = {
      threadId: 123,
      commentId: true,
      owner: {},
    };
    const likeUseCase = new LikeUseCase({});

    // Action & Assert
    await expect(likeUseCase.toggleLike(useCasePayload)).rejects.toThrowError('LIKE_USE_CASE.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should orchestrate the add like action correctly', async () => {
    // Arrange
    const useCasePayload = {
      threadId: 'thread-123',
      commentId: 'comment-123',
      owner: 'user-123',
    };

    /** creating dependency of use case */
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockLikeRepository = new LikeRepository();

    /** mocking needed function */
    mockThreadRepository.getThreadById = vitest.fn(() => Promise.resolve());
    mockCommentRepository.verifyCommentAvailability = vitest.fn(() => Promise.resolve());
    mockLikeRepository.verifyLikeExists = vitest.fn(() => Promise.resolve(false));
    mockLikeRepository.addLike = vitest.fn(() => Promise.resolve());

    /** creating use case instance */
    const likeUseCase = new LikeUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      likeRepository: mockLikeRepository,
    });

    // Action
    await likeUseCase.toggleLike(useCasePayload);

    // Assert
    expect(mockThreadRepository.getThreadById).toHaveBeenCalledWith(useCasePayload.threadId);
    expect(mockCommentRepository.verifyCommentAvailability).toHaveBeenCalledWith(useCasePayload.commentId, useCasePayload.threadId);
    expect(mockLikeRepository.verifyLikeExists).toHaveBeenCalledWith(useCasePayload.commentId, useCasePayload.owner);
    expect(mockLikeRepository.addLike).toHaveBeenCalledWith(useCasePayload.commentId, useCasePayload.owner);
  });

  it('should orchestrate the delete like action correctly', async () => {
    // Arrange
    const useCasePayload = {
      threadId: 'thread-123',
      commentId: 'comment-123',
      owner: 'user-123',
    };

    /** creating dependency of use case */
    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockLikeRepository = new LikeRepository();

    /** mocking needed function */
    mockThreadRepository.getThreadById = vitest.fn(() => Promise.resolve());
    mockCommentRepository.verifyCommentAvailability = vitest.fn(() => Promise.resolve());
    mockLikeRepository.verifyLikeExists = vitest.fn(() => Promise.resolve(true));
    mockLikeRepository.deleteLike = vitest.fn(() => Promise.resolve());

    /** creating use case instance */
    const likeUseCase = new LikeUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      likeRepository: mockLikeRepository,
    });

    // Action
    await likeUseCase.toggleLike(useCasePayload);

    // Assert
    expect(mockThreadRepository.getThreadById).toHaveBeenCalledWith(useCasePayload.threadId);
    expect(mockCommentRepository.verifyCommentAvailability).toHaveBeenCalledWith(useCasePayload.commentId, useCasePayload.threadId);
    expect(mockLikeRepository.verifyLikeExists).toHaveBeenCalledWith(useCasePayload.commentId, useCasePayload.owner);
    expect(mockLikeRepository.deleteLike).toHaveBeenCalledWith(useCasePayload.commentId, useCasePayload.owner);
  });
});
