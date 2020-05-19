import { curry } from 'ramda';

const accessControl = (
  config: Object,
) => (
  curry((config, req, res, next) => {
    res.sendStatus(403);
  })(config)
);

describe('access control middleware', () => {
  it('rejects a call for which the user is not in the correct role', () => {
    const user = {
      role: 'viewer',
    };
    const url = '/sources';
    const rbacConfig = {
      [url]: {
        'GET': ['curator'],
      },
    };
    const req = { 
      user,
      url,
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