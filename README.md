[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![Greenkeeper badge](https://badges.greenkeeper.io/carbonfive/rxreact.svg)](https://greenkeeper.io/)
[![CircleCI](https://circleci.com/gh/carbonfive/rxreact.svg?style=svg)](https://circleci.com/gh/carbonfive/rxreact)
[![Coverage Status](https://coveralls.io/repos/github/carbonfive/rxreact/badge.svg?branch=master)](https://coveralls.io/github/carbonfive/rxreact?branch=master)

Development Sponsored By:  
[![Carbon Five](./assets/C5_final_logo_horiz.png)](http://www.carbonfive.com)


# RxReact

Typescript based RX bindings for React


React is a great library for implementing the view layer of web applications.
RxJS is a great library for handling state management and implementing your domain model in a web application.
Typescript brings scalability and reliability of static types to Javascript.

Why not marry these great tools?

![Yo Dawg](https://i.imgflip.com/2gd9fp.jpg)

## Installation

In your project:

```
npm install @rxreact/core --save
```

or

```
yarn add @rxreact/core
```

RxJS and React are peer dependencies and need to be installed seperately

## Basic Usage

RxReact is tool for integrating your React apps with RxJS. It leverages the power of Typescript to provide strong gaurantees that your Rx Observables and Subjects will integrate properly with your React components

[Typedocs for RxReact](https://hannahhoward.github.io/rxreact)

### Defining a View Model

The core concept of RxReact is a View Model. The ViewModel binds the model / state management layer of your application, expressed with RxJS, to a view, expressed as a React Component.

A view model consists of two components:

1. _Inputs_ -- a collection of Rx Observables that provide data to a React Component. Inputs is expressed as set of key value pairs with Observables as values.
2. _Outputs_ -- a collections of Rx Subjects that provide commands a React Component can call to update the model layer. Outputs is also expressed as a set of key value pairs with Subjects as values.

Expressed in code, a view model looks like this:

```typescript
// a list of cars to display
let cars$ : Observable<Car[]> = Observable.of([car1, car2, car3])

// a subject representing the action of a user selecting a car
let selectCar$: Subject<CarId> = new Subject();

// the currently selected car, found in the car list each time the user
// selects a car id
let selectedCar$ : Observable<Car | undefined> =
   combineLatest(cars$, selectCar$).pipe(
     map(([cars, selectedCarId]) => cars.find(car => car.id == selectedCarId))
     startWith(undefined)
   )

let vm = {
  inputs: {
    cars: cars$,
    selectedCar: selectedCar$
  },
  outputs: {
    selectCar: selectCar$
  }
};
```

### Connecting to a React Component

Let's say you have React Component Like this:

```typescript
interface CarComponentProps {
  cars: Car[],
  selectedCar: Car | undefined,
  selectCar: (carId: CarId) => void;
  listName: string;
}

let CarComponent: React.SFC<CarComponentProps> = ({ cars, selectedCar, selectCar, listName}) => {
  return (
    <div>
      <h1>{listName}</h1>
      <ul>
        {
          cars.map(car => (
            <li key={car.id} onClick={() => selectCar(car.id) } />
              {car.year} {car.make} {car.model}
            </li>
          ))
        }
      </ul>
      {
        selectedCar &&
        (<p>
         You have selected the {selectedCar.year} {selectedCar.make} {selectedCar.model}.
        </p>)
      }
    </div>
  )
}
```

What happens when you connect this component to view model listed above?

You connect components to view models by calling `withViewModel`, like so:

```typescript
import { withViewModel } from "@rxreact/core";
let CarComponentWithVm = withViewModel(vm)(CarComponent);
```

This higher order component function produces a new component that is connected to the view model. For each key in the `inputs` of the view model, the component receives a prop of the same name, whose value is populated with the latest value emitted by the Observable given in the view model. For each key in the `outputs` of the view model, the component receives a prop of the same name that is a function which takes a single parameter. When called, that parameter is pushed on the stream emitted by the Subject given in the view model (by calling `.next`).

Based on the example components's template, it would receive lists of cars from the `cars$` Observable as a `cars` prop and render them to an HTML unordered list. Each list item has a click handler than when called, pushes that car's id on to the `selectCar$` Subject. Because the `selectedCar$` Observable is derived by searching the car list by the car id emitted by `selectCar$` Subject, this will cause the value of `selectedCar` in the component to change from `undefined` to the Car that was clicked on, which will cause the selected car text to appear.

### What about passing props?

What about passing props to view model backed React Components. You might notice the `CarsComponent` above takes one additional prop -- `listName`. The `CarsComponentWithVm` component will also be able to take a `listName` which will get passed on the `CarsComponent`. However, it won't take as props the values passed from the view model.

### Leveraging Typescript

RxReact can be used with regular ES6 or even ES5. However, much of it's power comes when used with typescript. Because of the typesignature of `withViewModel`, all of the following will raise a type error (assuming TS's various strict options are turned on)

```typescript
let vm = {
  inputs: {
    cars: cars$,
    selectedCar: selectedCar$
    someOtherObservable: other$
  },
  outputs: {
    selectCar: selectCar$
  }
};
withViewModel(vm)(CarComponent) // type error -- car component does not expect someOtherObservable prop
```

```typescript
let users$: Observable<User[]> = Observable.of([user1, user2, user3]);
let vm = {
  inputs: {
    cars: users$,
    selectedCar: selectedCar$
  },
  outputs: {
    selectCar: selectCar$
  }
};
withViewModel(vm)(CarComponent); // type error -- cars property type does match type emitted by users$ observable
```

```typescript
function CallingComponent({}) {
  return <CarComponentWithVM />;
}

// type error, because CarComponentWithVM is missing listName prop.
// the CarComponentWithVm requires as props any props required by CarComponent that are not covered by the view model
```

```typescript
let vm = {
  inputs: {
    selectedCar: selectedCar$
  },
  outputs: {
    selectCar: selectCar$
  }
};
let CarComponentWithVM = withViewModel(vm)(CarComponent); // this will actually compile, cause now cars becomes a property that is required by CarComponentWithVM

function CallingComponent({}) {
  return (
    <CarComponentWithVM listName={listName} /> // this however will now raise an error because cars property is not included
  );
}
```

All of these type errors ensure a tight binding between the ViewModel and its ReactComponent -- so you know you've built them correctly to talk to each other before you even run it in the browser.

### An Important Caveat

In order to gaurantee your React component receives all the properties it expects, RxReact will not render the component until all of the Input observables have emitted at least once. Make sure you add `startWith` to the observable's chain if you want a default value

## Extra Power with ViewModelFactory

Sometimes it is useful to have observable data whose lifespan is confined to the life of a component, and potentially affected by the props passed to the component. A good example of this is a form. Usually, each time a user visits the form, the form is either populated with blank/default data or perhaps current state of a record the user is editing. If you edit fields, assuming you don't submit the form, the expected behavior if navigate elsewhere in the app and then come back is that the form is reset. If the values of form fields are stored in "global" streams, often you run into problems where you need to add a `componentWillMount` hook to take action to reset all the fields before the form renders.

RxReact provides a mechanism for temporary data by offering an extension of the ViewModel concept called a ViewModelFactory. A view model factory essentially defers the construction of the ViewModel until the Component is initialized. Concretely, it's described as a function that takes a single parameter that represents an observable of the props passed to the component (that will emit each time props change) and returns a ViewModel. Let's use this to imagine how we might right a simple form for the Car model used in examples above:

```typescript
let submitCar$ : Subject<Car> = new Subject()

let vmFactory = (ownProps$: Observable<{ car: Car | undefined })) => {
  let changeCarYear$: Subject<string> = new Subject()
  let changeCarMake$: Subject<string> = new Subject()
  let changeCarModel$: Subject<string> = new Subject()
  let submitForm$: Subject<void> = new Submit()

  let currentCarYear$ = ownProps$.pipe(
    map(ownProps) => ownProps.car ? ownProps.car.year : ""),
    merge(changeCarYear$)
  )
  let currentCarMake$ = ownProps$.pipe(
    map(ownProps) => ownProps.car ? ownProps.car.make : ""),
    merge(changeCarMake$)
  )
  let changeCarModel$ = ownProps$.pipe(
    map(ownProps) => ownProps.car ? ownProps.car.model : ""),
    merge(changeCarModel$)
  )

  submitForm$.pipe(
    withLastestFrom(currentCarYear$, currentCarMake$, currentCarModel$),
    map(([_, year, make, model]) => { year, make, model }))
  ).subscribe(submitCar$)

  return {
    inputs: {
      currentCarYear: currentCarYear$,
      currentCarMake: currentCarMake$,
      currentCarModel: currentCarModel$
    },
    outputs: {
      changeCarYear: changeCarYear$,
      changeCarMake: changeCarMake$,
      changeCarModel: changeCarModel$,
      submitForm: submitForm$
    }
  }
}

let CarFormComponentWithVM = withViewModel(vmFactory)(CarFormComponent)
```

Note that this form pattern could be generalized into a library for making reactive forms. In the future, RxReact may offer such a form library.

## How do I implement my model with RxJS?

RxReact for now offers no stong opinions on how you should implement your model. RxJs is an extremely robust and extensive library and there are several approaches to state management with Rx.

RxJS can take some time to learn. For starters, we recommend you get a little familiar with FRP:
https://gist.github.com/staltz/868e7e9bc2a7b8c1f754
https://egghead.io/courses/introduction-to-reactive-programming

If you like Redux, it's entirely possible to implement all the features of Redux with RxJS: https://michalzalecki.com/use-rxjs-with-react/

Here's another method that proposed building pieces of state streams:
https://medium.com/@markusctz/state-streams-and-react-7921e3c376a4

One concept in FRP the we use as authors of this library is a "signal graph". A signal graph concept is a way to visually represent the state of your program as a directed graph whose nodes are observables and whos connecting lines are operations for transform and combine those observables. In a visual diagram, usual the top or left of the graph are primary "signals" -- Subjects representing user input or initial state. Everything else in the graph are "derived" singals representing pieces of data which change in reaction to new values from the primary signals. Views are subscribed (in RxReact via ViewModels) to the derived pieces of data to provide feedback through the UI. We use this concept of a signal graph to design relationships between our observables and we maintain an actual graph representation (usually generated with PlantUML) as wel develop.

One nice element of Observables is that because all data streams are asynchronous, operations to transform observables can be themselves asynchronous. So, for example, a login form might begin with three "primary" signals represent an email input field, a password input field, and a login button. We could make a derived signal `loginRequested` by combining the email and password into a single object and that emits only when the login button is clicked. Then we can make an observable `loggedInUser` derived by submitting an API request to an authentication server every time the `loginRequested` signal emits and once complete, emitting the authenticated user returned by the backend (in Rx terms, an asynchronous request is usually accomplished with a `flatMap` operation). A new logged in user might result in additional API requests and derived signals representing account data for that user. Meanwhile, your views is simply subscribed to these derived pieces of data and updates itself as the values change.

This is just a very simple introduction to how we build signal graphs with RxJS. In the future, RxReact may provide official tools for defining a signal graph to represent the state of your application.
