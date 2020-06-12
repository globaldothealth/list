import { AssertionError } from 'assert';

/**
 * Generalized assertion function for (string | undefined) values.
 *
 * @param input to validate is of type string
 * @param errorMessage to display if input undefined
 */
export default function assertString(
    input: string | undefined,
    errorMessage: string,
): asserts input is string {
    if (typeof input === 'string') return;
    else
        throw new AssertionError({
            message: errorMessage,
        });
}
