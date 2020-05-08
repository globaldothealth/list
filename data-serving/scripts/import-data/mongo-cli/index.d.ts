// Type definitions for mongo-cli.

/**
 * MongoDB's main connection-type object, which can be coerced into the
 * `Connection` interface in usage.
 */
declare let Mongo: any;

/** Mongo CLI has its own print and read functions. OK, I guess! */
declare function cat(path: string): Promise<string>;
declare function listFiles(path: string): Promise<[string]>;
declare function print(message: string): void;
declare function printjson(message: {}): void;
declare function quit(): void;

/**
 * The main connection object, representing the connection to the instance
 * specified arguments to `mongo`. Provides access to databases.
 */
interface Connection {
    host: string;
    getDB: (name: string) => Promise<Database>;
}

/**
 * An object representing a database in the instance. The database may have
 * collections, and can have commands run on it.
 */
interface Database {
    createCollection: (
        name: string,
        options?: CreateCollectionOptions,
    ) => Promise<CommandResult>;

    getCollectionNames: () => Promise<[string]>;

    runCommand: (
        command: InsertCommand | CollModCommand,
    ) => Promise<CommandResult>;
}

/** A command to modify a collection, as an arg to `runCommand`. */
interface CollModCommand {
    collMod: string;
    validator: JSON;
}

/**
 * A command to insert documents into a collection, as an arg to `runCommand`.
 */
interface InsertCommand {
    insert: string;
    documents: JSON;
    ordered: boolean;
}

/** Options to pass with the command to create a collection. */
interface CreateCollectionOptions {
    validator: JSON;
}

/** The result of a call to `runCommand.` */
interface CommandResult {
    ok: number;
}

/** The result of a call to `runCommand` with an `InsertCommand.` */
interface InsertDataCommandResult extends CommandResult {
    n: number;
    writeErrors: [
        {
            index: number;
            code: number;
            errmsg: string;
        },
    ];
}