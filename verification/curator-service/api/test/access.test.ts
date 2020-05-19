import { curry } from 'ramda';

const accessControl = (
  config: Object,
) => (
  curry((config, req, res, next) => {
    const method = req.method === 'HEAD' ? 'GET' : req.method; // HEAD and GET have the same visibility
    const expectedRoles = config[req.url][method];
    if (expectedRoles.indexOf(req.user.role) !== -1) {
      next();
    } else {
      res.sendStatus(403);
    }
  })(config)
);

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
});