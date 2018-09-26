import React from "react";
import { subjectMapToActionMap } from "./subjectMapToActionMap";
import { combineObservables } from "./combineObservables";
import { Observable, Subject, Subscription, ReplaySubject, of } from "rxjs";
import { ObservableMap, ActionMap, ViewModelFactory, Difference, ViewModel } from "./types";

function getObservableState<S>(
  inputs: ObservableMap<S> | Observable<S> | undefined
): Observable<S> {
  if (inputs instanceof Observable) {
    return inputs;
  }
  return inputs ? combineObservables(inputs) : (of({}) as Observable<S>);
}

function withViewModelFactory<S, A, P>(
  viewModelFactory: ViewModelFactory<S, A, P>
): <T extends S & ActionMap<A> & P>(
  WrappedComponent: React.ComponentType<T>
) => React.ComponentClass<Difference<T, S & ActionMap<A>> & P> {
  return function wrapWithConnect<T extends S & ActionMap<A> & P>(
    WrappedComponent: React.ComponentType<T>
  ): React.ComponentClass<Difference<T, S & ActionMap<A>> & P> {
    return class ConnectState extends React.Component<Difference<T, S & ActionMap<A>> & P, S> {
      subscription: Subscription | undefined;
      actions: ActionMap<A>;
      observableState: Observable<S>;
      propsObservable: Subject<P> = new ReplaySubject<P>(1);

      constructor(props: Difference<T, S & ActionMap<A>> & P) {
        super(props);
        let viewModel = viewModelFactory(this.propsObservable);
        this.observableState = getObservableState(viewModel.inputs);
        this.actions = viewModel.outputs
          ? subjectMapToActionMap(viewModel.outputs)
          : ({} as ActionMap<A>);
      }

      componentDidMount() {
        this.propsObservable.next(this.props as Readonly<P>);
        this.subscription = this.observableState.subscribe(newState => this.setState(newState));
      }

      componentDidUpdate(prevProps: Difference<T, S & ActionMap<A>> & P) {
        if (this.props !== prevProps) {
          this.propsObservable.next(this.props as Readonly<P>);
        }
      }

      componentWillUnmount() {
        this.subscription && this.subscription.unsubscribe();
      }

      render() {
        if (this.state !== null) {
          return <WrappedComponent {...this.state} {...this.actions} {...this.props} />;
        } else {
          return null;
        }
      }
    };
  };
}

function withViewModelSimple<S, A>(
  viewModel: ViewModel<S, A>
): <T extends S & ActionMap<A>>(
  WrappedComponent: React.ComponentType<T>
) => React.ComponentClass<Difference<T, S & ActionMap<A>>> {
  return function wrapWithViewModel<T extends S & ActionMap<A>>(
    WrappedComponent: React.ComponentType<T>
  ): React.ComponentClass<Difference<T, S & ActionMap<A>>> {
    return withViewModelFactory<S, A, Difference<T, S & ActionMap<A>>>(_ => viewModel)(
      WrappedComponent
    );
  };
}

export function withViewModel<S, A>(
  viewModel: ViewModel<S, A>
): <T extends S & ActionMap<A>>(
  WrappedComponent: React.ComponentType<T>
) => React.ComponentClass<Difference<T, S & ActionMap<A>>>;
export function withViewModel<S, A, P>(
  viewModel: ViewModelFactory<S, A, P>
): <T extends S & ActionMap<A> & P>(
  WrappedComponent: React.ComponentType<T>
) => React.ComponentClass<Difference<T, S & ActionMap<A>> & P>;
export function withViewModel<S, A, P>(
  viewModel: ViewModel<S, A> | ViewModelFactory<S, A, P>
):
  | (<T extends S & ActionMap<A> & P>(
      WrappedComponent: React.ComponentType<T>
    ) => React.ComponentClass<Difference<T, S & ActionMap<A>> & P>)
  | (<T extends S & ActionMap<A>>(
      WrappedComponent: React.ComponentType<T>
    ) => React.ComponentClass<Difference<T, S & ActionMap<A>>>) {
  if (typeof viewModel === "function") {
    return withViewModelFactory(viewModel);
  } else {
    return withViewModelSimple(viewModel);
  }
}

export {
  ObservableMap,
  SubjectMap,
  ActionMap,
  ViewModelFactory,
  Difference,
  ViewModel
} from "./types";
