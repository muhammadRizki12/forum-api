import UserLogin from '../../Domains/users/entities/UserLogin.js';
import NewAuthentication from '../../Domains/authentications/entities/NewAuth.js';

class AuthenticationUseCase {
  constructor({
    userRepository,
    authenticationRepository,
    authenticationTokenManager,
    passwordHash,
  }) {
    this._userRepository = userRepository;
    this._authenticationRepository = authenticationRepository;
    this._authenticationTokenManager = authenticationTokenManager;
    this._passwordHash = passwordHash;
  }

  async login(useCasePayload) {
    const { username, password } = new UserLogin(useCasePayload);

    const encryptedPassword =
      await this._userRepository.getPasswordByUsername(username);

    await this._passwordHash.comparePassword(password, encryptedPassword);

    const id = await this._userRepository.getIdByUsername(username);

    const accessToken =
      await this._authenticationTokenManager.createAccessToken({
        username,
        id,
      });
    const refreshToken =
      await this._authenticationTokenManager.createRefreshToken({
        username,
        id,
      });

    const newAuthentication = new NewAuthentication({
      accessToken,
      refreshToken,
    });

    await this._authenticationRepository.addToken(
      newAuthentication.refreshToken,
    );

    return newAuthentication;
  }

  async refresh(useCasePayload) {
    this._validateRefreshPayload(useCasePayload);
    const { refreshToken } = useCasePayload;

    await this._authenticationTokenManager.verifyRefreshToken(refreshToken);
    await this._authenticationRepository.checkAvailabilityToken(refreshToken);

    const { username, id } =
      await this._authenticationTokenManager.decodePayload(refreshToken);

    return this._authenticationTokenManager.createAccessToken({ username, id });
  }

  async logout(useCasePayload) {
    this._validateLogoutPayload(useCasePayload);
    const { refreshToken } = useCasePayload;
    await this._authenticationRepository.checkAvailabilityToken(refreshToken);
    await this._authenticationRepository.deleteToken(refreshToken);
  }

  _validateRefreshPayload(payload) {
    const { refreshToken } = payload;

    if (!refreshToken) {
      throw new Error(
        'REFRESH_AUTHENTICATION_USE_CASE.NOT_CONTAIN_REFRESH_TOKEN',
      );
    }

    if (typeof refreshToken !== 'string') {
      throw new Error(
        'REFRESH_AUTHENTICATION_USE_CASE.PAYLOAD_NOT_MEET_DATA_TYPE_SPECIFICATION',
      );
    }
  }

  _validateLogoutPayload(payload) {
    const { refreshToken } = payload;
    if (!refreshToken) {
      throw new Error(
        'DELETE_AUTHENTICATION_USE_CASE.NOT_CONTAIN_REFRESH_TOKEN',
      );
    }

    if (typeof refreshToken !== 'string') {
      throw new Error(
        'DELETE_AUTHENTICATION_USE_CASE.PAYLOAD_NOT_MEET_DATA_TYPE_SPECIFICATION',
      );
    }
  }
}

export default AuthenticationUseCase;
