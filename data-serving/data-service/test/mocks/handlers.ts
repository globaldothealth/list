import { rest } from 'msw';

const fakeGeocodes: Map<string, any> = new Map();

export const seed = (req: string, res: any) => {
    fakeGeocodes.set(req, res);
};

export const clear = () => {
    fakeGeocodes.clear();
};

export const handlers = [
    rest.get('http://localhost:3003/geocode', (req, res, ctx) => {
        const query = req.url.searchParams.get('q');
        if (!query) {
            return res(ctx.status(400));
        }
        if (fakeGeocodes.has(query)) {
            return res(ctx.status(200), ctx.json([fakeGeocodes.get(query)]));
        } else {
            return res(ctx.status(404));
        }
    }),
];
