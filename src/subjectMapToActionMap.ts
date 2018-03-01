import { SubjectMap, ActionMap } from './types'
import { mapObjectFromKeysOf } from './utils'

export function subjectMapToActionMap<T>(subjectMap: SubjectMap<T>): ActionMap<T> {
  return mapObjectFromKeysOf<SubjectMap<T>, ActionMap<T>, keyof T>(subjectMap, key => (val): void =>
    subjectMap[key].next(val)
  )
}
