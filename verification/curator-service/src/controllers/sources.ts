import { Request, Response } from 'express';
import { Store } from '../storage/store';

export class Sources {
    constructor(private readonly store: Store) {}

    /**
     * List the sources.
     */
    list = async (req: Request, res: Response): Promise<void> => {
        console.log('listing sources from handler');
        const sources = await this.store.listSources();
        res.send(sources);
        return;
    };

    /**
     * Get a single source.
     */
    get(req: Request, res: Response): void {
        res.sendStatus(501);
        return;
    }

    /**
     * Update a single source.
     */
    update(req: Request, res: Response): void {
        res.sendStatus(501);
        return;
    }

    /**
     * Create a single source.
     */
    create(req: Request, res: Response): void {
        res.sendStatus(501);
        return;
    }

    /**
     * Delete a single source.
     */
    del(req: Request, res: Response): void {
        res.sendStatus(501);
        return;
    }
}
