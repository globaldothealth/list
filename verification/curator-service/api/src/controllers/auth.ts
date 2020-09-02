import {
    Strategy as GoogleStrategy,
    Profile,
    VerifyCallback,
} from 'passport-google-oauth20';
import { NextFunction, Request, Response } from 'express';
import { User, UserDocument } from '../model/user';

import {
    Strategy as BearerStrategy,
    IVerifyOptions,
} from 'passport-http-bearer';
import { Router } from 'express';
import axios from 'axios';
import passport from 'passport';

/**
 * mustBeAuthenticated is a middleware that checks that the user making the call is authenticated.
 * Subsequent request handlers can be assured req.user will be defined.
 */
export const mustBeAuthenticated = (
    req: Request,
    res: Response,
    next: NextFunction,
): void => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.sendStatus(403);
};

/**
 * Checks roles of a user against a set of required roles.
 * @param user the user to check roles for.
 * @param requiredRoles The set of roles that the user should have, if any role matches the function returns true.
 */
const userHasRequiredRole = (
    user: UserDocument,
    requiredRoles: Set<string>,
): boolean => {
    return user.roles?.some((r: string) => requiredRoles.has(r));
};

/**
 * Express middleware that checks to see if there's an authenticated principal
 * that has any of the specified roles.
 *
 * This middleware first checks if there's a session with an authenticated
 * user. Then, if there isn't, it attempts to authenticate the request via an
 * HTTP bearer token.
 */
export const mustHaveAnyRole = (requiredRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const requiredSet = new Set(requiredRoles);
        if (
            req.isAuthenticated() &&
            userHasRequiredRole(req.user as UserDocument, requiredSet)
        ) {
            return next();
        } else {
            passport.authenticate('bearer', (err, user) => {
                if (err) {
                    return next(err);
                } else if (
                    user &&
                    userHasRequiredRole(user as UserDocument, requiredSet)
                ) {
                    req.user = user;
                    return next();
                } else {
                    res.status(403).json(
                        `access is restricted to users with ${requiredRoles} roles`,
                    );
                }
            })(req, res, next);
        }
    };
};

/**
 * AuthController handles authentication of users with the system.
 */
export class AuthController {
    public router: Router;
    constructor(private readonly afterLoginRedirURL: string) {
        this.router = Router();

        this.router.get(
            '/google/redirect',
            // Try to authenticate with the google strategy.
            // This 'google' string is hardcoded within passport.
            passport.authenticate('google', { prompt: 'select_account' }),
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
                prompt: 'select_account',
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

    /**
     * configureLocalAuth will get or create the user present in the request.
     */
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
                    googleID: '42',
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

    /**
     * Configures OAuth passport strategy.
     * @param clientID the OAuth client ID as gotten from the Google developer console.
     * @param clientSecret the OAuth client secret as gotten from the Google developer console.
     */
    configurePassport(clientID: string, clientSecret: string): void {
        passport.serializeUser<UserDocument, string>((user, done) => {
            // Serializes the user id in the cookie, no user info should be in there, just the id.
            done(null, user.id);
        });

        passport.deserializeUser<UserDocument, string>((id, done) => {
            // Find the user based on its id in the cookie.
            User.findById(id)
                .then((user) => {
                    // Invalidate session when user cannot be found.
                    // This means an cookie pointing to an invalid user was sent to us.
                    // Cf. https://github.com/jaredhanson/passport/issues/6#issuecomment-4857287
                    // This doesn't work however for now as per, if you hit this bug, you have to manually clear the cookies.
                    // Cf https://github.com/jaredhanson/passport/issues/776
                    done(null, user || undefined);
                    return;
                })
                .catch((e) => {
                    console.error('Failed to get user:', e);
                    done(e, undefined);
                });
        });

        // Configure passport to use google OAuth.
        passport.use(
            new GoogleStrategy(
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
                                googleID: profile['id'],
                                name: profile.displayName,
                                email: (profile.emails || []).map(
                                    (v) => v.value,
                                )[0],
                                roles: [],
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

        // Configure passport to accept HTTP bearer tokens.
        passport.use(
            new BearerStrategy(
                async (
                    token: string,
                    done: (
                        error: unknown,
                        user?: unknown,
                        options?: IVerifyOptions | string,
                    ) => void,
                ): Promise<void> => {
                    try {
                        const response = await axios.get(
                            `https://openidconnect.googleapis.com/v1/userinfo?access_token=${token}`,
                        );
                        // Response data fields can be found at
                        // https://developers.google.com/identity/protocols/oauth2/openid-connect#an-id-tokens-payload
                        const email = response.data.email;
                        if (!email) {
                            return done(
                                null,
                                false,
                                'Supplied bearer token must be scoped for "email"',
                            );
                        }
                        let user = await User.findOne({ email: email });
                        if (!user) {
                            user = await User.create({
                                email: email,
                                googleID: response.data.sub,
                                roles: [],
                                // Do not care about names for bearer tokens, they are usually not humans.
                                name: '',
                            });
                        }
                        return done(null, user);
                    } catch (e) {
                        return done(e);
                    }
                },
            ),
        );
    }
}
