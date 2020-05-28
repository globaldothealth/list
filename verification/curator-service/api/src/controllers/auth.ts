import { NextFunction, Request, Response } from 'express';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { User, UserDocument } from '../model/user';

import { Router } from 'express';
import passport from 'passport';

// mustBeAuthenticated is a middleware that checks that the user making the call is
// authenticated.
// Subsequent request handlers can be assured req.user will be defined.
export const mustBeAuthenticated = (
    req: Request,
    res: Response,
    next: NextFunction,
): void => {
    if (req.isAuthenticated()) {
        next();
        return;
    }
    res.sendStatus(403);
};

// mustHaveAnyRole is an express middleware that checks that the currently logged-in user has any of the given roles.
export const mustHaveAnyRole = (requiredRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const requiredSet = new Set(requiredRoles);
        if (
            req.isAuthenticated() &&
            (req.user as UserDocument).roles?.filter((r: string) =>
                requiredSet.has(r),
            ).length > 0
        ) {
            next();
        } else {
            res.status(403).json(
                `access is restricted to users with ${requiredRoles} roles`,
            );
        }
    };
};

export class AuthController {
    public router: Router;
    constructor(private readonly afterLoginRedirURL: string) {
        this.router = Router();

        this.router.get(
            '/google/redirect',
            // Try to authenticate with the google strategy.
            // This 'google' string is hardcoded within passport.
            passport.authenticate('google'),
            (req: Request, res: Response): void => {
                // User has successfully logged-in.
                res.redirect(this.afterLoginRedirURL);
            },
        );

        this.router.get('/logout', (req: Request, res: Response): void => {
            req.logout();
            res.redirect('/');
        });

        // Starts the authentication flow with Google OAuth.
        // This will redirect the browser to the OAuth consent screen.
        this.router.get(
            '/google',
            passport.authenticate('google', {
                scope: ['email'],
            }),
        );

        this.router.get(
            '/profile',
            mustBeAuthenticated,
            (req: Request, res: Response): void => {
                res.json(req.user);
            },
        );
    }

    // configureLocalAuth will get or create the user present in the request.
    configureLocalAuth(): void {
        console.log('Configuring local auth for tests');
        // /register creates a user if necessary and log them in.
        this.router.post(
            '/register',
            async (req: Request, res: Response): Promise<void> => {
                const user = await User.create({
                    name: req.body.name,
                    email: req.body.email,
                    // Necessary to pass mongoose validation.
                    googleID: 42,
                    roles: req.body.roles,
                });
                req.login(user, (err: Error) => {
                    if (!err) {
                        res.json(user);
                        return;
                    }
                    console.log(err);
                    res.sendStatus(500);
                });
            },
        );
    }
    configurePassport(clientID: string, clientSecret: string): void {
        passport.serializeUser<UserDocument, string>((user, done) => {
            // Serializes the user id in the cookie, no user info should be in there, just the id.
            done(null, user.id);
        });

        passport.deserializeUser<UserDocument, string>((id, done) => {
            // Find the user based on its id in the cookie.
            User.findById(id)
                .then((user) => {
                    if (user) {
                        done(null, user);
                    } else {
                        console.error('User not fetched');
                        done(new Error('User could not be found'), undefined);
                    }
                })
                .catch((e) => {
                    console.error('Failed to get user:', e);
                    done(e, undefined);
                });
        });

        // Configure passport to use google OAuth.
        passport.use(
            new Strategy(
                {
                    clientID: clientID,
                    clientSecret: clientSecret,
                    callbackURL: '/auth/google/redirect',
                },
                async (
                    unusedAccessToken: string,
                    unusedRefreshToken: string,
                    profile: Profile,
                    cb: VerifyCallback,
                ): Promise<void> => {
                    try {
                        // Passport got our user profile from google.
                        // Find or create a correpsonding user in our DB.
                        let user = await User.findOne({ googleID: profile.id });
                        if (!user) {
                            user = await User.create({
                                googleID: profile.id,
                                name: profile.displayName,
                                email: (profile.emails || []).map(
                                    (v) => v.value,
                                )[0],
                            });
                        }
                        cb(undefined, user);
                    } catch (e) {
                        // Catch any error and end our authentication session with it.
                        cb(e, null);
                    }
                },
            ),
        );
    }
}
