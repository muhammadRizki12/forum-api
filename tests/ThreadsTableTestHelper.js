import pool from '../src/Infrastructures/database/postgres/pool.js';

const ThreadsTableTestHelper = {
  async addThread({
    id = 'thread-123',
    title = 'Thread Title',
    body = 'Thread Body',
    owner,
  }) {
    const query = {
      text: 'INSERT INTO threads VALUES($1, $2, $3, current_timestamp, $4)',
      values: [id, title, body, owner],
    };

    await pool.query(query);
  },

  async findThreadsById(id) {
    const threadQuery = {
      text: `
        SELECT t.id, t.title, t.body, t.date, u.username
        FROM threads t
        LEFT JOIN users u ON u.id = t.owner
        WHERE t.id = $1
      `,
      values: [id],
    };

    const threadResult = await pool.query(threadQuery);

    if (!threadResult.rowCount) {
      return null;
    }

    const commentsQuery = {
      text: `
        SELECT c.id, u.username, c.date, c.content
        FROM comments c
        LEFT JOIN users u ON u.id = c.owner
        WHERE c.thread_id = $1
        ORDER BY c.date ASC
      `,
      values: [id],
    };

    const commentsResult = await pool.query(commentsQuery);
    const thread = threadResult.rows[0];

    return {
      thread: {
        id: thread.id,
        title: thread.title,
        body: thread.body,
        date: thread.date.toISOString(),
        username: thread.username,
        comments: commentsResult.rows.map((comment) => ({
          id: comment.id,
          username: comment.username,
          date: comment.date.toISOString(),
          content: comment.content,
        })),
      },
    };
  },

  async cleanTable() {
    await pool.query('DELETE FROM threads WHERE 1=1');
  },
};

export default ThreadsTableTestHelper;
