import ThreadsTableTestHelper from './ThreadsTableTestHelper.js';
import CommentsTableTestHelper from './CommentsTableTestHelper.js';
import UsersTableTestHelper from './UsersTableTestHelper.js';
import RepliesTableTestHelper from './RepliesTableTestHelper.js';

describe('ThreadsTableTestHelper', () => {
  afterEach(async () => {
    await RepliesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  it('should return null when thread is not found', async () => {
    // Action
    const thread = await ThreadsTableTestHelper.findThreadsById('thread-404');

    // Assert
    expect(thread).toBeNull();
  });

  it('should return thread detail with comments when thread is found', async () => {
    // Arrange
    await UsersTableTestHelper.addUser({
      id: 'user-123',
      username: 'dicoding',
    });
    await ThreadsTableTestHelper.addThread({
      id: 'thread-123',
      title: 'judul',
      body: 'isi',
      owner: 'user-123',
    });
    await CommentsTableTestHelper.addComment({
      id: 'comment-123',
      threadId: 'thread-123',
      content: 'komentar',
      owner: 'user-123',
    });

    // Action
    const thread = await ThreadsTableTestHelper.findThreadsById('thread-123');

    // Assert
    expect(thread).not.toBeNull();
    expect(thread.thread.id).toEqual('thread-123');
    expect(thread.thread.comments).toHaveLength(1);
    expect(thread.thread.comments[0].id).toEqual('comment-123');
    expect(thread.thread.comments[0].content).toEqual('komentar');
  });
});
