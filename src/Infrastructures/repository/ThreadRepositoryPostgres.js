/* eslint-disable camelcase */
import AddedThread from '../../Domains/threads/entities/AddedThread.js';
import ThreadRepository from '../../Domains/threads/ThreadRepository.js';
import NotFoundError from '../../Commons/exceptions/NotFoundError.js';

class ThreadRepositoryPostgres extends ThreadRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async addThread(newThread) {
    const { title, body, owner } = newThread;
    const id = `thread-${this._idGenerator()}`;

    const query = {
      text: 'INSERT INTO threads VALUES($1, $2, $3, current_timestamp, $4) RETURNING id, title, owner',
      values: [id, title, body, owner],
    };

    const result = await this._pool.query(query);

    return new AddedThread(result.rows[0]);
  }

  async getThreadById(threadId) {
    const query = {
      text: 'SELECT id FROM threads WHERE id = $1',
      values: [threadId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('thread tidak ditemukan');
    }
  }

  async getThreadDetailById(threadId) {
    const threadQuery = {
      text: `
        SELECT t.id, t.title, t.body, t.date, u.username
        FROM threads t
        LEFT JOIN users u ON u.id = t.owner
        WHERE t.id = $1
      `,
      values: [threadId],
    };

    const threadResult = await this._pool.query(threadQuery);

    if (!threadResult.rowCount) {
      throw new NotFoundError('thread tidak ditemukan');
    }

    const commentsQuery = {
      text: `
        SELECT c.id, u.username, c.date, c.content, c.is_delete, 
               (SELECT COUNT(*)::int FROM user_comment_likes l WHERE l.comment_id = c.id) AS like_count
        FROM comments c
        LEFT JOIN users u ON u.id = c.owner
        WHERE c.thread_id = $1
        ORDER BY c.date ASC
      `,
      values: [threadId],
    };

    const commentsResult = await this._pool.query(commentsQuery);
    const thread = threadResult.rows[0];
    const comments = commentsResult.rows;
    const commentIds = comments.map((comment) => comment.id);

    let repliesByCommentId = {};

    if (commentIds.length) {
      const repliesQuery = {
        text: `
          SELECT r.id, r.comment_id, r.content, r.date, r.is_delete, u.username
          FROM replies r
          LEFT JOIN users u ON u.id = r.owner
          WHERE r.comment_id = ANY($1)
          ORDER BY r.date ASC
        `,
        values: [commentIds],
      };

      const repliesResult = await this._pool.query(repliesQuery);

      repliesByCommentId = repliesResult.rows.reduce(
        (groupedReplies, reply) => {
          if (!groupedReplies[reply.comment_id]) {
            groupedReplies[reply.comment_id] = [];
          }

          groupedReplies[reply.comment_id].push({
            id: reply.id,
            content: reply.content,
            date: reply.date.toISOString(),
            username: reply.username,
            is_delete: reply.is_delete,
          });

          return groupedReplies;
        },
        {},
      );
    }

    return {
      id: thread.id,
      title: thread.title,
      body: thread.body,
      date: thread.date.toISOString(),
      username: thread.username,
      comments: comments.map((comment) => ({
        id: comment.id,
        username: comment.username,
        date: comment.date.toISOString(),
        replies: repliesByCommentId[comment.id] || [],
        content: comment.content,
        likeCount: comment.like_count || 0,
        is_delete: comment.is_delete,
      })),
    };
  }
}

export default ThreadRepositoryPostgres;
