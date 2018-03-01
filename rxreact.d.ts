/// <reference types="react" />
import * as React from "react";
import { ActionMap, ViewModelFactory, Difference, ViewModel } from "./types";
export declare function withViewModel<S, A, P extends S & ActionMap<A>>(viewModel: ViewModel<S, A> | ViewModelFactory<S, A, Difference<P, S & ActionMap<A>>>, WrappedComponent: React.ComponentType<P>): React.ComponentClass<Difference<P, S & ActionMap<A>>>;
