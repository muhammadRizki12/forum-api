/* eslint-disable camelcase */
import { vi } from 'vitest';
import ThreadRepository from '../../../Domains/threads/ThreadRepository.js';
import NewThread from '../../../Domains/threads/entities/NewThread.js';
import AddedThread from '../../../Domains/threads/entities/AddedThread.js';
import ThreadUseCase from '../ThreadUseCase.js';

describe('ThreadUseCase', () => {
  describe('add', () => {
    it('should orchestrating the add thread action correctly', async () => {
      // Arrange
      const useCasePayload = {
        title: 'Sebuah judul thread',
        body: 'Sebuah isi thread',
      };
      const owner = 'user-123';

      const mockAddedThread = new AddedThread({
        id: 'thread-123',
        title: useCasePayload.title,
        owner,
      });

      const mockThreadRepository = new ThreadRepository();
      mockThreadRepository.addThread = vi
        .fn()
        .mockImplementation(() => Promise.resolve(mockAddedThread));

      const threadUseCase = new ThreadUseCase({
        threadRepository: mockThreadRepository,
      });

      // Action
      const addedThread = await threadUseCase.add(useCasePayload, owner);

      // Assert
      expect(addedThread).toStrictEqual(
        new AddedThread({
          id: 'thread-123',
          title: useCasePayload.title,
          owner,
        }),
      );
      expect(mockThreadRepository.addThread).toBeCalledWith(
        new NewThread({
          title: useCasePayload.title,
          body: useCasePayload.body,
          owner,
        }),
      );
    });

    it('should throw error when use case payload is invalid', async () => {
      // Arrange
      const useCasePayload = {
        title: 'Sebuah judul thread',
      };
      const owner = 'user-123';

      const mockThreadRepository = new ThreadRepository();
      mockThreadRepository.addThread = vi.fn();
      const threadUseCase = new ThreadUseCase({
        threadRepository: mockThreadRepository,
      });

      // Action & Assert
      await expect(
        threadUseCase.add(useCasePayload, owner),
      ).rejects.toThrowError('NEW_THREAD.NOT_CONTAIN_NEEDED_PROPERTY');
      expect(mockThreadRepository.addThread).not.toBeCalled();
    });
  });

  describe('getDetail', () => {
    it('should orchestrating the get thread detail action correctly', async () => {
      // Arrange
      const threadId = 'thread-123';
      const mockThreadDetail = {
        id: threadId,
        title: 'Sebuah judul thread',
        body: 'Sebuah isi thread',
        date: '2021-08-08T07:19:09.775Z',
        username: 'dicoding',
        comments: [
          {
            id: 'comment-123',
            username: 'johndoe',
            date: '2021-08-08T07:22:33.555Z',
            content: 'sebuah comment',
            likeCount: 2,
            is_delete: false,
            replies: [
              {
                id: 'reply-123',
                username: 'dicoding',
                date: '2021-08-08T07:59:18.982Z',
                content: 'ini konten balasan asli',
                is_delete: true,
              },
            ],
          },
          {
            id: 'comment-456',
            username: 'dicoding',
            date: '2021-08-08T08:07:01.522Z',
            content: 'ini konten komentar asli',
            likeCount: 0,
            is_delete: true,
            replies: [],
          },
        ],
      };

      const expectedThreadDetail = {
        id: threadId,
        title: 'Sebuah judul thread',
        body: 'Sebuah isi thread',
        date: '2021-08-08T07:19:09.775Z',
        username: 'dicoding',
        comments: [
          {
            id: 'comment-123',
            username: 'johndoe',
            date: '2021-08-08T07:22:33.555Z',
            content: 'sebuah comment',
            likeCount: 2,
            replies: [
              {
                id: 'reply-123',
                username: 'dicoding',
                date: '2021-08-08T07:59:18.982Z',
                content: '**balasan telah dihapus**',
              },
            ],
          },
          {
            id: 'comment-456',
            username: 'dicoding',
            date: '2021-08-08T08:07:01.522Z',
            content: '**komentar telah dihapus**',
            likeCount: 0,
            replies: [],
          },
        ],
      };

      const mockThreadRepository = new ThreadRepository();
      mockThreadRepository.getThreadDetailById = vi
        .fn()
        .mockImplementation(() => Promise.resolve(mockThreadDetail));

      const threadUseCase = new ThreadUseCase({
        threadRepository: mockThreadRepository,
      });

      // Action
      const threadDetail = await threadUseCase.getDetail(threadId);

      // Assert
      expect(threadDetail).toStrictEqual(expectedThreadDetail);
      expect(mockThreadRepository.getThreadDetailById).toBeCalledWith(threadId);
    });
  });
});
