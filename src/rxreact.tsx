import * as React from "react";
import { subjectMapToActionMap } from "./subjectMapToActionMap";
import { combineObservables } from "./combineObservables";
import { Observable, Subject, Subscription, ReplaySubject } from "rxjs";
import {
  ObservableMap,
  SubjectMap,
  ActionMap,
  ViewModelFactory,
  Difference,
  ViewModel
} from "./types";
function withViewModelFactory<S, A, P extends S & ActionMap<A>>(
  viewModelFactory: ViewModelFactory<S, A, Difference<P, S & ActionMap<A>>>
): (
  WrappedComponent: React.ComponentType<P>
) => React.ComponentClass<Difference<P, S & ActionMap<A>>> {
  return function wrapWithConnect(
    WrappedComponent: React.ComponentType<P>
  ): React.ComponentClass<Difference<P, S & ActionMap<A>>> {
    return class ConnectState extends React.Component<Difference<P, S & ActionMap<A>>, S> {
      subscription: Subscription | undefined;
      actions: ActionMap<A>;
      observableState: Observable<S>;
      propsObservable: Subject<Difference<P, S & ActionMap<A>>> = new ReplaySubject<
        Difference<P, S & ActionMap<A>>
      >(1);

      constructor(props: Difference<P, S & ActionMap<A>>) {
        super(props);
        let viewModel = viewModelFactory(this.propsObservable);
        this.observableState = viewModel.inputs ? combineObservables(viewModel.inputs) : Observable.of({}) as Observable<S>;
        this.actions = viewModel.outputs ? subjectMapToActionMap(viewModel.outputs) : {} as ActionMap<A>;
      }

      componentDidMount() {
        this.propsObservable.next(this.props);
        this.subscription = this.observableState.subscribe(newState => this.setState(newState));
      }

      componentDidUpdate(prevProps: Difference<P, S & ActionMap<A>>) {
        if (this.props !== prevProps) {
          this.propsObservable.next(this.props);
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

export function withViewModel<S, A, P extends S & ActionMap<A>>(
  viewModel: ViewModel<S, A> | ViewModelFactory<S, A, Difference<P, S & ActionMap<A>>>,
  WrappedComponent: React.ComponentType<P>
): React.ComponentClass<Difference<P, S & ActionMap<A>>> {
  if (typeof viewModel === "function") {
    return withViewModelFactory<S, A, P>(viewModel)(WrappedComponent);
  } else {
    return withViewModelFactory<S, A, P>(() => viewModel)(WrappedComponent);
  }
}
