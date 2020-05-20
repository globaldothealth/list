import { intersection } from 'ramda';
import { NextFunction } from 'express';

const mustHaveRoles = (roles: Array<string>) => ((req: any, res: any, next: NextFunction) => {
  if (intersection(roles, req.user.roles).length > 0) {
    next();
  } else {
    res.sendStatus(403);
  }
});

export default mustHaveRoles;
