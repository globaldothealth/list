export interface User {
    id: string;
    name?: string;
    email: string;
    googleID: string;
    roles: string[];
    picture?: string;
    newsletterAccepted?: boolean;
}
