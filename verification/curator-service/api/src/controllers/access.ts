import { curry, intersection } from 'ramda';

const accessControl = (
  config: Object,
) => (
  curry((config, req, res, next) => {
    const method = req.method === 'HEAD' ? 'GET' : req.method; // HEAD and GET have the same visibility
    let methodRoleMap : { [index: string] : Array<string> };
    if (config[req.url]) {
      methodRoleMap = config[req.url];
    } else {
      const keys = Object.getOwnPropertyNames(config).filter((prop) => (
        req.url.match(prop)
      ));
      if (keys.length === 1) {
        // exactly one configuration found, use that
        methodRoleMap = config[keys[0]];
      } else {
        // zero or 2+ configurations found, either way it's bad
        res.sendStatus(500);
        return;
      }
    }
    const expectedRoles  = methodRoleMap[method];
    if (intersection(expectedRoles, req.user.roles).length > 0) {
      next();
    } else {
      res.sendStatus(403);
    }
  })(config)
);

export default accessControl;
