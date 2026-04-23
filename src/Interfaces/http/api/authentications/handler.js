import AuthenticationUseCase from '../../../../Applications/use_case/AuthenticationUseCase.js';

class AuthenticationsHandler {
  constructor(container) {
    this._container = container;

    this.postAuthenticationHandler = this.postAuthenticationHandler.bind(this);
    this.putAuthenticationHandler = this.putAuthenticationHandler.bind(this);
    this.deleteAuthenticationHandler =
      this.deleteAuthenticationHandler.bind(this);
  }

  async postAuthenticationHandler(req, res, next) {
    try {
      const authenticationUseCase = this._container.getInstance(
        AuthenticationUseCase.name,
      );
      const { accessToken, refreshToken } = await authenticationUseCase.login(
        req.body,
      );

      res.status(201).json({
        status: 'success',
        data: {
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async putAuthenticationHandler(req, res, next) {
    try {
      const authenticationUseCase = this._container.getInstance(
        AuthenticationUseCase.name,
      );
      const accessToken = await authenticationUseCase.refresh(req.body);

      res.json({
        status: 'success',
        data: {
          accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAuthenticationHandler(req, res, next) {
    try {
      const authenticationUseCase = this._container.getInstance(
        AuthenticationUseCase.name,
      );
      await authenticationUseCase.logout(req.body);

      res.json({
        status: 'success',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default AuthenticationsHandler;
