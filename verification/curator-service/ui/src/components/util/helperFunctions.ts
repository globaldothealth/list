import { User } from '../../api/models/User';

export const getReleaseNotesUrl = (version: string): string => {
    return `https://github.com/globaldothealth/list/releases/tag/${version}`;
};

// Send custom event to Google Tag Manager
interface IVariable {
    [key: string]: string | boolean | number | undefined;
}

export const sendCustomGtmEvent = (
    name: string,
    variables?: IVariable,
): void => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        event: name,
        ...variables,
    });
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
