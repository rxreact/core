import { Observable, Subject } from 'rxjs'

export type ObservableMap<S> = { [K in keyof S]: Observable<S[K]> }

export type Action<T> = (_: T) => void
export type ActionMap<A> = { [K in keyof A]: Action<A[K]> }

export type SubjectMap<A> = { [K in keyof A]: Subject<A[K]> }

export type Difference<A, Without> = Pick<A, DiffUnion<keyof A, keyof Without>>

export type DiffUnion<T extends string, U extends string> = ({ [P in T]: P } &
  { [P in U]: never } & { [k: string]: never })[T]

export interface ViewModel<S, A> {
  inputs: ObservableMap<S>
  outputs: SubjectMap<A>
}

export type ViewModelFactory<S, A, P> = (ownProps: Observable<P>) => ViewModel<S, A>
