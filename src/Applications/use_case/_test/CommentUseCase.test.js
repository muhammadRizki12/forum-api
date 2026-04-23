import { vi } from 'vitest';
import CommentUseCase from '../CommentUseCase.js';
import ThreadRepository from '../../../Domains/threads/ThreadRepository.js';
import CommentRepository from '../../../Domains/comments/CommentRepository.js';
import NewComment from '../../../Domains/comments/entities/NewComment.js';
import AddedComment from '../../../Domains/comments/entities/AddedComment.js';

describe('CommentUseCase', () => {
  describe('add', () => {
    it('should orchestrating the add comment action correctly', async () => {
      // Arrange
      const useCasePayload = {
        content: 'sebuah comment',
      };
      const threadId = 'thread-123';
      const owner = 'user-123';

      const mockThreadRepository = new ThreadRepository();
      mockThreadRepository.getThreadById = vi
        .fn()
        .mockImplementation(() => Promise.resolve());

      const mockCommentRepository = new CommentRepository();
      mockCommentRepository.addComment = vi.fn().mockImplementation(() =>
        Promise.resolve(
          new AddedComment({
            id: 'comment-123',
            content: useCasePayload.content,
            owner,
          }),
        ),
      );

      const commentUseCase = new CommentUseCase({
        threadRepository: mockThreadRepository,
        commentRepository: mockCommentRepository,
      });

      // Action
      const addedComment = await commentUseCase.add(
        useCasePayload,
        threadId,
        owner,
      );

      // Assert
      expect(addedComment).toStrictEqual(
        new AddedComment({
          id: 'comment-123',
          content: useCasePayload.content,
          owner,
        }),
      );
      expect(mockThreadRepository.getThreadById).toBeCalledWith(threadId);
      expect(mockCommentRepository.addComment).toBeCalledWith(
        new NewComment({
          content: useCasePayload.content,
          threadId,
          owner,
        }),
      );
    });

    it('should throw error when use case payload is invalid', async () => {
      // Arrange
      const useCasePayload = {};
      const threadId = 'thread-123';
      const owner = 'user-123';

      const mockThreadRepository = new ThreadRepository();
      mockThreadRepository.getThreadById = vi
        .fn()
        .mockImplementation(() => Promise.resolve());

      const mockCommentRepository = new CommentRepository();
      mockCommentRepository.addComment = vi.fn();

      const commentUseCase = new CommentUseCase({
        threadRepository: mockThreadRepository,
        commentRepository: mockCommentRepository,
      });

      // Action & Assert
      await expect(
        commentUseCase.add(useCasePayload, threadId, owner),
      ).rejects.toThrowError('NEW_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
      expect(mockThreadRepository.getThreadById).toBeCalledWith(threadId);
      expect(mockCommentRepository.addComment).not.toBeCalled();
    });
  });

  describe('delete', () => {
    it('should orchestrating the delete comment action correctly', async () => {
      // Arrange
      const useCasePayload = {
        threadId: 'thread-123',
        commentId: 'comment-123',
        owner: 'user-123',
      };

      const mockThreadRepository = new ThreadRepository();
      mockThreadRepository.getThreadById = vi
        .fn()
        .mockImplementation(() => Promise.resolve());

      const mockCommentRepository = new CommentRepository();
      mockCommentRepository.verifyCommentOwner = vi
        .fn()
        .mockImplementation(() => Promise.resolve());
      mockCommentRepository.deleteCommentById = vi
        .fn()
        .mockImplementation(() => Promise.resolve());

      const commentUseCase = new CommentUseCase({
        threadRepository: mockThreadRepository,
        commentRepository: mockCommentRepository,
      });

      // Action
      await commentUseCase.delete(useCasePayload);

      // Assert
      expect(mockThreadRepository.getThreadById).toBeCalledWith(
        useCasePayload.threadId,
      );
      expect(mockCommentRepository.verifyCommentOwner).toBeCalledWith(
        useCasePayload.commentId,
        useCasePayload.threadId,
        useCasePayload.owner,
      );
      expect(mockCommentRepository.deleteCommentById).toBeCalledWith(
        useCasePayload.commentId,
      );
    });

    it('should throw error when payload not contain needed property', async () => {
      // Arrange
      const useCasePayload = {
        threadId: 'thread-123',
        owner: 'user-123',
      };

      const mockThreadRepository = new ThreadRepository();
      const mockCommentRepository = new CommentRepository();

      const commentUseCase = new CommentUseCase({
        threadRepository: mockThreadRepository,
        commentRepository: mockCommentRepository,
      });

      // Action & Assert
      await expect(commentUseCase.delete(useCasePayload)).rejects.toThrow(
        'DELETE_COMMENT_USE_CASE.NOT_CONTAIN_NEEDED_PROPERTY',
      );
    });

    it('should throw error when payload not meet data type specification', async () => {
      // Arrange
      const useCasePayload = {
        threadId: 'thread-123',
        commentId: 123,
        owner: 'user-123',
      };

      const mockThreadRepository = new ThreadRepository();
      const mockCommentRepository = new CommentRepository();

      const commentUseCase = new CommentUseCase({
        threadRepository: mockThreadRepository,
        commentRepository: mockCommentRepository,
      });

      // Action & Assert
      await expect(commentUseCase.delete(useCasePayload)).rejects.toThrow(
        'DELETE_COMMENT_USE_CASE.NOT_MEET_DATA_TYPE_SPECIFICATION',
      );
    });
  });
});
