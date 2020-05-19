import accessControl from '../src/controllers/access';

describe('access control middleware', () => {
  it('rejects a call for which the user is not in the correct role', () => {
    const user = {
      role: 'viewer',
    };
    const url = '/sources';
    const method = 'GET';
    const rbacConfig = {
      [url]: {
        [method]: ['curator'],
      },
    };
    const req = { 
      user,
      url,
      method,
    };
    const res = {
      sendStatus: jest.fn(),
    };
    const next = jest.fn();

    const access = accessControl(rbacConfig);

    access(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.sendStatus).toHaveBeenCalledWith(403);
  });

  it('permits a call for which the user is in an allowed role', () => {
    const user = {
      role: 'curator',
    };
    const url = '/sources';
    const method = 'GET';
    const rbacConfig = {
      [url]: {
        [method]: ['curator'],
      },
    };
    const req = { 
      user,
      url,
      method,
    };
    const res = {
      sendStatus: jest.fn(),
    };
    const next = jest.fn();

    const access = accessControl(rbacConfig);

    access(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.sendStatus).not.toHaveBeenCalled();
  });

  it('chooses the correct list of expected roles based on the HTTP method', () => {
    const user = {
      role: 'viewer',
    };
    const url = '/sources';
    const method = 'POST';
    const rbacConfig = {
      [url]: {
        'GET': ['viewer'],
        'POST': ['admin'],
      },
    };
    const req = { 
      user,
      url,
      method,
    };
    const res = {
      sendStatus: jest.fn(),
    };
    const next = jest.fn();

    const access = accessControl(rbacConfig);

    access(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.sendStatus).toHaveBeenCalledWith(403);
  });

  it('can match the URL to its configuration using a regex', () => {
    const user = {
      role: 'viewer',
    };
    const url = '/sources/c4fe';
    const method = 'GET';
    const rbacConfig = {
      '/sources/[a-z0-9]{4}': {
        'GET': ['viewer'],
        'POST': ['admin'],
      },
    };
    const req = { 
      user,
      url,
      method,
    };
    const res = {
      sendStatus: jest.fn(),
    };
    const next = jest.fn();

    const access = accessControl(rbacConfig);

    access(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.sendStatus).not.toHaveBeenCalled();
  });

  it('has an internal server error if there is no access control for a route', () => {
    const user = {
      role: 'curator',
    };
    const url = '/sources';
    const method = 'DELETE';
    const rbacConfig = {};
    const req = {
      user,
      method,
      url,
    };
    const res = {
      sendStatus: jest.fn(),
    };
    const next = jest.fn();

    const access = accessControl(rbacConfig);

    access(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.sendStatus).toHaveBeenCalledWith(500);
  });

  it('has an internal server error if multiple configurations match a route', () => {
    const user = {
      role: 'curator',
    };
    const url = '/sources';
    const method = 'DELETE';
    const rbacConfig = {
      '^/sources$': {
        'DELETE': ['admin'],
      },
      '.*': {
        'DELETE': ['admin'],
      },
    };
    const req = {
      user,
      method,
      url,
    };
    const res = {
      sendStatus: jest.fn(),
    };
    const next = jest.fn();

    const access = accessControl(rbacConfig);

    access(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.sendStatus).toHaveBeenCalledWith(500);
  });
});