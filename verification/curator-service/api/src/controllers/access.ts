import { NextFunction } from 'express';

function setContainsAnyOf<T>(set: Set<T>, possibleElements: [T]): boolean {
  for(let e of possibleElements) {
    if (set.has(e)) {
      return true;
    }
  }
  return false;
}

const mustHaveRoles = (roles: Set<string>) => ((req: any, res: any, next: NextFunction) => {
  if (req.user && req.user.roles && setContainsAnyOf(roles, req.user.roles)) {
    next();
  } else {
    res.sendStatus(403);
  }
});

export default mustHaveRoles;
