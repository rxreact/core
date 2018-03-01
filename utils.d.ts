export declare function mapObjectFromKeysOf<T, S, K extends keyof T & keyof S>(o: T, mapFn: (k: K) => S[K]): S;
export declare function mapArrayFromKeysOf<T, TResult, K extends keyof T>(o: T, mapFn: (k: K) => TResult): TResult[];
export declare function toupleArrayToDict<S>(toupleArray: [keyof S, S[keyof S]][]): S;
