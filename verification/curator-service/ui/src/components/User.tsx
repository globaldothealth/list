export default interface User {
    _id: string;
    name: string;
    email: string;
    roles: string[];
    picture?: string;
}
