import CommentRepositoryPostgres from '../CommentRepositoryPostgres.js';
import pool from '../../database/postgres/pool.js';
import CommentsTableTestHelper from '../../../../tests/CommentsTableTestHelper.js';
import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper.js';
import NewComment from '../../../Domains/comments/entities/NewComment.js';
import AddedComment from '../../../Domains/comments/entities/AddedComment.js';
import NotFoundError from '../../../Commons/exceptions/NotFoundError.js';
import AuthorizationError from '../../../Commons/exceptions/AuthorizationError.js';

describe('CommentRepositoryPostgres', () => {
  afterEach(async () => {
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addComment function', () => {
    it('should persist new comment to database', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({
        id: 'user-123',
        username: 'dicoding',
      });
      await ThreadsTableTestHelper.addThread({
        id: 'thread-123',
        owner: 'user-123',
      });

      const newComment = new NewComment({
        threadId: 'thread-123',
        content: 'sebuah comment',
        owner: 'user-123',
      });

      const fakeIdGenerator = () => '123';
      const commentRepositoryPostgres = new CommentRepositoryPostgres(
        pool,
        fakeIdGenerator,
      );

      // Action
      await commentRepositoryPostgres.addComment(newComment);

      // Assert
      const comments =
        await CommentsTableTestHelper.findCommentsById('comment-123');

      expect(comments).toHaveLength(1);
      expect(comments[0].content).toEqual('sebuah comment');
      expect(comments[0].thread_id).toEqual('thread-123');
      expect(comments[0].owner).toEqual('user-123');
    });

    it('should return added comment correctly', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({
        id: 'user-123',
        username: 'dicoding',
      });
      await ThreadsTableTestHelper.addThread({
        id: 'thread-123',
        owner: 'user-123',
      });

      const newComment = new NewComment({
        threadId: 'thread-123',
        content: 'sebuah comment',
        owner: 'user-123',
      });

      const fakeIdGenerator = () => '123';
      const commentRepositoryPostgres = new CommentRepositoryPostgres(
        pool,
        fakeIdGenerator,
      );

      // Action
      const addedComment =
        await commentRepositoryPostgres.addComment(newComment);

      // Assert
      expect(addedComment).toStrictEqual(
        new AddedComment({
          id: 'comment-123',
          content: 'sebuah comment',
          owner: 'user-123',
        }),
      );
    });
  });

  describe('verifyCommentOwner function', () => {
    it('should throw NotFoundError when comment is not found in thread', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({
        id: 'user-123',
        username: 'dicoding',
      });
      await ThreadsTableTestHelper.addThread({
        id: 'thread-123',
        owner: 'user-123',
      });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(
        pool,
        () => 'unused',
      );

      // Action & Assert
      await expect(
        commentRepositoryPostgres.verifyCommentOwner(
          'comment-404',
          'thread-123',
          'user-123',
        ),
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw AuthorizationError when comment owner does not match', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({
        id: 'user-123',
        username: 'dicoding',
      });
      await UsersTableTestHelper.addUser({
        id: 'user-456',
        username: 'johndoe',
      });
      await ThreadsTableTestHelper.addThread({
        id: 'thread-123',
        owner: 'user-123',
      });
      await CommentsTableTestHelper.addComment({
        id: 'comment-123',
        threadId: 'thread-123',
        content: 'sebuah comment',
        owner: 'user-123',
      });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(
        pool,
        () => 'unused',
      );

      // Action & Assert
      await expect(
        commentRepositoryPostgres.verifyCommentOwner(
          'comment-123',
          'thread-123',
          'user-456',
        ),
      ).rejects.toThrow(AuthorizationError);
    });

    it('should not throw error when comment owner matches', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({
        id: 'user-123',
        username: 'dicoding',
      });
      await ThreadsTableTestHelper.addThread({
        id: 'thread-123',
        owner: 'user-123',
      });
      await CommentsTableTestHelper.addComment({
        id: 'comment-123',
        threadId: 'thread-123',
        content: 'sebuah comment',
        owner: 'user-123',
      });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(
        pool,
        () => 'unused',
      );

      // Action & Assert
      await expect(
        commentRepositoryPostgres.verifyCommentOwner(
          'comment-123',
          'thread-123',
          'user-123',
        ),
      ).resolves.not.toThrow();
    });
  });

  describe('verifyCommentAvailability function', () => {
    it('should throw NotFoundError when comment is not found in thread', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({
        id: 'user-123',
        username: 'dicoding',
      });
      await ThreadsTableTestHelper.addThread({
        id: 'thread-123',
        owner: 'user-123',
      });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(
        pool,
        () => 'unused',
      );

      // Action & Assert
      await expect(
        commentRepositoryPostgres.verifyCommentAvailability(
          'comment-404',
          'thread-123',
        ),
      ).rejects.toThrow(NotFoundError);
    });

    it('should not throw error when comment available in thread', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({
        id: 'user-123',
        username: 'dicoding',
      });
      await ThreadsTableTestHelper.addThread({
        id: 'thread-123',
        owner: 'user-123',
      });
      await CommentsTableTestHelper.addComment({
        id: 'comment-123',
        threadId: 'thread-123',
        content: 'sebuah comment',
        owner: 'user-123',
      });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(
        pool,
        () => 'unused',
      );

      // Action & Assert
      await expect(
        commentRepositoryPostgres.verifyCommentAvailability(
          'comment-123',
          'thread-123',
        ),
      ).resolves.not.toThrow();
    });
  });

  describe('deleteCommentById function', () => {
    it('should soft delete comment by setting is_delete to true', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({
        id: 'user-123',
        username: 'dicoding',
      });
      await ThreadsTableTestHelper.addThread({
        id: 'thread-123',
        owner: 'user-123',
      });
      await CommentsTableTestHelper.addComment({
        id: 'comment-123',
        threadId: 'thread-123',
        content: 'sebuah comment',
        owner: 'user-123',
      });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(
        pool,
        () => 'unused',
      );

      // Action
      await commentRepositoryPostgres.deleteCommentById('comment-123');

      // Assert
      const comments =
        await CommentsTableTestHelper.findCommentsById('comment-123');
      expect(comments).toHaveLength(1);
      expect(comments[0].is_delete).toEqual(true);
    });
  });
});
