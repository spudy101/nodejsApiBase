// test/unit/middlewares/validateRequest.test.js
const { validateRequest } = require('../../../src/middlewares/validateRequest');
const { validationResult } = require('express-validator');
const { validationErrorResponse } = require('../../../src/utils/responseHandler');

jest.mock('express-validator');
jest.mock('../../../src/utils/responseHandler');
jest.mock('../../../src/utils/logger');

describe('ValidateRequest Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      originalUrl: '/api/users',
      method: 'POST',
      user: {
        id: 'user-123'
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('debe llamar a next si no hay errores de validación', () => {
    // ARRANGE
    validationResult.mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(true),
      array: jest.fn().mockReturnValue([])
    });

    // ACT
    validateRequest(req, res, next);

    // ASSERT
    expect(next).toHaveBeenCalled();
    expect(validationErrorResponse).not.toHaveBeenCalled();
  });

  it('debe retornar errores si hay errores de validación', () => {
    // ARRANGE
    const errors = [
      {
        msg: 'El email es requerido',
        param: 'email',
        location: 'body'
      },
      {
        msg: 'El password debe tener al menos 6 caracteres',
        param: 'password',
        location: 'body'
      }
    ];

    validationResult.mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(false),
      array: jest.fn().mockReturnValue(errors)
    });

    validationErrorResponse.mockImplementation((res, errors) => {
      res.status(400).json({ errors });
    });

    // ACT
    validateRequest(req, res, next);

    // ASSERT
    expect(validationErrorResponse).toHaveBeenCalledWith(res, errors);
    expect(next).not.toHaveBeenCalled();
  });

  it('debe pasar errores formateados a validationErrorResponse', () => {
    // ARRANGE
    const errors = [
      {
        msg: 'Campo inválido',
        param: 'name',
        location: 'body'
      }
    ];

    validationResult.mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(false),
      array: jest.fn().mockReturnValue(errors)
    });

    validationErrorResponse.mockImplementation((res, errors) => {
      res.status(400).json({ errors });
    });

    // ACT
    validateRequest(req, res, next);

    // ASSERT
    expect(validationErrorResponse).toHaveBeenCalledWith(
      res,
      expect.arrayContaining([
        expect.objectContaining({
          msg: 'Campo inválido',
          param: 'name'
        })
      ])
    );
  });

  it('debe llamar a validationResult con el request', () => {
    // ARRANGE
    validationResult.mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(true),
      array: jest.fn().mockReturnValue([])
    });

    // ACT
    validateRequest(req, res, next);

    // ASSERT
    expect(validationResult).toHaveBeenCalledWith(req);
  });

  it('debe manejar múltiples errores de validación', () => {
    // ARRANGE
    const errors = [
      { msg: 'Error 1', param: 'field1' },
      { msg: 'Error 2', param: 'field2' },
      { msg: 'Error 3', param: 'field3' },
      { msg: 'Error 4', param: 'field4' }
    ];

    validationResult.mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(false),
      array: jest.fn().mockReturnValue(errors)
    });

    validationErrorResponse.mockImplementation((res, errors) => {
      res.status(400).json({ errors });
    });

    // ACT
    validateRequest(req, res, next);

    // ASSERT
    expect(validationErrorResponse).toHaveBeenCalledWith(res, errors);
    expect(errors).toHaveLength(4);
  });

  it('debe manejar errores con campo path', () => {
    // ARRANGE
    const errors = [
      {
        msg: 'ID inválido',
        path: 'userId', // Usa 'path' en lugar de 'param'
        location: 'params'
      }
    ];

    validationResult.mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(false),
      array: jest.fn().mockReturnValue(errors)
    });

    validationErrorResponse.mockImplementation((res, errors) => {
      res.status(400).json({ errors });
    });

    // ACT
    validateRequest(req, res, next);

    // ASSERT
    expect(validationErrorResponse).toHaveBeenCalled();
  });

  it('debe manejar errores de diferentes ubicaciones', () => {
    // ARRANGE
    const errors = [
      { msg: 'Error en body', param: 'name', location: 'body' },
      { msg: 'Error en params', param: 'id', location: 'params' },
      { msg: 'Error en query', param: 'page', location: 'query' },
      { msg: 'Error en headers', param: 'authorization', location: 'headers' }
    ];

    validationResult.mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(false),
      array: jest.fn().mockReturnValue(errors)
    });

    validationErrorResponse.mockImplementation((res, errors) => {
      res.status(400).json({ errors });
    });

    // ACT
    validateRequest(req, res, next);

    // ASSERT
    expect(validationErrorResponse).toHaveBeenCalledWith(res, errors);
  });

  it('debe no llamar a next si hay errores', () => {
    // ARRANGE
    const errors = [
      { msg: 'Error de validación', param: 'field' }
    ];

    validationResult.mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(false),
      array: jest.fn().mockReturnValue(errors)
    });

    validationErrorResponse.mockImplementation((res, errors) => {
      res.status(400).json({ errors });
    });

    // ACT
    validateRequest(req, res, next);

    // ASSERT
    expect(next).not.toHaveBeenCalled();
  });

  it('debe funcionar sin userId en request', () => {
    // ARRANGE
    req.user = undefined;

    validationResult.mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(true),
      array: jest.fn().mockReturnValue([])
    });

    // ACT
    validateRequest(req, res, next);

    // ASSERT
    expect(next).toHaveBeenCalled();
  });

  it('debe manejar errores de validación personalizados', () => {
    // ARRANGE
    const customErrors = [
      {
        msg: 'El precio debe ser mayor a 0',
        param: 'price',
        value: -100,
        location: 'body'
      },
      {
        msg: 'El stock no puede ser negativo',
        param: 'stock',
        value: -50,
        location: 'body'
      }
    ];

    validationResult.mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(false),
      array: jest.fn().mockReturnValue(customErrors)
    });

    validationErrorResponse.mockImplementation((res, errors) => {
      res.status(400).json({ errors });
    });

    // ACT
    validateRequest(req, res, next);

    // ASSERT
    expect(validationErrorResponse).toHaveBeenCalledWith(res, customErrors);
  });

  it('debe preservar toda la información del error', () => {
    // ARRANGE
    const detailedError = [
      {
        msg: 'Email inválido',
        param: 'email',
        value: 'invalid-email',
        location: 'body',
        nestedErrors: []
      }
    ];

    validationResult.mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(false),
      array: jest.fn().mockReturnValue(detailedError)
    });

    validationErrorResponse.mockImplementation((res, errors) => {
      res.status(400).json({ errors });
    });

    // ACT
    validateRequest(req, res, next);

    // ASSERT
    expect(validationErrorResponse).toHaveBeenCalledWith(
      res,
      expect.arrayContaining([
        expect.objectContaining({
          msg: 'Email inválido',
          param: 'email',
          value: 'invalid-email'
        })
      ])
    );
  });

  it('debe manejar array vacío de errores como sin errores', () => {
    // ARRANGE
    validationResult.mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(true),
      array: jest.fn().mockReturnValue([])
    });

    // ACT
    validateRequest(req, res, next);

    // ASSERT
    expect(next).toHaveBeenCalled();
    expect(validationErrorResponse).not.toHaveBeenCalled();
  });
});