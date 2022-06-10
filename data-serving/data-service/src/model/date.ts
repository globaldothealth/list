export const dateFieldInfo = (outbreakDate: Date) => ({
    type: Date,
    // Configure an outbreak date. Case reports will be rejected if they are earlier than that date.
    min: outbreakDate,
    // Account for skew, add 5s. because when running locally the dates
    // can sometimes be > now when set just before validation.
    max: (): number => Date.now() + 5000,
});
