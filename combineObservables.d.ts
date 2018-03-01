import { Observable } from 'rxjs';
import { ObservableMap } from './types';
export declare function combineObservables<S>(observables: ObservableMap<S>): Observable<S>;
