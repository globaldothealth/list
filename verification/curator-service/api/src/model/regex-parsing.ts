interface Field {
    name: string;
    regex: string;
}

export type IRegexParsing = {
    fields: [Field];
};
