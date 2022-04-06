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
