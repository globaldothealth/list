import {
    Strategy as BearerStrategy,
    IVerifyOptions,
} from 'passport-http-bearer';
import {
    Strategy as GoogleStrategy,
    Profile,
    VerifyCallback,
} from 'passport-google-oauth20';
import { NextFunction, Request, Response } from 'express';
import { User, UserDocument } from '../model/user';

import { Router } from 'express';
import axios from 'axios';
import { logger } from '../util/logger';
import passport from 'passport';
import AwsLambdaClient from '../clients/aws-lambda-client';

// Global variable for newsletter acceptance
let isNewsletterAccepted: boolean;

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
    } else {
        passport.authenticate('bearer', (err, user) => {
            if (err) {
                return next(err);
            }
            if (user) {
                req.user = user;
                return next();
            } else {
                res.sendStatus(403);
            }
        })(req, res, next);
    }
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
                    res.status(403).json({
                        message: `access is restricted to users with ${requiredRoles} roles`,
                    });
                }
            })(req, res, next);
        }
    };
};

/** GoogleProfile extends passport's default Profile with Google specific fields */
interface GoogleProfile extends Profile {
    // Unique profile ID
    id: string;
    // List of profile pictures.
    photos: [{ value: string }];
    // Full name of the user.
    displayName: string;
    // List of emails belonging to the profile.
    // Unclear as to when multiple ones are possible.
    emails: [{ value: string }];
}

/**
 * AuthController handles authentication of users with the system.
 */
export class AuthController {
    public router: Router;
    constructor(
        private readonly afterLoginRedirURL: string,
        public readonly lambdaClient: AwsLambdaClient,
    ) {
        this.router = Router();

        this.router.get(
            '/google/redirect',
            // Try to authenticate with the google strategy.
            // This 'google' string is hardcoded within passport.
            passport.authenticate('google', { prompt: 'select_account' }),
            (req: Request, res: Response): void => {
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
            (req: Request, res: Response, next) => {
                if (req.query.newsletterAccepted) {
                    isNewsletterAccepted =
                        req.query.newsletterAccepted === 'true' ? true : false;
                }

                return next();
            },
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

        this.router.post(
            '/signup',
            async (req: Request, res: Response): Promise<void> => {
                let user = await User.findOne({
                    email: req.body.email,
                }).exec();

                // Update newsletter preferences
                if (
                    user &&
                    user.newsletterAccepted === false &&
                    req.body.newsletter
                ) {
                    user = await User.findOneAndUpdate(
                        { email: req.body.email },
                        { newsletterAccepted: req.body.newsletter },
                    );
                }

                if (user) {
                    req.login(user, (err: Error) => {
                        if (!err) {
                            res.json(user);
                            return;
                        }
                        logger.error(err);
                        res.sendStatus(500);
                    });
                } else {
                    const newUser = await User.create({
                        name: req.body.name,
                        email: req.body.email,
                        googleID: '42',
                        roles: req.body.roles,
                        newsletterAccepted: req.body.newsletter || false,
                    });

                    try {
                        await this.lambdaClient.sendWelcomeEmail(
                            req.body.email,
                        );
                    } catch (err) {
                        logger.info('error: ' + JSON.stringify(err, null, 2));
                    }

                    req.login(newUser, (err: Error) => {
                        if (!err) {
                            res.json(newUser);
                            return;
                        }
                        logger.error(err);
                        res.sendStatus(500);
                    });
                }
            },
        );
    }

    /**
     * configureLocalAuth will get or create the user present in the request.
     */
    configureLocalAuth(): void {
        logger.info('Configuring local auth for tests');
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
                    logger.error(err);
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
                    logger.error('Failed to get user:', e);
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
                    const googleProfile = profile as GoogleProfile;
                    try {
                        // Passport got our user profile from google.
                        // Find or create a correpsonding user in our DB.
                        let user = await User.findOne({
                            googleID: googleProfile.id,
                        });
                        const picture = profile.photos?.[0].value;
                        if (!user) {
                            user = await User.create({
                                googleID: googleProfile.id,
                                name: profile.displayName,
                                email: (profile.emails || []).map(
                                    (v) => v.value,
                                )[0],
                                roles: [],
                                picture: picture,
                                newsletterAccepted: isNewsletterAccepted,
                            });

                            try {
                                await this.lambdaClient.sendWelcomeEmail(
                                    user.email,
                                );
                            } catch (err) {
                                logger.info(
                                    'error: ' + JSON.stringify(err, null, 2),
                                );
                            }
                        }
                        if (picture !== user.picture) {
                            logger.info(
                                'User has a different picture, updating it',
                            );
                            user = await User.findOneAndUpdate(
                                { googleID: googleProfile.id },
                                { picture: picture },
                            );
                        }

                        if (
                            user &&
                            !user.newsletterAccepted &&
                            isNewsletterAccepted
                        ) {
                            logger.info('Updating newsletter preferences');
                            user = await User.findOneAndUpdate(
                                { googleID: googleProfile.id },
                                { newsletterAccepted: true },
                            );
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
