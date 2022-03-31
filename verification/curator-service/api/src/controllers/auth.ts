import {
    Strategy as BearerStrategy,
    IVerifyOptions,
} from 'passport-http-bearer';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { NextFunction, Request, Response } from 'express';
import { isUserPasswordValid, User, UserDocument, userPublicFields, users } from '../model/user';
import { Token } from '../model/token';
import { isValidObjectId } from 'mongoose';

import { Router } from 'express';
import axios from 'axios';
import { logger } from '../util/logger';
import passport from 'passport';
import localStrategy from 'passport-local';
import AwsLambdaClient from '../clients/aws-lambda-client';
import bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import EmailClient from '../clients/email-client';
import { ObjectId } from 'mongodb';

// Global variable for newsletter acceptance
let isNewsletterAccepted: boolean;

async function findUserByAPIKey(apiKey?: string): Promise<Express.User> {
    if (!apiKey) {
        throw new Error('No API key');
    }
    const userID = apiKey.slice(0, 24);
    const user = await users().findOne({ _id: new ObjectId(userID) });
    if (!user) {
        throw new Error('Invalid API key');
    }
    return user as Express.User;
}

/**
 * authenticateByAPIKey is a middleware that checks whether the user has a valid API key in their request.
 * If they do, then attach the user object to the request and continue; if not then
 * still call the next middleware in case they can authenticate in another way.
 */
