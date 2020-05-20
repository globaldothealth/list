import mustHaveRoles from '../src/controllers/access';

describe('access control middleware', () => {
  it('rejects a call for which the user is not in the correct role', () => {
    const user = {
      roles: ['reader'],
    };
    const url = '/sources';
    const method = 'GET';
    const req = { 
      user,
      url,
      method,
    };
    const res = {
      sendStatus: jest.fn(),
    };
    const next = jest.fn();

    mustHaveRoles(['curator'])(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.sendStatus).toHaveBeenCalledWith(403);
  });

  it('permits a call for which the user is in an allowed role', () => {
    const user = {
      roles: ['curator'],
    };
    const url = '/sources';
    const method = 'GET';
    const req = { 
      user,
      url,
      method,
    };
    const res = {
      sendStatus: jest.fn(),
    };
    const next = jest.fn();

    mustHaveRoles(['curator'])(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.sendStatus).not.toHaveBeenCalled();
  });

  it('does not allow a user with no roles to access an endpoint', () => {
    const user = {
      roles: [],
    };
    const url = '/sources';
    const method = 'GET';
    const req = { 
      user,
      url,
      method,
    };
    const res = {
      sendStatus: jest.fn(),
    };
    const next = jest.fn();

    mustHaveRoles(['curator'])(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.sendStatus).toHaveBeenCalledWith(403);
  });

  it('can find the correct role among multiple assumed by a user', () => {
    const user = {
      roles: ['curator', 'admin'],
    };
    const url = '/sources';
    const method = 'GET';
    const req = { 
      user,
      url,
      method,
    };
    const res = {
      sendStatus: jest.fn(),
    };
    const next = jest.fn();

    mustHaveRoles(['admin'])(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.sendStatus).not.toHaveBeenCalled();
  });

});