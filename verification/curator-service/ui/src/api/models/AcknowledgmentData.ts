export interface AcknowledgmentData {
    _id: string;
    name: string;
    origin: {
        license: string;
        url: string;
        providerName: string | undefined;
        providerWebisteUrl: string | undefined;
    };
}
