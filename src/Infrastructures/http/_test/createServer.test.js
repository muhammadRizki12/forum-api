import request from 'supertest';
import pool from '../../database/postgres/pool.js';
import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import AuthenticationsTableTestHelper from '../../../../tests/AuthenticationsTableTestHelper.js';
import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper.js';
import CommentsTableTestHelper from '../../../../tests/CommentsTableTestHelper.js';
import RepliesTableTestHelper from '../../../../tests/RepliesTableTestHelper.js';
import container from '../../container.js';
import createServer from '../createServer.js';
import AuthenticationTokenManager from '../../../Applications/security/AuthenticationTokenManager.js';

describe('HTTP server', () => {
  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await RepliesTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await AuthenticationsTableTestHelper.cleanTable();
  });

  it('should response 404 when request unregistered route', async () => {
    // Arrange
    const app = await createServer({});

    // Action
    const response = await request(app).get('/unregisteredRoute');

    // Assert
    expect(response.status).toEqual(404);
  });

  describe('when POST /users', () => {
    it('should response 201 and persisted user', async () => {
      // Arrange
      const requestPayload = {
        username: 'dicoding',
        password: 'secret',
        fullname: 'Dicoding Indonesia',
      };
      const app = await createServer(container);

      // Action
      const response = await request(app).post('/users').send(requestPayload);

      // Assert
      expect(response.status).toEqual(201);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.addedUser).toBeDefined();
    });

    it('should response 400 when request payload not contain needed property', async () => {
      // Arrange
      const requestPayload = {
        fullname: 'Dicoding Indonesia',
        password: 'secret',
      };
      const app = await createServer(container);

      // Action
      const response = await request(app).post('/users').send(requestPayload);

      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual(
        'tidak dapat membuat user baru karena properti yang dibutuhkan tidak ada',
      );
    });

    it('should response 400 when request payload not meet data type specification', async () => {
      // Arrange
      const requestPayload = {
        username: 'dicoding',
        password: 'secret',
        fullname: ['Dicoding Indonesia'],
      };
      const app = await createServer(container);

      // Action
      const response = await request(app).post('/users').send(requestPayload);

      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual(
        'tidak dapat membuat user baru karena tipe data tidak sesuai',
      );
    });

    it('should response 400 when username more than 50 character', async () => {
      // Arrange
      const requestPayload = {
        username: 'dicodingindonesiadicodingindonesiadicodingindonesiadicoding',
        password: 'secret',
        fullname: 'Dicoding Indonesia',
      };
      const app = await createServer(container);

      // Action
      const response = await request(app).post('/users').send(requestPayload);

      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual(
        'tidak dapat membuat user baru karena karakter username melebihi batas limit',
      );
    });

    it('should response 400 when username contain restricted character', async () => {
      // Arrange
      const requestPayload = {
        username: 'dicoding indonesia',
        password: 'secret',
        fullname: 'Dicoding Indonesia',
      };
      const app = await createServer(container);

      // Action
      const response = await request(app).post('/users').send(requestPayload);

      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual(
        'tidak dapat membuat user baru karena username mengandung karakter terlarang',
      );
    });

    it('should response 400 when username unavailable', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ username: 'dicoding' });
      const requestPayload = {
        username: 'dicoding',
        fullname: 'Dicoding Indonesia',
        password: 'super_secret',
      };
      const app = await createServer(container);

      // Action
      const response = await request(app).post('/users').send(requestPayload);

      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('username tidak tersedia');
    });
  });

  describe('when POST /authentications', () => {
    it('should response 201 and new authentication', async () => {
      const requestPayload = {
        username: 'dicoding',
        password: 'secret',
      };
      const app = await createServer(container);

      await request(app).post('/users').send({
        username: 'dicoding',
        password: 'secret',
        fullname: 'Dicoding Indonesia',
      });

      const response = await request(app)
        .post('/authentications')
        .send(requestPayload);

      expect(response.status).toEqual(201);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should response 400 if username not found', async () => {
      const requestPayload = {
        username: 'dicoding',
        password: 'secret',
      };
      const app = await createServer(container);

      const response = await request(app)
        .post('/authentications')
        .send(requestPayload);

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('username tidak ditemukan');
    });

    it('should response 401 if password wrong', async () => {
      const requestPayload = {
        username: 'dicoding',
        password: 'wrong_password',
      };
      const app = await createServer(container);

      await request(app).post('/users').send({
        username: 'dicoding',
        password: 'secret',
        fullname: 'Dicoding Indonesia',
      });

      const response = await request(app)
        .post('/authentications')
        .send(requestPayload);

      expect(response.status).toEqual(401);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual(
        'kredensial yang Anda masukkan salah',
      );
    });

    it('should response 400 if login payload not contain needed property', async () => {
      const requestPayload = {
        username: 'dicoding',
      };
      const app = await createServer(container);

      const response = await request(app)
        .post('/authentications')
        .send(requestPayload);

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual(
        'harus mengirimkan username dan password',
      );
    });

    it('should response 400 if login payload wrong data type', async () => {
      const requestPayload = {
        username: 123,
        password: 'secret',
      };
      const app = await createServer(container);

      const response = await request(app)
        .post('/authentications')
        .send(requestPayload);

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual(
        'username dan password harus string',
      );
    });
  });

  describe('when PUT /authentications', () => {
    it('should return 200 and new access token', async () => {
      const app = await createServer(container);

      await request(app).post('/users').send({
        username: 'dicoding',
        password: 'secret',
        fullname: 'Dicoding Indonesia',
      });

      const loginResponse = await request(app).post('/authentications').send({
        username: 'dicoding',
        password: 'secret',
      });

      const { refreshToken } = loginResponse.body.data;
      const response = await request(app)
        .put('/authentications')
        .send({ refreshToken });

      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.accessToken).toBeDefined();
    });

    it('should return 400 payload not contain refresh token', async () => {
      const app = await createServer(container);

      const response = await request(app).put('/authentications').send({});

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('harus mengirimkan token refresh');
    });

    it('should return 400 if refresh token not string', async () => {
      const app = await createServer(container);

      const response = await request(app)
        .put('/authentications')
        .send({ refreshToken: 123 });

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('refresh token harus string');
    });

    it('should return 400 if refresh token not valid', async () => {
      const app = await createServer(container);

      const response = await request(app)
        .put('/authentications')
        .send({ refreshToken: 'invalid_refresh_token' });

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('refresh token tidak valid');
    });

    it('should return 400 if refresh token not registered in database', async () => {
      const app = await createServer(container);
      const refreshToken = await container
        .getInstance(AuthenticationTokenManager.name)
        .createRefreshToken({ username: 'dicoding' });

      const response = await request(app)
        .put('/authentications')
        .send({ refreshToken });

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual(
        'refresh token tidak ditemukan di database',
      );
    });
  });

  describe('when DELETE /authentications', () => {
    it('should response 200 if refresh token valid', async () => {
      const app = await createServer(container);
      const refreshToken = 'refresh_token';
      await AuthenticationsTableTestHelper.addToken(refreshToken);

      const response = await request(app)
        .delete('/authentications')
        .send({ refreshToken });

      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');
    });

    it('should response 400 if refresh token not registered in database', async () => {
      const app = await createServer(container);
      const refreshToken = 'refresh_token';

      const response = await request(app)
        .delete('/authentications')
        .send({ refreshToken });

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual(
        'refresh token tidak ditemukan di database',
      );
    });

    it('should response 400 if payload not contain refresh token', async () => {
      const app = await createServer(container);

      const response = await request(app).delete('/authentications').send({});

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('harus mengirimkan token refresh');
    });
  });

  describe('when GET /threads/:threadId', () => {
    it('should response 200 and return thread detail', async () => {
      // Arrange
      const app = await createServer(container);
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
        title: 'sebuah thread',
        body: 'sebuah body thread',
        owner: 'user-123',
      });

      await CommentsTableTestHelper.addComment({
        id: 'comment-123',
        threadId: 'thread-123',
        content: 'sebuah comment',
        owner: 'user-456',
      });
      await CommentsTableTestHelper.addComment({
        id: 'comment-456',
        threadId: 'thread-123',
        content: 'comment yang akan dihapus',
        owner: 'user-123',
        isDelete: true,
      });
      await RepliesTableTestHelper.addReply({
        id: 'reply-123',
        commentId: 'comment-123',
        content: 'balasan pertama',
        owner: 'user-123',
      });
      await RepliesTableTestHelper.addReply({
        id: 'reply-456',
        commentId: 'comment-123',
        content: 'balasan kedua',
        owner: 'user-456',
        isDelete: true,
      });

      // Action
      const response = await request(app).get('/threads/thread-123');

      // Assert
      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.thread.id).toEqual('thread-123');
      expect(response.body.data.thread.title).toEqual('sebuah thread');
      expect(response.body.data.thread.body).toEqual('sebuah body thread');
      expect(response.body.data.thread.date).toBeDefined();
      expect(response.body.data.thread.username).toEqual('dicoding');

      expect(response.body.data.thread.comments).toHaveLength(2);
      expect(response.body.data.thread.comments[0].id).toEqual('comment-123');
      expect(response.body.data.thread.comments[0].content).toEqual(
        'sebuah comment',
      );
      expect(response.body.data.thread.comments[0].replies).toHaveLength(2);
      expect(response.body.data.thread.comments[0].replies[0].id).toEqual(
        'reply-123',
      );
      expect(response.body.data.thread.comments[0].replies[0].content).toEqual(
        'balasan pertama',
      );
      expect(response.body.data.thread.comments[0].replies[1].id).toEqual(
        'reply-456',
      );
      expect(response.body.data.thread.comments[0].replies[1].content).toEqual(
        '**balasan telah dihapus**',
      );
      expect(response.body.data.thread.comments[1].id).toEqual('comment-456');
      expect(response.body.data.thread.comments[1].content).toEqual(
        '**komentar telah dihapus**',
      );
      expect(response.body.data.thread.comments[1].replies).toStrictEqual([]);
    });

    it('should response 404 when thread not found', async () => {
      // Arrange
      const app = await createServer(container);

      // Action
      const response = await request(app).get('/threads/thread-404');

      // Assert
      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('thread tidak ditemukan');
    });
  });

  describe('when POST /threads', () => {
    it('should response 201 and persisted thread when request is valid', async () => {
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
      const requestPayload = {
        title: 'sebuah thread',
        body: 'isi thread',
      };

      // Action
      const response = await request(app)
        .post('/threads')
        .set(
          'Authorization',
          `Bearer ${authenticationResponse.body.data.accessToken}`,
        )
        .send(requestPayload);

      // Assert
      const { id } = response.body.data.addedThread;
      const thread = await ThreadsTableTestHelper.findThreadsById(id);

      expect(response.status).toEqual(201);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.addedThread.id).toBeDefined();
      expect(response.body.data.addedThread.title).toEqual(
        requestPayload.title,
      );
      expect(response.body.data.addedThread.owner).toBeDefined();
      expect(thread).not.toBeNull();
    });

    it('should response 401 when access token is not provided', async () => {
      // Arrange
      const app = await createServer(container);
      const requestPayload = {
        title: 'sebuah thread',
        body: 'isi thread',
      };

      // Action
      const response = await request(app).post('/threads').send(requestPayload);

      // Assert
      expect(response.status).toEqual(401);
      expect(response.body.status).toEqual('fail');
    });

    it('should response 400 when payload not contain needed property', async () => {
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
      const requestPayload = {
        title: 'sebuah thread',
      };

      // Action
      const response = await request(app)
        .post('/threads')
        .set(
          'Authorization',
          `Bearer ${authenticationResponse.body.data.accessToken}`,
        )
        .send(requestPayload);

      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual(
        'tidak dapat membuat thread baru karena properti yang dibutuhkan tidak ada',
      );
    });

    it('should response 400 when payload not meet data type specification', async () => {
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
      const requestPayload = {
        title: 'sebuah thread',
        body: ['isi thread'],
      };

      // Action
      const response = await request(app)
        .post('/threads')
        .set(
          'Authorization',
          `Bearer ${authenticationResponse.body.data.accessToken}`,
        )
        .send(requestPayload);

      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual(
        'tidak dapat membuat thread baru karena tipe data tidak sesuai',
      );
    });
  });

  describe('when POST /threads/:threadId/comments', () => {
    it('should response 201 and persisted comment when request is valid', async () => {
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
      const threadResponse = await request(app)
        .post('/threads')
        .set(
          'Authorization',
          `Bearer ${authenticationResponse.body.data.accessToken}`,
        )
        .send({
          title: 'sebuah thread',
          body: 'isi thread',
        });
      const requestPayload = {
        content: 'sebuah comment',
      };

      // Action
      const response = await request(app)
        .post(`/threads/${threadResponse.body.data.addedThread.id}/comments`)
        .set(
          'Authorization',
          `Bearer ${authenticationResponse.body.data.accessToken}`,
        )
        .send(requestPayload);

      // Assert
      const { id } = response.body.data.addedComment;
      const comments = await CommentsTableTestHelper.findCommentsById(id);

      expect(response.status).toEqual(201);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.addedComment.id).toBeDefined();
      expect(response.body.data.addedComment.content).toEqual(
        requestPayload.content,
      );
      expect(response.body.data.addedComment.owner).toBeDefined();
      expect(comments).toHaveLength(1);
    });

    it('should response 401 when access token is not provided', async () => {
      // Arrange
      const app = await createServer(container);
      const requestPayload = {
        content: 'sebuah comment',
      };

      // Action
      const response = await request(app)
        .post('/threads/thread-123/comments')
        .send(requestPayload);

      // Assert
      expect(response.status).toEqual(401);
      expect(response.body.status).toEqual('fail');
    });

    it('should response 400 when payload not contain needed property', async () => {
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
      const threadResponse = await request(app)
        .post('/threads')
        .set(
          'Authorization',
          `Bearer ${authenticationResponse.body.data.accessToken}`,
        )
        .send({
          title: 'sebuah thread',
          body: 'isi thread',
        });

      // Action
      const response = await request(app)
        .post(`/threads/${threadResponse.body.data.addedThread.id}/comments`)
        .set(
          'Authorization',
          `Bearer ${authenticationResponse.body.data.accessToken}`,
        )
        .send({});

      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual(
        'tidak dapat membuat comment baru karena properti yang dibutuhkan tidak ada',
      );
    });

    it('should response 400 when payload not meet data type specification', async () => {
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
      const threadResponse = await request(app)
        .post('/threads')
        .set(
          'Authorization',
          `Bearer ${authenticationResponse.body.data.accessToken}`,
        )
        .send({
          title: 'sebuah thread',
          body: 'isi thread',
        });

      // Action
      const response = await request(app)
        .post(`/threads/${threadResponse.body.data.addedThread.id}/comments`)
        .set(
          'Authorization',
          `Bearer ${authenticationResponse.body.data.accessToken}`,
        )
        .send({ content: ['sebuah comment'] });

      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual(
        'tidak dapat membuat comment baru karena tipe data tidak sesuai',
      );
    });

    it('should response 404 when thread not found', async () => {
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

      // Action
      const response = await request(app)
        .post('/threads/thread-404/comments')
        .set(
          'Authorization',
          `Bearer ${authenticationResponse.body.data.accessToken}`,
        )
        .send({ content: 'sebuah comment' });

      // Assert
      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('thread tidak ditemukan');
    });
  });

  describe('when DELETE /threads/:threadId/comments/:commentId', () => {
    it('should response 200 and soft delete comment when request is valid', async () => {
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
      const threadResponse = await request(app)
        .post('/threads')
        .set(
          'Authorization',
          `Bearer ${authenticationResponse.body.data.accessToken}`,
        )
        .send({
          title: 'sebuah thread',
          body: 'isi thread',
        });
      const commentResponse = await request(app)
        .post(`/threads/${threadResponse.body.data.addedThread.id}/comments`)
        .set(
          'Authorization',
          `Bearer ${authenticationResponse.body.data.accessToken}`,
        )
        .send({
          content: 'sebuah comment',
        });

      // Action
      const response = await request(app)
        .delete(
          `/threads/${threadResponse.body.data.addedThread.id}/comments/${commentResponse.body.data.addedComment.id}`,
        )
        .set(
          'Authorization',
          `Bearer ${authenticationResponse.body.data.accessToken}`,
        );

      // Assert
      const comments = await CommentsTableTestHelper.findCommentsById(
        commentResponse.body.data.addedComment.id,
      );

      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');
      expect(comments).toHaveLength(1);
      expect(comments[0].is_delete).toEqual(true);
    });

    it('should response 401 when access token is not provided', async () => {
      // Arrange
      const app = await createServer(container);

      // Action
      const response = await request(app).delete(
        '/threads/thread-123/comments/comment-123',
      );

      // Assert
      expect(response.status).toEqual(401);
      expect(response.body.status).toEqual('fail');
    });

    it('should response 403 when user is not owner of comment', async () => {
      // Arrange
      const app = await createServer(container);
      await request(app).post('/users').send({
        username: 'dicoding',
        password: 'secret',
        fullname: 'Dicoding Indonesia',
      });
      await request(app).post('/users').send({
        username: 'johndoe',
        password: 'secret',
        fullname: 'John Doe',
      });
      const firstUserAuthResponse = await request(app)
        .post('/authentications')
        .send({
          username: 'dicoding',
          password: 'secret',
        });
      const secondUserAuthResponse = await request(app)
        .post('/authentications')
        .send({
          username: 'johndoe',
          password: 'secret',
        });
      const threadResponse = await request(app)
        .post('/threads')
        .set(
          'Authorization',
          `Bearer ${firstUserAuthResponse.body.data.accessToken}`,
        )
        .send({
          title: 'sebuah thread',
          body: 'isi thread',
        });
      const commentResponse = await request(app)
        .post(`/threads/${threadResponse.body.data.addedThread.id}/comments`)
        .set(
          'Authorization',
          `Bearer ${firstUserAuthResponse.body.data.accessToken}`,
        )
        .send({
          content: 'sebuah comment',
        });

      // Action
      const response = await request(app)
        .delete(
          `/threads/${threadResponse.body.data.addedThread.id}/comments/${commentResponse.body.data.addedComment.id}`,
        )
        .set(
          'Authorization',
          `Bearer ${secondUserAuthResponse.body.data.accessToken}`,
        );

      // Assert
      const comments = await CommentsTableTestHelper.findCommentsById(
        commentResponse.body.data.addedComment.id,
      );
      expect(response.status).toEqual(403);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual(
        'anda tidak berhak mengakses resource ini',
      );
      expect(comments).toHaveLength(1);
      expect(comments[0].is_delete).toEqual(false);
    });
  });

  describe('when POST /threads/:threadId/comments/:commentId/replies', () => {
    it('should response 201 and persisted reply when request is valid', async () => {
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
      const threadResponse = await request(app)
        .post('/threads')
        .set(
          'Authorization',
          `Bearer ${authenticationResponse.body.data.accessToken}`,
        )
        .send({
          title: 'sebuah thread',
          body: 'isi thread',
        });
      const commentResponse = await request(app)
        .post(`/threads/${threadResponse.body.data.addedThread.id}/comments`)
        .set(
          'Authorization',
          `Bearer ${authenticationResponse.body.data.accessToken}`,
        )
        .send({
          content: 'sebuah comment',
        });
      const requestPayload = {
        content: 'sebuah balasan',
      };

      // Action
      const response = await request(app)
        .post(
          `/threads/${threadResponse.body.data.addedThread.id}/comments/${commentResponse.body.data.addedComment.id}/replies`,
        )
        .set(
          'Authorization',
          `Bearer ${authenticationResponse.body.data.accessToken}`,
        )
        .send(requestPayload);

      // Assert
      const { id } = response.body.data.addedReply;
      const replies = await RepliesTableTestHelper.findRepliesById(id);

      expect(response.status).toEqual(201);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.addedReply.id).toBeDefined();
      expect(response.body.data.addedReply.content).toEqual(
        requestPayload.content,
      );
      expect(response.body.data.addedReply.owner).toBeDefined();
      expect(replies).toHaveLength(1);
    });

    it('should response 401 when access token is not provided', async () => {
      // Arrange
      const app = await createServer(container);
      const requestPayload = {
        content: 'sebuah balasan',
      };

      // Action
      const response = await request(app)
        .post('/threads/thread-123/comments/comment-123/replies')
        .send(requestPayload);

      // Assert
      expect(response.status).toEqual(401);
      expect(response.body.status).toEqual('fail');
    });

    it('should response 400 when payload not contain needed property', async () => {
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
      const threadResponse = await request(app)
        .post('/threads')
        .set(
          'Authorization',
          `Bearer ${authenticationResponse.body.data.accessToken}`,
        )
        .send({
          title: 'sebuah thread',
          body: 'isi thread',
        });
      const commentResponse = await request(app)
        .post(`/threads/${threadResponse.body.data.addedThread.id}/comments`)
        .set(
          'Authorization',
          `Bearer ${authenticationResponse.body.data.accessToken}`,
        )
        .send({
          content: 'sebuah comment',
        });

      // Action
      const response = await request(app)
        .post(
          `/threads/${threadResponse.body.data.addedThread.id}/comments/${commentResponse.body.data.addedComment.id}/replies`,
        )
        .set(
          'Authorization',
          `Bearer ${authenticationResponse.body.data.accessToken}`,
        )
        .send({});

      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual(
        'tidak dapat membuat reply baru karena properti yang dibutuhkan tidak ada',
      );
    });

    it('should response 400 when payload not meet data type specification', async () => {
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
      const threadResponse = await request(app)
        .post('/threads')
        .set(
          'Authorization',
          `Bearer ${authenticationResponse.body.data.accessToken}`,
        )
        .send({
          title: 'sebuah thread',
          body: 'isi thread',
        });
      const commentResponse = await request(app)
        .post(`/threads/${threadResponse.body.data.addedThread.id}/comments`)
        .set(
          'Authorization',
          `Bearer ${authenticationResponse.body.data.accessToken}`,
        )
        .send({
          content: 'sebuah comment',
        });

      // Action
      const response = await request(app)
        .post(
          `/threads/${threadResponse.body.data.addedThread.id}/comments/${commentResponse.body.data.addedComment.id}/replies`,
        )
        .set(
          'Authorization',
          `Bearer ${authenticationResponse.body.data.accessToken}`,
        )
        .send({ content: ['sebuah balasan'] });

      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual(
        'tidak dapat membuat reply baru karena tipe data tidak sesuai',
      );
    });

    it('should response 404 when comment not found in thread', async () => {
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
      const threadResponse = await request(app)
        .post('/threads')
        .set(
          'Authorization',
          `Bearer ${authenticationResponse.body.data.accessToken}`,
        )
        .send({
          title: 'sebuah thread',
          body: 'isi thread',
        });

      // Action
      const response = await request(app)
        .post(
          `/threads/${threadResponse.body.data.addedThread.id}/comments/comment-404/replies`,
        )
        .set(
          'Authorization',
          `Bearer ${authenticationResponse.body.data.accessToken}`,
        )
        .send({ content: 'sebuah balasan' });

      // Assert
      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('komentar tidak ditemukan');
    });
  });

  describe('when DELETE /threads/:threadId/comments/:commentId/replies/:replyId', () => {
    it('should response 200 and soft delete reply when request is valid', async () => {
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
      const threadResponse = await request(app)
        .post('/threads')
        .set(
          'Authorization',
          `Bearer ${authenticationResponse.body.data.accessToken}`,
        )
        .send({
          title: 'sebuah thread',
          body: 'isi thread',
        });
      const commentResponse = await request(app)
        .post(`/threads/${threadResponse.body.data.addedThread.id}/comments`)
        .set(
          'Authorization',
          `Bearer ${authenticationResponse.body.data.accessToken}`,
        )
        .send({
          content: 'sebuah comment',
        });
      const replyResponse = await request(app)
        .post(
          `/threads/${threadResponse.body.data.addedThread.id}/comments/${commentResponse.body.data.addedComment.id}/replies`,
        )
        .set(
          'Authorization',
          `Bearer ${authenticationResponse.body.data.accessToken}`,
        )
        .send({
          content: 'sebuah balasan',
        });

      // Action
      const response = await request(app)
        .delete(
          `/threads/${threadResponse.body.data.addedThread.id}/comments/${commentResponse.body.data.addedComment.id}/replies/${replyResponse.body.data.addedReply.id}`,
        )
        .set(
          'Authorization',
          `Bearer ${authenticationResponse.body.data.accessToken}`,
        );

      // Assert
      const replies = await RepliesTableTestHelper.findRepliesById(
        replyResponse.body.data.addedReply.id,
      );

      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');
      expect(replies).toHaveLength(1);
      expect(replies[0].is_delete).toEqual(true);
    });

    it('should response 401 when access token is not provided', async () => {
      // Arrange
      const app = await createServer(container);

      // Action
      const response = await request(app).delete(
        '/threads/thread-123/comments/comment-123/replies/reply-123',
      );

      // Assert
      expect(response.status).toEqual(401);
      expect(response.body.status).toEqual('fail');
    });

    it('should response 403 when user is not owner of reply', async () => {
      // Arrange
      const app = await createServer(container);
      await request(app).post('/users').send({
        username: 'dicoding',
        password: 'secret',
        fullname: 'Dicoding Indonesia',
      });
      await request(app).post('/users').send({
        username: 'johndoe',
        password: 'secret',
        fullname: 'John Doe',
      });
      const firstUserAuthResponse = await request(app)
        .post('/authentications')
        .send({
          username: 'dicoding',
          password: 'secret',
        });
      const secondUserAuthResponse = await request(app)
        .post('/authentications')
        .send({
          username: 'johndoe',
          password: 'secret',
        });
      const threadResponse = await request(app)
        .post('/threads')
        .set(
          'Authorization',
          `Bearer ${firstUserAuthResponse.body.data.accessToken}`,
        )
        .send({
          title: 'sebuah thread',
          body: 'isi thread',
        });
      const commentResponse = await request(app)
        .post(`/threads/${threadResponse.body.data.addedThread.id}/comments`)
        .set(
          'Authorization',
          `Bearer ${firstUserAuthResponse.body.data.accessToken}`,
        )
        .send({
          content: 'sebuah comment',
        });
      const replyResponse = await request(app)
        .post(
          `/threads/${threadResponse.body.data.addedThread.id}/comments/${commentResponse.body.data.addedComment.id}/replies`,
        )
        .set(
          'Authorization',
          `Bearer ${firstUserAuthResponse.body.data.accessToken}`,
        )
        .send({
          content: 'sebuah balasan',
        });

      // Action
      const response = await request(app)
        .delete(
          `/threads/${threadResponse.body.data.addedThread.id}/comments/${commentResponse.body.data.addedComment.id}/replies/${replyResponse.body.data.addedReply.id}`,
        )
        .set(
          'Authorization',
          `Bearer ${secondUserAuthResponse.body.data.accessToken}`,
        );

      // Assert
      const replies = await RepliesTableTestHelper.findRepliesById(
        replyResponse.body.data.addedReply.id,
      );
      expect(response.status).toEqual(403);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual(
        'anda tidak berhak mengakses resource ini',
      );
      expect(replies).toHaveLength(1);
      expect(replies[0].is_delete).toEqual(false);
    });
  });

  it('should handle server error correctly', async () => {
    // Arrange
    const requestPayload = {
      username: 'dicoding',
      fullname: 'Dicoding Indonesia',
      password: 'super_secret',
    };
    const app = await createServer({});

    // Action
    const response = await request(app).post('/users').send(requestPayload);

    // Assert
    expect(response.status).toEqual(500);
    expect(response.body.status).toEqual('error');
    expect(response.body.message).toEqual('terjadi kegagalan pada server kami');
  });
});
