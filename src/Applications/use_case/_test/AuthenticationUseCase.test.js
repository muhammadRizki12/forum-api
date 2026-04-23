import { vi } from 'vitest';
import UserRepository from '../../../Domains/users/UserRepository.js';
import AuthenticationRepository from '../../../Domains/authentications/AuthenticationRepository.js';
import AuthenticationTokenManager from '../../security/AuthenticationTokenManager.js';
import PasswordHash from '../../security/PasswordHash.js';
import NewAuth from '../../../Domains/authentications/entities/NewAuth.js';
import AuthenticationUseCase from '../AuthenticationUseCase.js';

describe('AuthenticationUseCase', () => {
  describe('login', () => {
    it('should orchestrating the get authentication action correctly', async () => {
      // Arrange
      const useCasePayload = {
        username: 'dicoding',
        password: 'secret',
      };
      const mockedAuthentication = new NewAuth({
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
      });
      const mockUserRepository = new UserRepository();
      const mockAuthenticationRepository = new AuthenticationRepository();
      const mockAuthenticationTokenManager = new AuthenticationTokenManager();
      const mockPasswordHash = new PasswordHash();

      // Mocking
      mockUserRepository.getPasswordByUsername = vi
        .fn()
        .mockImplementation(() => Promise.resolve('encrypted_password'));
      mockPasswordHash.comparePassword = vi
        .fn()
        .mockImplementation(() => Promise.resolve());
      mockAuthenticationTokenManager.createAccessToken = vi
        .fn()
        .mockImplementation(() =>
          Promise.resolve(mockedAuthentication.accessToken),
        );
      mockAuthenticationTokenManager.createRefreshToken = vi
        .fn()
        .mockImplementation(() =>
          Promise.resolve(mockedAuthentication.refreshToken),
        );
      mockUserRepository.getIdByUsername = vi
        .fn()
        .mockImplementation(() => Promise.resolve('user-123'));
      mockAuthenticationRepository.addToken = vi
        .fn()
        .mockImplementation(() => Promise.resolve());

      // create use case instance
      const authenticationUseCase = new AuthenticationUseCase({
        userRepository: mockUserRepository,
        authenticationRepository: mockAuthenticationRepository,
        authenticationTokenManager: mockAuthenticationTokenManager,
        passwordHash: mockPasswordHash,
      });

      // Action
      const actualAuthentication =
        await authenticationUseCase.login(useCasePayload);

      // Assert
      expect(actualAuthentication).toEqual(
        new NewAuth({
          accessToken: 'access_token',
          refreshToken: 'refresh_token',
        }),
      );
      expect(mockUserRepository.getPasswordByUsername).toBeCalledWith(
        'dicoding',
      );
      expect(mockPasswordHash.comparePassword).toBeCalledWith(
        'secret',
        'encrypted_password',
      );
      expect(mockUserRepository.getIdByUsername).toBeCalledWith('dicoding');
      expect(mockAuthenticationTokenManager.createAccessToken).toBeCalledWith({
        username: 'dicoding',
        id: 'user-123',
      });
      expect(mockAuthenticationTokenManager.createRefreshToken).toBeCalledWith({
        username: 'dicoding',
        id: 'user-123',
      });
      expect(mockAuthenticationRepository.addToken).toBeCalledWith(
        mockedAuthentication.refreshToken,
      );
    });
  });

  describe('refresh', () => {
    it('should throw error if use case payload not contain refresh token', async () => {
      // Arrange
      const useCasePayload = {};
      const authenticationUseCase = new AuthenticationUseCase({});

      // Action & Assert
      await expect(
        authenticationUseCase.refresh(useCasePayload),
      ).rejects.toThrowError(
        'REFRESH_AUTHENTICATION_USE_CASE.NOT_CONTAIN_REFRESH_TOKEN',
      );
    });

    it('should throw error if refresh token not string', async () => {
      // Arrange
      const useCasePayload = {
        refreshToken: 1,
      };
      const authenticationUseCase = new AuthenticationUseCase({});

      // Action & Assert
      await expect(
        authenticationUseCase.refresh(useCasePayload),
      ).rejects.toThrowError(
        'REFRESH_AUTHENTICATION_USE_CASE.PAYLOAD_NOT_MEET_DATA_TYPE_SPECIFICATION',
      );
    });

    it('should orchestrating the refresh authentication action correctly', async () => {
      // Arrange
      const useCasePayload = {
        refreshToken: 'some_refresh_token',
      };
      const mockAuthenticationRepository = new AuthenticationRepository();
      const mockAuthenticationTokenManager = new AuthenticationTokenManager();

      // Mocking
      mockAuthenticationRepository.checkAvailabilityToken = vi
        .fn()
        .mockImplementation(() => Promise.resolve());
      mockAuthenticationTokenManager.verifyRefreshToken = vi
        .fn()
        .mockImplementation(() => Promise.resolve());
      mockAuthenticationTokenManager.decodePayload = vi
        .fn()
        .mockImplementation(() =>
          Promise.resolve({ username: 'dicoding', id: 'user-123' }),
        );
      mockAuthenticationTokenManager.createAccessToken = vi
        .fn()
        .mockImplementation(() => Promise.resolve('some_new_access_token'));

      // Create the use case instance
      const authenticationUseCase = new AuthenticationUseCase({
        authenticationRepository: mockAuthenticationRepository,
        authenticationTokenManager: mockAuthenticationTokenManager,
      });

      // Action
      const accessToken = await authenticationUseCase.refresh(useCasePayload);

      // Assert
      expect(mockAuthenticationTokenManager.verifyRefreshToken).toBeCalledWith(
        useCasePayload.refreshToken,
      );
      expect(
        mockAuthenticationRepository.checkAvailabilityToken,
      ).toBeCalledWith(useCasePayload.refreshToken);
      expect(mockAuthenticationTokenManager.decodePayload).toBeCalledWith(
        useCasePayload.refreshToken,
      );
      expect(mockAuthenticationTokenManager.createAccessToken).toBeCalledWith({
        username: 'dicoding',
        id: 'user-123',
      });
      expect(accessToken).toEqual('some_new_access_token');
    });
  });

  describe('logout', () => {
    it('should throw error if use case payload not contain refresh token', async () => {
      // Arrange
      const useCasePayload = {};
      const authenticationUseCase = new AuthenticationUseCase({});

      // Action & Assert
      await expect(
        authenticationUseCase.logout(useCasePayload),
      ).rejects.toThrowError(
        'DELETE_AUTHENTICATION_USE_CASE.NOT_CONTAIN_REFRESH_TOKEN',
      );
    });

    it('should throw error if refresh token not string', async () => {
      // Arrange
      const useCasePayload = {
        refreshToken: 123,
      };
      const authenticationUseCase = new AuthenticationUseCase({});

      // Action & Assert
      await expect(
        authenticationUseCase.logout(useCasePayload),
      ).rejects.toThrowError(
        'DELETE_AUTHENTICATION_USE_CASE.PAYLOAD_NOT_MEET_DATA_TYPE_SPECIFICATION',
      );
    });

    it('should orchestrating the delete authentication action correctly', async () => {
      // Arrange
      const useCasePayload = {
        refreshToken: 'refreshToken',
      };
      const mockAuthenticationRepository = new AuthenticationRepository();
      mockAuthenticationRepository.checkAvailabilityToken = vi
        .fn()
        .mockImplementation(() => Promise.resolve());
      mockAuthenticationRepository.deleteToken = vi
        .fn()
        .mockImplementation(() => Promise.resolve());

      const authenticationUseCase = new AuthenticationUseCase({
        authenticationRepository: mockAuthenticationRepository,
      });

      // Act
      await authenticationUseCase.logout(useCasePayload);

      // Assert
      expect(
        mockAuthenticationRepository.checkAvailabilityToken,
      ).toHaveBeenCalledWith(useCasePayload.refreshToken);
      expect(mockAuthenticationRepository.deleteToken).toHaveBeenCalledWith(
        useCasePayload.refreshToken,
      );
    });
  });
});
