import pool from '../src/Infrastructures/database/postgres/pool.js';

const RepliesTableTestHelper = {
  async addReply({
    id = 'reply-123',
    commentId,
    content = 'Reply Content',
    owner,
    isDelete = false,
  }) {
    const query = {
      text: 'INSERT INTO replies (id, comment_id, content, date, owner, is_delete) VALUES($1, $2, $3, current_timestamp, $4, $5)',
      values: [id, commentId, content, owner, isDelete],
    };

    await pool.query(query);
  },

  async findRepliesById(id) {
    const query = {
      text: 'SELECT * FROM replies WHERE id = $1',
      values: [id],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async cleanTable() {
    await pool.query('DELETE FROM replies WHERE 1=1');
  },
};

export default RepliesTableTestHelper;
