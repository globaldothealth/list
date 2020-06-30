// Type definitions for mongo-cli.

/**
 * MongoDB's main connection-type object, which can be coerced into the
 * `Connection` interface in usage.
 */
declare let Mongo: any;

/** Mongo CLI has its own print and read functions. OK, I guess! */
declare function cat(path: string): Promise<string>;
declare function print(message: string): void;
declare function printjson(message: {}): void;
declare function quit(): void;

interface Collection {
    remove: (query: object) => Promise<CommandResult>;
    stats: () => Promise<CollectionStats>;
    createIndex: (spec: object, options: { name: string }) => Promise<CommandResult>;
    dropIndex: (name: string) => Promise<CommandResult>;
}

interface CollectionStats {
    ns: string;
    count: number;
    nindexes: number;
}

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

    getCollection: (name: string) => Promise<Collection>;

    getCollectionNames: () => Promise<[string]>;

    runCommand: (options: { collMod: string, validator: {} }) => Promise<CommandResult>;
}

/** Options to pass with the command to create a collection. */
interface CreateCollectionOptions {
    validator: JSON;
}

/** The result of a call to `runCommand.` */
interface CommandResult {
    ok: number;

    nRemoved: number;
}