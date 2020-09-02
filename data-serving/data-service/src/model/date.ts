export const dateFieldInfo = {
    type: Date,
    // TODO: This is COVID-19 specific, think about removing this.
    min: '2019-11-01',
    // Account for skew, add 5s. because when running locally the dates
    // can sometimes be > now when set just before validation.
    max: (): number => Date.now() + 5000,
};
