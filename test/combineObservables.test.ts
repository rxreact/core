import { Observable } from 'rxjs'
import { marbles } from 'rxjs-marbles'
import { combineObservables } from '../src/combineObservables'

describe('combineObservables', () => {
  describe('given an object whose keys are observables', () => {
    it(
      'returns an observable that emits an object with same keys and current values of each observable',
      marbles(m => {
        let numberObservable = m.cold('1-2-3-|', { '1': 1, '2': 2, '3': 3 })
        let stringObservable = m.cold('-a-b-o|', { a: 'apples', b: 'bananas', o: 'oranges' })
        let observableMap = {
          numbers: numberObservable,
          strings: stringObservable
        }
        let combinedObservable = combineObservables(observableMap)
        let expected = m.cold('-bcdef|', {
          b: { numbers: 1, strings: 'apples' },
          c: { numbers: 2, strings: 'apples' },
          d: { numbers: 2, strings: 'bananas' },
          e: { numbers: 3, strings: 'bananas' },
          f: { numbers: 3, strings: 'oranges' }
        })
        m.expect(combinedObservable).toBeObservable(expected)
      })
    )
  })
})
