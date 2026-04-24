import request from 'supertest';
import pool from '../../database/postgres/pool.js';
import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper.js';
import CommentsTableTestHelper from '../../../../tests/CommentsTableTestHelper.js';
import LikesTableTestHelper from '../../../../tests/LikesTableTestHelper.js';
import AuthenticationsTableTestHelper from '../../../../tests/AuthenticationsTableTestHelper.js';
import container from '../../container.js';
import createServer from '../createServer.js';

describe('/threads/{threadId}/comments/{commentId}/likes endpoint', () => {
  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await LikesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await AuthenticationsTableTestHelper.cleanTable();
  });

  describe('when PUT /threads/{threadId}/comments/{commentId}/likes', () => {
    it('should response 200 and toggle like (add)', async () => {
      // Arrange
      const app = await createServer(container);
      await request(app).post('/users').send({
        username: 'dicoding',
        password: 'secret',
        fullname: 'Dicoding Indonesia',
      });
      const authenticationResponse = await request(app)
        .post('/authentications')
        .send({
          username: 'dicoding',
          password: 'secret',
        });

      const accessToken = authenticationResponse.body.data.accessToken;

      const threadResponse = await request(app)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'sebuah thread',
          body: 'isi thread',
        });

      const threadId = threadResponse.body.data.addedThread.id;

      const commentResponse = await request(app)
        .post(`/threads/${threadId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah comment' });

      const commentId = commentResponse.body.data.addedComment.id;

      // Action
      const response = await request(app)
        .put(`/threads/${threadId}/comments/${commentId}/likes`)
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');
    });

    it('should response 200 and toggle like (delete)', async () => {
      // Arrange
      const app = await createServer(container);
      await request(app).post('/users').send({
        username: 'dicoding',
        password: 'secret',
        fullname: 'Dicoding Indonesia',
      });
      const authenticationResponse = await request(app)
        .post('/authentications')
        .send({
          username: 'dicoding',
          password: 'secret',
        });

      const accessToken = authenticationResponse.body.data.accessToken;

      const threadResponse = await request(app)
        .post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'sebuah thread',
          body: 'isi thread',
        });

      const threadId = threadResponse.body.data.addedThread.id;

      const commentResponse = await request(app)
        .post(`/threads/${threadId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'sebuah comment' });

      const commentId = commentResponse.body.data.addedComment.id;

      // Add like first
      await request(app)
        .put(`/threads/${threadId}/comments/${commentId}/likes`)
        .set('Authorization', `Bearer ${accessToken}`);

      // Action: Unlike
      const response = await request(app)
        .put(`/threads/${threadId}/comments/${commentId}/likes`)
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');
    });

    it('should response 404 if thread not found', async () => {
      const app = await createServer(container);
      await request(app).post('/users').send({
        username: 'dicoding',
        password: 'secret',
        fullname: 'Dicoding Indonesia',
      });
      const authenticationResponse = await request(app)
        .post('/authentications')
        .send({
          username: 'dicoding',
          password: 'secret',
        });

      const accessToken = authenticationResponse.body.data.accessToken;

      const response = await request(app)
        .put('/threads/thread-404/comments/comment-404/likes')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toEqual(404);
    });

    it('should response 401 if not authenticated', async () => {
      const app = await createServer(container);
      const response = await request(app).put(
        '/threads/thread-123/comments/comment-123/likes',
      );

      expect(response.status).toEqual(401);
    });
  });
});
