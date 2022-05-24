export default interface User {
    _id: string;
    name?: string | null;
    email: string;
    roles: string[];
    picture?: string;
    apiKey?: string;
}
