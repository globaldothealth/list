export const uniqueStringsArrayFieldInfo = {
    type: [String],
    validate: {
        validator: function (values: [string]): boolean {
            const unique = new Set(values);
            return values.length == unique.size;
        },
        message: 'Values must be unique',
    },
};
