import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper.js';
import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import CommentsTableTestHelper from '../../../../tests/CommentsTableTestHelper.js';
import RepliesTableTestHelper from '../../../../tests/RepliesTableTestHelper.js';
import LikesTableTestHelper from '../../../../tests/LikesTableTestHelper.js';
import NewThread from '../../../Domains/threads/entities/NewThread.js';
import AddedThread from '../../../Domains/threads/entities/AddedThread.js';
import pool from '../../database/postgres/pool.js';
import ThreadRepositoryPostgres from '../ThreadRepositoryPostgres.js';
import NotFoundError from '../../../Commons/exceptions/NotFoundError.js';

describe('ThreadRepositoryPostgres', () => {
  afterEach(async () => {
    await LikesTableTestHelper.cleanTable();
    await RepliesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addThread function', () => {
    it('should persist new thread to database', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({
        id: 'user-123',
        username: 'thread_owner',
      });

      const newThread = new NewThread({
        title: 'Sebuah judul thread',
        body: 'Sebuah isi thread',
        owner: 'user-123',
      });
      const fakeIdGenerator = () => '123';
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(
        pool,
        fakeIdGenerator,
      );

      // Action
      await threadRepositoryPostgres.addThread(newThread);

      // Assert
      const thread = await ThreadsTableTestHelper.findThreadsById('thread-123');
      expect(thread).not.toBeNull();
      expect(thread.thread.id).toEqual('thread-123');
      expect(thread.thread.title).toEqual('Sebuah judul thread');
      expect(thread.thread.body).toEqual('Sebuah isi thread');
      expect(thread.thread.username).toEqual('thread_owner');
    });

    it('should return added thread correctly', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({
        id: 'user-123',
        username: 'thread_owner',
      });

      const newThread = new NewThread({
        title: 'Sebuah judul thread',
        body: 'Sebuah isi thread',
        owner: 'user-123',
      });
      const fakeIdGenerator = () => '123';
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(
        pool,
        fakeIdGenerator,
      );

      // Action
      const addedThread = await threadRepositoryPostgres.addThread(newThread);

      // Assert
      expect(addedThread).toStrictEqual(
        new AddedThread({
          id: 'thread-123',
          title: 'Sebuah judul thread',
          owner: 'user-123',
        }),
      );
    });
  });

  describe('getThreadById function', () => {
    it('should throw NotFoundError when thread not available', async () => {
      // Arrange
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(
        threadRepositoryPostgres.getThreadById('thread-404'),
      ).rejects.toThrow(NotFoundError);
    });

    it('should not throw NotFoundError when thread available', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({
        id: 'user-123',
        username: 'thread_owner',
      });
      await ThreadsTableTestHelper.addThread({
        id: 'thread-123',
        owner: 'user-123',
      });
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(
        threadRepositoryPostgres.getThreadById('thread-123'),
      ).resolves.not.toThrow(NotFoundError);
    });
  });

  describe('getThreadDetailById function', () => {
    it('should throw NotFoundError when thread not available', async () => {
      // Arrange
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(
        threadRepositoryPostgres.getThreadDetailById('thread-404'),
      ).rejects.toThrow(NotFoundError);
    });

    it('should return thread detail with comments and replies sorted by date in raw form', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({
        id: 'user-123',
        username: 'thread_owner',
      });
      await UsersTableTestHelper.addUser({
        id: 'user-456',
        username: 'comment_owner',
      });
      await ThreadsTableTestHelper.addThread({
        id: 'thread-123',
        title: 'Sebuah judul thread',
        body: 'Sebuah isi thread',
        owner: 'user-123',
      });

      await CommentsTableTestHelper.addComment({
        id: 'comment-older',
        threadId: 'thread-123',
        content: 'komentar lama',
        owner: 'user-456',
      });
      await CommentsTableTestHelper.addComment({
        id: 'comment-newer',
        threadId: 'thread-123',
        content: 'komentar baru',
        owner: 'user-456',
        isDelete: true,
      });
      await RepliesTableTestHelper.addReply({
        id: 'reply-older',
        commentId: 'comment-older',
        content: 'balasan lama',
        owner: 'user-123',
      });
      await RepliesTableTestHelper.addReply({
        id: 'reply-newer',
        commentId: 'comment-older',
        content: 'balasan baru',
        owner: 'user-456',
        isDelete: true,
      });

      await LikesTableTestHelper.addLike({
        id: 'like-1',
        commentId: 'comment-older',
        owner: 'user-123',
      });
      await LikesTableTestHelper.addLike({
        id: 'like-2',
        commentId: 'comment-older',
        owner: 'user-456',
      });

      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Action
      const threadDetail =
        await threadRepositoryPostgres.getThreadDetailById('thread-123');

      // Assert
      expect(threadDetail.id).toEqual('thread-123');
      expect(threadDetail.title).toEqual('Sebuah judul thread');
      expect(threadDetail.body).toEqual('Sebuah isi thread');
      expect(threadDetail.username).toEqual('thread_owner');
      expect(threadDetail.date).toBeDefined();

      expect(threadDetail.comments).toHaveLength(2);
      expect(threadDetail.comments[0].id).toEqual('comment-older');
      expect(threadDetail.comments[0].content).toEqual('komentar lama');
      expect(threadDetail.comments[0].likeCount).toEqual(2);
      expect(threadDetail.comments[0].is_delete).toEqual(false);
      expect(threadDetail.comments[0].replies).toHaveLength(2);
      expect(threadDetail.comments[0].replies[0].id).toEqual('reply-older');
      expect(threadDetail.comments[0].replies[0].content).toEqual(
        'balasan lama',
      );
      expect(threadDetail.comments[0].replies[0].is_delete).toEqual(false);
      expect(threadDetail.comments[0].replies[1].id).toEqual('reply-newer');
      expect(threadDetail.comments[0].replies[1].content).toEqual(
        'balasan baru',
      );
      expect(threadDetail.comments[0].replies[1].is_delete).toEqual(true);
      expect(threadDetail.comments[1].id).toEqual('comment-newer');
      expect(threadDetail.comments[1].content).toEqual('komentar baru');
      expect(threadDetail.comments[1].likeCount).toEqual(0);
      expect(threadDetail.comments[1].is_delete).toEqual(true);
      expect(threadDetail.comments[1].replies).toStrictEqual([]);
    });

    it('should return thread detail with empty comments when thread has no comments', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({
        id: 'user-123',
        username: 'thread_owner',
      });
      await ThreadsTableTestHelper.addThread({
        id: 'thread-123',
        title: 'Sebuah judul thread',
        body: 'Sebuah isi thread',
        owner: 'user-123',
      });

      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Action
      const threadDetail =
        await threadRepositoryPostgres.getThreadDetailById('thread-123');

      // Assert
      expect(threadDetail.id).toEqual('thread-123');
      expect(threadDetail.comments).toStrictEqual([]);
    });
  });
});
