import { Observable, combineLatest } from 'rxjs'
import { map } from 'rxjs/operators'
import { ObservableMap } from './types'
import { mapArrayFromKeysOf, toupleArrayToDict } from './utils'

export function combineObservables<S>(observables: ObservableMap<S>): Observable<S> {
  let observableArray = mapArrayFromKeysOf(observables, key =>
    observables[key].pipe(map((value): [keyof S, S[keyof S]] => [key, value]))
  )

  return combineLatest(...observableArray).pipe(map(toupleArrayToDict))
}
