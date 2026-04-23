/* istanbul ignore file */

import { createContainer } from 'instances-container';

// external agency
import { nanoid } from 'nanoid';
import bcrypt from 'bcrypt';
import pool from './database/postgres/pool.js';
import jwt from 'jsonwebtoken';

// service (repository, helper, manager, etc)
import UserRepository from '../Domains/users/UserRepository.js';
import PasswordHash from '../Applications/security/PasswordHash.js';
import UserRepositoryPostgres from './repository/UserRepositoryPostgres.js';
import BcryptPasswordHash from './security/BcryptPasswordHash.js';

// use case
import AddUserUseCase from '../Applications/use_case/AddUserUseCase.js';
import AuthenticationTokenManager from '../Applications/security/AuthenticationTokenManager.js';
import JwtTokenManager from './security/JwtTokenManager.js';
import AuthenticationUseCase from '../Applications/use_case/AuthenticationUseCase.js';
import AuthenticationRepository from '../Domains/authentications/AuthenticationRepository.js';
import AuthenticationRepositoryPostgres from './repository/AuthenticationRepositoryPostgres.js';
import ThreadRepository from '../Domains/threads/ThreadRepository.js';
import ThreadRepositoryPostgres from './repository/ThreadRepositoryPostgres.js';
import ThreadUseCase from '../Applications/use_case/ThreadUseCase.js';
import CommentRepository from '../Domains/comments/CommentRepository.js';
import CommentRepositoryPostgres from './repository/CommentRepositoryPostgres.js';
import CommentUseCase from '../Applications/use_case/CommentUseCase.js';
import ReplyRepository from '../Domains/replies/ReplyRepository.js';
import ReplyRepositoryPostgres from './repository/ReplyRepositoryPostgres.js';
import ReplyUseCase from '../Applications/use_case/ReplyUseCase.js';

// creating container
const container = createContainer();

// registering services and repository
container.register([
  {
    key: UserRepository.name,
    Class: UserRepositoryPostgres,
    parameter: {
      dependencies: [
        {
          concrete: pool,
        },
        {
          concrete: nanoid,
        },
      ],
    },
  },
  {
    key: AuthenticationRepository.name,
    Class: AuthenticationRepositoryPostgres,
    parameter: {
      dependencies: [
        {
          concrete: pool,
        },
      ],
    },
  },
  {
    key: ThreadRepository.name,
    Class: ThreadRepositoryPostgres,
    parameter: {
      dependencies: [
        {
          concrete: pool,
        },
        {
          concrete: nanoid,
        },
      ],
    },
  },
  {
    key: CommentRepository.name,
    Class: CommentRepositoryPostgres,
    parameter: {
      dependencies: [
        {
          concrete: pool,
        },
        {
          concrete: nanoid,
        },
      ],
    },
  },
  {
    key: ReplyRepository.name,
    Class: ReplyRepositoryPostgres,
    parameter: {
      dependencies: [
        {
          concrete: pool,
        },
        {
          concrete: nanoid,
        },
      ],
    },
  },
  {
    key: PasswordHash.name,
    Class: BcryptPasswordHash,
    parameter: {
      dependencies: [
        {
          concrete: bcrypt,
        },
      ],
    },
  },
  {
    key: AuthenticationTokenManager.name,
    Class: JwtTokenManager,
    parameter: {
      dependencies: [
        {
          concrete: jwt,
        },
      ],
    },
  },
]);

// registering use cases
container.register([
  {
    key: AddUserUseCase.name,
    Class: AddUserUseCase,
    parameter: {
      injectType: 'destructuring',
      dependencies: [
        {
          name: 'userRepository',
          internal: UserRepository.name,
        },
        {
          name: 'passwordHash',
          internal: PasswordHash.name,
        },
      ],
    },
  },
  {
    key: AuthenticationUseCase.name,
    Class: AuthenticationUseCase,
    parameter: {
      injectType: 'destructuring',
      dependencies: [
        {
          name: 'userRepository',
          internal: UserRepository.name,
        },
        {
          name: 'authenticationRepository',
          internal: AuthenticationRepository.name,
        },
        {
          name: 'authenticationTokenManager',
          internal: AuthenticationTokenManager.name,
        },
        {
          name: 'passwordHash',
          internal: PasswordHash.name,
        },
      ],
    },
  },
  {
    key: ThreadUseCase.name,
    Class: ThreadUseCase,
    parameter: {
      injectType: 'destructuring',
      dependencies: [
        {
          name: 'threadRepository',
          internal: ThreadRepository.name,
        },
      ],
    },
  },
  {
    key: CommentUseCase.name,
    Class: CommentUseCase,
    parameter: {
      injectType: 'destructuring',
      dependencies: [
        {
          name: 'threadRepository',
          internal: ThreadRepository.name,
        },
        {
          name: 'commentRepository',
          internal: CommentRepository.name,
        },
      ],
    },
  },
  {
    key: ReplyUseCase.name,
    Class: ReplyUseCase,
    parameter: {
      injectType: 'destructuring',
      dependencies: [
        {
          name: 'threadRepository',
          internal: ThreadRepository.name,
        },
        {
          name: 'commentRepository',
          internal: CommentRepository.name,
        },
        {
          name: 'replyRepository',
          internal: ReplyRepository.name,
        },
      ],
    },
  },
]);

export default container;
