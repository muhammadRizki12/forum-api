import ThreadUseCase from '../../../../Applications/use_case/ThreadUseCase.js';

class ThreadsHandler {
  constructor(container) {
    this._container = container;

    this.postThreadHandler = this.postThreadHandler.bind(this);
    this.getThreadDetailHandler = this.getThreadDetailHandler.bind(this);
  }

  async postThreadHandler(req, res, next) {
    try {
      const threadUseCase = this._container.getInstance(ThreadUseCase.name);
      const { id: owner } = req.auth.credentials;
      const addedThread = await threadUseCase.add(req.body, owner);

      res.status(201).json({
        status: 'success',
        data: {
          addedThread,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getThreadDetailHandler(req, res, next) {
    try {
      const threadUseCase = this._container.getInstance(ThreadUseCase.name);

      const { threadId } = req.params;
      const thread = await threadUseCase.getDetail(threadId);

      res.json({
        status: 'success',
        data: {
          thread,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ThreadsHandler;
