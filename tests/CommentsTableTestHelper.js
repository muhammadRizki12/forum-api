import pool from '../src/Infrastructures/database/postgres/pool.js';

const CommentsTableTestHelper = {
  async addComment({
    id = 'comment-123',
    threadId,
    content = 'Comment Content',
    owner,
    isDelete = false,
  }) {
    const query = {
      text: 'INSERT INTO comments (id, thread_id, content, date, owner, is_delete) VALUES($1, $2, $3, current_timestamp, $4, $5)',
      values: [id, threadId, content, owner, isDelete],
    };

    await pool.query(query);
  },

  async findCommentsById(id) {
    const query = {
      text: 'SELECT * FROM comments WHERE id = $1',
      values: [id],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async cleanTable() {
    await pool.query('DELETE FROM comments WHERE 1=1');
  },
};

export default CommentsTableTestHelper;
