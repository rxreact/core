import { Subject } from 'rxjs'
import { subjectMapToActionMap } from '../src/subjectMapToActionMap'

describe('subjectMapToActionMap', () => {
  let numberSubject: Subject<number> = new Subject()
  let stringSubject: Subject<string> = new Subject()

  describe('given an object whose keys are subjects', function() {
    let subjects = {
      inputNumber: numberSubject,
      inputString: stringSubject
    }

    it('returns an object whose keys are functions that when called take a single value and pass it on to the subject', () => {
      expect.assertions(2)

      let expectedNum = 7
      let expectedStr = 'apples'
      numberSubject.subscribe(num => expect(num).toEqual(expectedNum))
      stringSubject.subscribe(str => expect(str).toEqual(expectedStr))

      let actions = subjectMapToActionMap(subjects)
      actions.inputNumber(expectedNum)
      actions.inputString(expectedStr)
    })
  })
})
