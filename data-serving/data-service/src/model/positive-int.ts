export const positiveIntFieldInfo = {
    type: Number,
    min: 0,
    validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value',
    },
};
