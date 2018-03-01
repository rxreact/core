export function mapObjectFromKeysOf<T, S, K extends keyof T & keyof S>(
  o: T,
  mapFn: (k: K) => S[K]
): S {
  return (Object.keys(o) as K[]).reduce(
    (acc, k) => {
      acc[k] = mapFn(k)
      return acc
    },
    {} as S
  )
}

export function mapArrayFromKeysOf<T, TResult, K extends keyof T>(
  o: T,
  mapFn: (k: K) => TResult
): TResult[] {
  return (Object.keys(o) as K[]).map(mapFn)
}

export function toupleArrayToDict<S>(toupleArray: [keyof S, S[keyof S]][]): S {
  return toupleArray.reduce(
    (acc, [key, value]) => {
      acc[key] = value
      return acc
    },
    {} as S
  )
}
