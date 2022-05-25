export default interface User {
    _id: string;
    id?: string; // session user has id, not _id
    name?: string | null;
    email: string;
    roles: string[];
    picture?: string;
    apiKey?: string;
}
