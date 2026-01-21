import { Request, Response } from 'express';
import { RequestLoggerMiddleware } from './request-logger.middleware';

describe('RequestLoggerMiddleware', () => {
  let middleware: RequestLoggerMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    middleware = new RequestLoggerMiddleware();
    mockNext = jest.fn();

    mockRequest = {
      method: 'GET',
      originalUrl: '/api/users',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Mozilla/5.0'),
    };

    mockResponse = {
      statusCode: 200,
      get: jest.fn().mockReturnValue('1234'),
      on: jest.fn(),
    };
  });

  it('should call next function', () => {
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should register finish event listener on response', () => {
    middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.on).toHaveBeenCalledWith(
      'finish',
      expect.any(Function),
    );
  });

  it('should handle missing user-agent', () => {
    (mockRequest.get as jest.Mock).mockReturnValue(undefined);

    expect(() => {
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );
    }).not.toThrow();
  });

  it('should handle missing content-length', () => {
    (mockResponse.get as jest.Mock).mockReturnValue(undefined);

    expect(() => {
      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );
    }).not.toThrow();
  });

  describe('logging levels', () => {
    let finishCallback: () => void;

    beforeEach(() => {
      (mockResponse.on as jest.Mock).mockImplementation(
        (event: string, callback: () => void) => {
          if (event === 'finish') {
            finishCallback = callback;
          }
        },
      );
    });

    it('should log at appropriate level for 2xx responses', () => {
      mockResponse.statusCode = 200;
      const logSpy = jest
        .spyOn(middleware['logger'], 'log')
        .mockImplementation();

      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );
      finishCallback();

      expect(logSpy).toHaveBeenCalled();
    });

    it('should log warning for 4xx responses', () => {
      mockResponse.statusCode = 404;
      const warnSpy = jest
        .spyOn(middleware['logger'], 'warn')
        .mockImplementation();

      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );
      finishCallback();

      expect(warnSpy).toHaveBeenCalled();
    });

    it('should log error for 5xx responses', () => {
      mockResponse.statusCode = 500;
      const errorSpy = jest
        .spyOn(middleware['logger'], 'error')
        .mockImplementation();

      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );
      finishCallback();

      expect(errorSpy).toHaveBeenCalled();
    });
  });
});
