import { Request, Response } from 'express';

import { User, userRoles } from '../model/user';

/**
 * List the users.
 * Response will contain {users: [list of users]}
 * and potentially another nextPage: <num> if more results are available.
 * Default values of 10 for limit and 1 for page is used.
 */
export const list = async (req: Request, res: Response): Promise<void> => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    if (page < 1) {
        res.status(422).json({ message: 'page must be > 0' });
        return;
    }
    if (limit < 1) {
        res.status(422).json({ message: 'limit must be > 0' });
        return;
    }
    try {
        const [docs, total] = await Promise.all([
            User.find({})
                .skip(limit * (page - 1))
                .limit(limit + 1)
                .lean(),
            User.countDocuments({}),
        ]);
        // If we have more items than limit, add a response param
        // indicating that there is more to fetch on the next page.
        if (docs.length == limit + 1) {
            docs.splice(limit);
            res.json({
                users: docs,
                nextPage: page + 1,
                total: total,
            });
            return;
        }
        // If we fetched all available data, just return it.
        res.json({ users: docs, total: total });
    } catch (e) {
        res.status(422).json(e);
        return;
    }
};

/**
 * Update a single user's roles.
 */
export const updateRoles = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { roles: req.body.roles },
            {
                // Return the udpated object.
                new: true,
                runValidators: true,
            },
        );
        if (!user) {
            res.status(404).json({
                message: `user with id ${req.params.id} could not be found`,
            });
            return;
        }
        res.json(user);
    } catch (err) {
        if (err.name === 'ValidationError') {
            res.status(422).json(err);
            return;
        }
        res.status(500).json(err);
        return;
    }
};

/**
 * List the roles defined in the system.
 */
export const listRoles = (req: Request, res: Response): void => {
    res.json({ roles: userRoles });
};
