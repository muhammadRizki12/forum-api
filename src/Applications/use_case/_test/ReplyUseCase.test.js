import { vi } from 'vitest';
import ReplyUseCase from '../ReplyUseCase.js';
import ThreadRepository from '../../../Domains/threads/ThreadRepository.js';
import CommentRepository from '../../../Domains/comments/CommentRepository.js';
import ReplyRepository from '../../../Domains/replies/ReplyRepository.js';
import NewReply from '../../../Domains/replies/entities/NewReply.js';
import AddedReply from '../../../Domains/replies/entities/AddedReply.js';

describe('ReplyUseCase', () => {
  describe('add', () => {
    it('should orchestrating the add reply action correctly', async () => {
      // Arrange
      const useCasePayload = {
        content: 'sebuah balasan',
      };
      const threadId = 'thread-123';
      const commentId = 'comment-123';
      const owner = 'user-123';

      const mockThreadRepository = new ThreadRepository();
      mockThreadRepository.getThreadById = vi
        .fn()
        .mockImplementation(() => Promise.resolve());

      const mockCommentRepository = new CommentRepository();
      mockCommentRepository.verifyCommentAvailability = vi
        .fn()
        .mockImplementation(() => Promise.resolve());

      const mockReplyRepository = new ReplyRepository();
      mockReplyRepository.addReply = vi.fn().mockImplementation(() =>
        Promise.resolve(
          new AddedReply({
            id: 'reply-123',
            content: useCasePayload.content,
            owner,
          }),
        ),
      );

      const replyUseCase = new ReplyUseCase({
        threadRepository: mockThreadRepository,
        commentRepository: mockCommentRepository,
        replyRepository: mockReplyRepository,
      });

      // Action
      const addedReply = await replyUseCase.add(
        useCasePayload,
        threadId,
        commentId,
        owner,
      );

      // Assert
      expect(addedReply).toStrictEqual(
        new AddedReply({
          id: 'reply-123',
          content: useCasePayload.content,
          owner,
        }),
      );
      expect(mockThreadRepository.getThreadById).toBeCalledWith(threadId);
      expect(mockCommentRepository.verifyCommentAvailability).toBeCalledWith(
        commentId,
        threadId,
      );
      expect(mockReplyRepository.addReply).toBeCalledWith(
        new NewReply({
          content: useCasePayload.content,
          commentId,
          owner,
        }),
      );
    });

    it('should throw error when use case payload is invalid', async () => {
      // Arrange
      const useCasePayload = {};
      const threadId = 'thread-123';
      const commentId = 'comment-123';
      const owner = 'user-123';

      const mockThreadRepository = new ThreadRepository();
      mockThreadRepository.getThreadById = vi
        .fn()
        .mockImplementation(() => Promise.resolve());

      const mockCommentRepository = new CommentRepository();
      mockCommentRepository.verifyCommentAvailability = vi
        .fn()
        .mockImplementation(() => Promise.resolve());

      const mockReplyRepository = new ReplyRepository();
      mockReplyRepository.addReply = vi.fn();

      const replyUseCase = new ReplyUseCase({
        threadRepository: mockThreadRepository,
        commentRepository: mockCommentRepository,
        replyRepository: mockReplyRepository,
      });

      // Action & Assert
      await expect(
        replyUseCase.add(useCasePayload, threadId, commentId, owner),
      ).rejects.toThrowError('NEW_REPLY.NOT_CONTAIN_NEEDED_PROPERTY');
      expect(mockThreadRepository.getThreadById).toBeCalledWith(threadId);
      expect(mockCommentRepository.verifyCommentAvailability).toBeCalledWith(
        commentId,
        threadId,
      );
      expect(mockReplyRepository.addReply).not.toBeCalled();
    });
  });

  describe('delete', () => {
    it('should orchestrating the delete reply action correctly', async () => {
      // Arrange
      const useCasePayload = {
        threadId: 'thread-123',
        commentId: 'comment-123',
        replyId: 'reply-123',
        owner: 'user-123',
      };

      const mockThreadRepository = new ThreadRepository();
      mockThreadRepository.getThreadById = vi
        .fn()
        .mockImplementation(() => Promise.resolve());

      const mockCommentRepository = new CommentRepository();
      mockCommentRepository.verifyCommentAvailability = vi
        .fn()
        .mockImplementation(() => Promise.resolve());

      const mockReplyRepository = new ReplyRepository();
      mockReplyRepository.verifyReplyOwner = vi
        .fn()
        .mockImplementation(() => Promise.resolve());
      mockReplyRepository.deleteReplyById = vi
        .fn()
        .mockImplementation(() => Promise.resolve());

      const replyUseCase = new ReplyUseCase({
        threadRepository: mockThreadRepository,
        commentRepository: mockCommentRepository,
        replyRepository: mockReplyRepository,
      });

      // Action
      await replyUseCase.delete(useCasePayload);

      // Assert
      expect(mockThreadRepository.getThreadById).toBeCalledWith(
        useCasePayload.threadId,
      );
      expect(mockCommentRepository.verifyCommentAvailability).toBeCalledWith(
        useCasePayload.commentId,
        useCasePayload.threadId,
      );
      expect(mockReplyRepository.verifyReplyOwner).toBeCalledWith(
        useCasePayload.replyId,
        useCasePayload.commentId,
        useCasePayload.owner,
      );
      expect(mockReplyRepository.deleteReplyById).toBeCalledWith(
        useCasePayload.replyId,
      );
    });

    it('should throw error when payload not contain needed property', async () => {
      // Arrange
      const useCasePayload = {
        threadId: 'thread-123',
        commentId: 'comment-123',
        owner: 'user-123',
      };

      const mockThreadRepository = new ThreadRepository();
      const mockCommentRepository = new CommentRepository();
      const mockReplyRepository = new ReplyRepository();

      const replyUseCase = new ReplyUseCase({
        threadRepository: mockThreadRepository,
        commentRepository: mockCommentRepository,
        replyRepository: mockReplyRepository,
      });

      // Action & Assert
      await expect(replyUseCase.delete(useCasePayload)).rejects.toThrow(
        'DELETE_REPLY_USE_CASE.NOT_CONTAIN_NEEDED_PROPERTY',
      );
    });

    it('should throw error when payload not meet data type specification', async () => {
      // Arrange
      const useCasePayload = {
        threadId: 'thread-123',
        commentId: 'comment-123',
        replyId: 123,
        owner: 'user-123',
      };

      const mockThreadRepository = new ThreadRepository();
      const mockCommentRepository = new CommentRepository();
      const mockReplyRepository = new ReplyRepository();

      const replyUseCase = new ReplyUseCase({
        threadRepository: mockThreadRepository,
        commentRepository: mockCommentRepository,
        replyRepository: mockReplyRepository,
      });

      // Action & Assert
      await expect(replyUseCase.delete(useCasePayload)).rejects.toThrow(
        'DELETE_REPLY_USE_CASE.NOT_MEET_DATA_TYPE_SPECIFICATION',
      );
    });
  });
});
