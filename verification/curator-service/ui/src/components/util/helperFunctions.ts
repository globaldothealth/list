import { User } from '../../api/models/User';

export const getReleaseNotesUrl = (version: string): string => {
    return `https://github.com/globaldothealth/list/releases/tag/${version}`;
};

export const hasAnyRole = (
    user: User | undefined,
    requiredRoles: string[],
): boolean => {
    if (!user) {
        return false;
    }
    return user?.roles?.some((r: string) => requiredRoles.includes(r));
};