export const authenticateByAPIKey = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const theKey = req.header('X-API-Key');
        const user = await findUserByAPIKey(theKey);
        if (user && (user as UserDocument).apiKey === theKey) {
            req.user = user;
            res.status(200);
        } else {
            res.status(403);
        }
        return next();
    } catch (err) {
        // set 403 but carry on processing so the next middleware can try
        res.status(403);
        next();
    }
};
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
        res.status(200);
        return next();
    } else {
        passport.authenticate('bearer', (err, user) => {
            if (err) {
                return next(err);
            }
            if (user) {
                req.user = user;
                // override any 403/401 that was set by an upstream middleware, as we now know the user
                res.status(200);
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
            // override an upstream 403/401
            res.status(200);
            return next();
        } else {
            passport.authenticate('bearer', (err, user) => {
                if (err) {
                    return next(err);
                } else if (
                    user &&
                    userHasRequiredRole(user as UserDocument, requiredSet)
                ) {
                    // override an upstream 403/401
                    res.status(200);
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
    public LocalStrategy: typeof localStrategy.Strategy;
    constructor(
        private readonly env: string,
        private readonly afterLoginRedirURL: string,
        public readonly lambdaClient: AwsLambdaClient,
        public readonly emailClient: EmailClient,
    ) {
        this.router = Router();
        this.LocalStrategy = localStrategy.Strategy;

        this.router.get(
            '/google/redirect',
            // Try to authenticate with the google strategy.
            // This 'google' string is hardcoded within passport.
            passport.authenticate('google', { prompt: 'select_account' }),
            (req: Request, res: Response): void => {
                res.redirect(this.afterLoginRedirURL);
            },
        );

        this.router.post(
            '/signup',
            (req: Request, res: Response, next: NextFunction): void => {
                passport.authenticate(
                    'register',
                    (error: Error, user: UserDocument, info: any) => {
                        if (error) return next(error);
                        if (!user)
                            return res
                                .status(409)
                                .json({ message: info.message });

                        req.logIn(user, (err) => {
                            if (err) return next(err);
                        });

                        res.status(200).json(user);
                    },
                )(req, res, next);
            },
        );

        this.router.post(
            '/signin',
            (req: Request, res: Response, next: NextFunction): void => {
                passport.authenticate(
                    'login',
                    (error: Error, user: UserDocument, info: any) => {
                        if (error) return next(error);
                        if (!user)
                            return res
                                .status(403)
                                .json({ message: info.message });

                        req.logIn(user, (err) => {
                            if (err) return next(err);
                        });

                        res.status(200).json(user);
                    },
                )(req, res, next);
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
            authenticateByAPIKey,
            mustBeAuthenticated,
            (req: Request, res: Response): void => {
                res.json(req.user);
            },
        );

        /**
         * Retrieve the logged-in user's api key.
         * @note this API can't be authenticated by API key because, well…
         */
        this.router.get(
            '/profile/apiKey',
            mustBeAuthenticated,
            async (req: Request, res: Response): Promise<void> => {
                const theUser = req.user as UserDocument;
                const currentUser = await users().findOne({ _id: new ObjectId(theUser.id) });
                if (!currentUser) {
                    // internal server error as you were authenticated but unknown
                    res.status(500).end();
                    return;
                }
                const theKey = currentUser.apiKey;
                if (theKey) {
                    res.json(theKey);
                } else {
                    res.status(404).end();
                }
            },
        );

        async function getRandomString(bytes: number): Promise<string> {
            const randomValues = await crypto.randomBytes(bytes);
            return randomValues.toString('hex');
        }

        /**
         * Create a new api key for the logged-in user.
         * @note This API cannot be authenticated by API key. If you believe your API key
         * is compromised you should not use it to request reset; if you haven't yet set an API
         * key then you couldn't use an API key to call this method anyway.
         */
        this.router.post(
            '/profile/apiKey',
            mustBeAuthenticated,
            async (req: Request, res: Response): Promise<void> => {
                const theUser = req.user as UserDocument;
                if (!theUser) {
                    // internal server error as you were authenticated but unknown
                    res.status(500).end();
                } else {
                    const userQuery = { _id: new ObjectId(theUser.id) };
                    const currentUser = await users().findOne(userQuery);
                    if (!currentUser) {
                        // internal server error as you were authenticated but unknown
                        res.status(500).end();
                        return;
                    }
                    // prefix the API key with the user ID to make it easier to find users by API key in auth
                    const randomPart = await getRandomString(32);
                    const apiKey = `${theUser.id.toString()}${randomPart}`;
                    await users().updateOne({ _id: new ObjectId(theUser.id) }, { $set: { apiKey }});
                    res.status(201).json(apiKey).end();
                }
            },
        );

        /**
         * Delete a user's API key
         */
        this.router.post(
            '/deleteApiKey/:id',
            mustBeAuthenticated,
            mustHaveAnyRole(['admin']),
            async (req: Request, res: Response): Promise<void> => {
                try {
                    logger.info(
                        `user ID ${req.params.id} API key deletion requested`,
                    );
                    const result = await users().findOneAndUpdate(
                        { _id: new ObjectId(req.params.id) },
                        { $unset: { apiKey: '' } },
                    );
                    if (!result.ok) {
                        logger.warn(
                            `user with ID ${req.params.id} does not exist`,
                        );
                        res.status(404).json({
                            message: `user with id ${req.params.id} could not be found`,
                        });
                        return;
                    }
                    logger.info(`API key deleted for user ${req.params.id}`);
                    res.sendStatus(204);
                } catch (err) {
                    const error = err as Error;
                    if (error.name === 'ValidationError') {
                        res.status(422).json(error);
                        return;
                    }
                    res.status(500).json(error);
                    return;
                }
            },
        );

        /**
         * Update user's password.
         * @note I chose not to support this endpoint with API auth key as there's no particular need.
         */
        this.router.post(
            '/change-password',
            mustBeAuthenticated,
            async (req: Request, res: Response) => {
                const oldPassword = req.body.oldPassword as string;
                const newPassword = req.body.newPassword as string;
                const user = req.user as UserDocument;

                if (!user) {
                    return res.sendStatus(403);
                }

                try {
                    const userQuery = { _id: new ObjectId(user.id) };
                    const currentUser = await users().findOne(userQuery);
                    if (!currentUser) {
                        return res.sendStatus(403);
                    }

                    const isValidPassword = await isUserPasswordValid(
                        currentUser,
                        oldPassword,
                    );

                    if (!isValidPassword) {
                        return res
                            .status(403)
                            .json({ message: 'Old password is incorrect' });
                    }

                    const hashedPassword = await bcrypt.hash(newPassword, 10);
                    await users().updateOne(userQuery, {
                        $set: {
                            password: hashedPassword,
                        }
                    });

                    return res
                        .status(200)
                        .json({ message: 'Password changed successfully' });
                } catch (error) {
                    return res.status(500).json(error);
                }
            },
        );

        /**
         * Generate reset password link
         */
        this.router.post(
            '/request-password-reset',
            async (req: Request, res: Response): Promise<Response<any>> => {
                const email = req.body.email as string;

                try {
                    // Check if user with this email address exists
                    const user = await users().findOne({ email });
                    if (!user) {
                        return res.sendStatus(200);
                    }

                    // Check if user is a Gmail user and send appropriate email message in that case
                    // 42 googleID was set for non Google accounts in the past just to pass mongoose validation
                    // so this check has to be made
                    if (
                        user.googleID &&
                        user.googleID !== '42' &&
                        user.googleID !== ''
                    ) {
                        await this.emailClient.send(
                            [email],
                            'Password Change Request',
                            `<p>Hello ${email},</p>
                            <p>You requested to reset your password on Global.health, but you are registered with your Google account. 
                            If you requested the password reset, please try logging in using the "Sign in with Google" button and 
                            resetting your password via your Google account if necessary. If not, no further action is needed.</p>
                            <p>Thanks,</p>
                            <p>The G.h Team</p>`,
                        );

                        return res.sendStatus(200);
                    }

                    // Check if there is a token in DB already for this user
                    const token = await Token.findOne({ userId: user._id });
                    if (token) {
                        await token.deleteOne();
                    }

                    const resetToken = crypto.randomBytes(32).toString('hex');
                    const hash = await bcrypt.hash(resetToken, 10);

                    // Add new reset token to DB
                    await new Token({
                        userId: user._id,
                        token: hash,
                        createdAt: Date.now(),
                    }).save();

                    let url = '';
                    switch (env) {
                        case 'local':
                            url = 'http://localhost:3002';
                            break;
                        case 'dev':
                            url = 'https://dev-data.covid-19.global.health';
                            break;
                        case 'qa':
                            url = 'https://qa-data.covid-19.global.health';
                            break;
                        case 'prod':
                            url = 'https://data.covid-19.global.health';
                            break;
                        default:
                            url = 'http://localhost:3002';
                            break;
                    }

                    const resetLink = `${url}/reset-password/${resetToken}/${user._id}`;

                    await this.emailClient.send(
                        [email],
                        'Password Reset Request',
                        `<p>Hello ${email},</p>
                        <p>Here is a <a href="${resetLink}">link</a> to reset your password on Global.health. If you did not initiate this request, please disregard this message.</p>
                        <p>Thanks,</p>
                        <p>The G.h Team</p>`,
                    );

                    return res.sendStatus(200);
                } catch (err) {
                    const error = err as Error;
                    return res
                        .status(500)
                        .json({ message: String(error.message) });
                }
            },
        );

        /**
         * Reset user's password
         */
        this.router.post(
            '/reset-password',
            async (req: Request, res: Response): Promise<void> => {
                const userId = req.body.userId;
                const token = req.body.token as string;
                const newPassword = req.body.newPassword as string;

                try {
                    // Validate user id
                    const isValidId = isValidObjectId(userId);
                    if (!isValidId) {
                        throw new Error('Invalid user id');
                    }

                    // Check if token exists
                    const passwordResetToken = await Token.findOne({ userId });
                    if (!passwordResetToken) {
                        throw new Error(
                            'Invalid or expired password reset token',
                        );
                    }

                    // Check if token is valid
                    const isValid = await bcrypt.compare(
                        token,
                        passwordResetToken.token,
                    );
                    if (!isValid) {
                        throw new Error(
                            'Invalid or expired password reset token',
                        );
                    }

                    // Hash new password and update user document in DB
                    const hashedPassword = await bcrypt.hash(newPassword, 10);
                    const result = await users().findOneAndUpdate(
                        { _id: new ObjectId(userId) },
                        { $set: { password: hashedPassword } },
                        { returnDocument: 'after' },
                    );
                    
                    if (!result.ok) {
                        logger.error(`error resetting password for user ${userId}`);
                        logger.error(result.lastErrorObject);
                        throw new Error(
                            'Something went wrong, please try again later',
                        );
                    }

                    // Send confirmation email to the user
                    const user = result.value;


                    await this.emailClient.send(
                        [user.email],
                        'Password Change Confirmation',
                        `<p>Hello ${user.email},</p>
                        <p>Your Global.health password has been changed. If you did not initiate this request or are unable to access your account, please respond to this email and we'll be happy to assist.</p>
                        <p>Thanks,</p>
                        <p>The G.h Team</p>`,
                    );

                    // Delete used token
                    await passwordResetToken.deleteOne();

                    res.sendStatus(200);
                } catch (err) {
                    const error = err as Error;
                    res.status(500).json({ message: String(error.message) });
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
                const removeGoogleID = req.body.removeGoogleID as boolean;
                const user = await User.create({
                    name: req.body.name,
                    email: req.body.email,
                    roles: req.body.roles,
                    ...(removeGoogleID !== true && { googleID: '42' }),
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
        // For some reason typescript doesn't accept mongoose User
        // @ts-ignore
        passport.serializeUser((user: UserDocument, done: any) => {
            // Serializes the user id in the cookie, no user info should be in there, just the id.
            done(null, user._id.toHexString());
        });

        passport.deserializeUser((id: string, done: any) => {
            // Find the user based on its id in the cookie.
            users().findOne({ _id: new ObjectId(id) })
                .then((user) => {
                    // Invalidate session when user cannot be found.
                    // This means an cookie pointing to an invalid user was sent to us.
                    // Cf. https://github.com/jaredhanson/passport/issues/6#issuecomment-4857287
                    // This doesn't work however for now as per, if you hit this bug, you have to manually clear the cookies.
                    // Cf https://github.com/jaredhanson/passport/issues/776
                    done(null, userPublicFields(user));
                    return;
                })
                .catch((e) => {
                    logger.error('Failed to get user:', e);
                    done(e, undefined);
                });
        });

        // Configure passport to use username and password auth
        passport.use(
            'register',
            new this.LocalStrategy(
                {
                    usernameField: 'email',
                    passwordField: 'password',
                    passReqToCallback: true,
                },
                async (req, email, password, done) => {
                    try {
                        const user = await User.findOne({ email });

                        if (user) {
                            return done(null, false, {
                                message: 'Email address already exists',
                            });
                        }

                        const hashedPassword = await bcrypt.hash(password, 10);
                        const newUser = await User.create({
                            email: email,
                            password: hashedPassword,
                            name: req.body.name || '',
                            roles: [],
                            newsletterAccepted:
                                req.body.newsletterAccepted || false,
                        });

                        // Send welcome email
                        await this.emailClient.send(
                            [email],
                            'Welcome to Global.health',
                            `<p>Hello ${email},</p>
                            <p>Thank you for registering with Global.health! We're thrilled to have you join our international community and mission to advance the global response to infectious diseases through the sharing of trusted and open public health data.</p>
                            <p>Here are a few things you can do:</p>
                            <ul>
                                <li>Filter and export <a href="https://data.covid-19.global.health">G.h Data</a> containing detailed information on over 50 million anonymized COVID-19 cases from over 100 countries.</li>
                                <li>Explore the <a href="https://map.covid-19.global.health">G.h Map</a> to see available case data visualized by country, region, and coverage.</li>
                                <li>Check out our <a href="https://global.health/faqs/">FAQs</a> for more information on our platform, process, team, data sources, citation guidelines, and plans for the future.</li>
                                <li>Get involved! G.h is being built via a network of hundreds of volunteers that could use your help. If you're interested in joining us, please fill out this <a href="https://global.health/about/#get-involved">form</a>.</li>
                                <li>Connect with us on <a href="https://twitter.com/globaldothealth">Twitter</a>, <a href="https://www.linkedin.com/company/globaldothealth">LinkedIn</a>, and <a href="https://github.com/globaldothealth">GitHub</a> for the latest news and updates.</li>
                            </ul>
                            <p>If you have any questions, suggestions, or connections don't hesitate to email us and a member of our team will be sure to follow up.</p>
                            <p>Thank you again for your interest and support! We hope G.h proves valuable to your work and look forward to hearing from you.</p>
                            <p>The G.h Team</p>`,
                        );

                        done(null, newUser.publicFields());
                    } catch (error) {
                        done(error);
                    }
                },
            ),
        );

        passport.use(
            'login',
            new this.LocalStrategy(
                {
                    usernameField: 'email',
                    passwordField: 'password',
                },
                async (email, password, done) => {
                    try {
                        const user = await User.findOne({ email });
                        if (!user) {
                            return done(null, false, {
                                message: 'Wrong username or password',
                            });
                        }

                        const isValidPassword = await user.isValidPassword(
                            password,
                        );
                        if (!isValidPassword) {
                            return done(null, false, {
                                message: 'Wrong username or password',
                            });
                        }

                        done(null, user.publicFields());
                    } catch (error) {
                        done(error);
                    }
                },
            ),
        );

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
                    cb: any,
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
                                // Send welcome email
                                await this.emailClient.send(
                                    [user.email],
                                    'Welcome to Global.health',
                                    `<p>Hello ${user.email},</p>
                                    <p>Thank you for registering with Global.health! We're thrilled to have you join our international community and mission to advance the global response to infectious diseases through the sharing of trusted and open public health data.</p>
                                    <p>Here are a few things you can do:</p>
                                    <ul>
                                        <li>Filter and export <a href="https://data.covid-19.global.health">G.h Data</a> containing detailed information on over 50 million anonymized COVID-19 cases from over 100 countries.</li>
                                        <li>Explore the <a href="https://map.covid-19.global.health">G.h Map</a> to see available case data visualized by country, region, and coverage.</li>
                                        <li>Check out our <a href="https://global.health/faqs/">FAQs</a> for more information on our platform, process, team, data sources, citation guidelines, and plans for the future.</li>
                                        <li>Get involved! G.h is being built via a network of hundreds of volunteers that could use your help. If you're interested in joining us, please fill out this <a href="https://global.health/about/#get-involved">form</a>.</li>
                                        <li>Connect with us on <a href="https://twitter.com/globaldothealth">Twitter</a>, <a href="https://www.linkedin.com/company/globaldothealth">LinkedIn</a>, and <a href="https://github.com/globaldothealth">GitHub</a> for the latest news and updates.</li>
                                    </ul>
                                    <p>If you have any questions, suggestions, or connections don't hesitate to email us and a member of our team will be sure to follow up.</p>
                                    <p>Thank you again for your interest and support! We hope G.h proves valuable to your work and look forward to hearing from you.</p>
                                    <p>The G.h Team</p>`,
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
                        let user = await users().findOne({ email: email });
                        if (!user) {
                            const result = await users().insertOne({
                                _id: new ObjectId(),
                                email: email,
                                googleID: response.data.sub,
                                roles: [],
                                // Do not care about names for bearer tokens, they are usually not humans.
                                name: '',
                            });
                            user = await users().findOne({ _id: result.insertedId });
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
