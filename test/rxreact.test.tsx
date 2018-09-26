import * as React from "react";
import { Observable, Subject, combineLatest, of } from "rxjs";
import { map, startWith, merge } from "rxjs/operators";
import { withViewModel } from "../src/rxreact";
import { mount, ReactWrapper } from "enzyme";

describe("withViewModel", () => {
  describe("given no inputs or outputs", () => {
    let Component: React.SFC = ({}) => <div>I'm rendered</div>;
    let rendered: ReactWrapper<any, any>;

    function subject() {
      let vm = {};
      let ComponentWithViewModel = withViewModel(vm)(Component);
      return mount(<ComponentWithViewModel />);
    }

    beforeEach(() => {
      rendered = subject();
    });
    afterEach(() => {
      rendered.unmount();
    });

    it("renders immediatly", () => {
      expect(rendered.exists()).toEqual(true);
      expect(rendered.text()).toContain("I'm rendered");
    });
  });

  describe("given a static view model definition", () => {
    interface ComponentProps {
      otherProp: string;
      derived1: string;
      derived2: string;
      inputNumber: (_: number) => void;
      inputString: (_: string) => void;
    }

    let Component: React.SFC<ComponentProps> = ({
      derived1,
      derived2,
      inputNumber,
      inputString,
      otherProp
    }) => {
      return (
        <div>
          <p id="other">{otherProp}</p>
          <p id="state">
            We have {derived1} {derived2}
          </p>
          <button id="number-button" onClick={() => inputNumber(6)}>
            Set the number of things to 6
          </button>
          <button id="string-button" onClick={() => inputString("apples")}>
            Set the thing to be apples
          </button>
        </div>
      );
    };

    describe("given as seperate signals", function() {
      let numberSubject: Subject<number> = new Subject();
      let stringSubject: Subject<string> = new Subject();
      let derived1Signal: Observable<string>;
      let derived2Signal: Observable<string>;

      function subject() {
        let vm = {
          inputs: {
            derived1: derived1Signal,
            derived2: derived2Signal
          },
          outputs: {
            inputNumber: numberSubject,
            inputString: stringSubject
          }
        };
        let ComponentWithViewModel = withViewModel(vm)(Component);
        return mount(<ComponentWithViewModel otherProp={"cheese"} />);
      }

      let rendered: ReactWrapper<any, any>;

      describe("with a view model that has an initial value for state", () => {
        beforeEach(() => {
          derived1Signal = combineLatest(numberSubject, stringSubject).pipe(
            map(([num, str]) => `${num} ${str}`),
            startWith("2 bananas")
          );
          derived2Signal = of("applesauce");
          rendered = subject();
        });
        afterEach(() => {
          rendered.unmount();
        });

        it("renders passed in properties", () => {
          expect(rendered.find("#other").text()).toContain("cheese");
        });
        it("renders initial state", () => {
          expect(rendered.find("#state").text()).toContain("We have 2 bananas");
        });

        describe("when actions are called", () => {
          it("emits values from subjects", () => {
            expect.assertions(2);
            let numberSubscription = numberSubject.subscribe(num => expect(num).toBe(6));
            let stringSubscription = stringSubject.subscribe(str => expect(str).toBe("apples"));

            rendered.find("#number-button").simulate("click");
            rendered.find("#string-button").simulate("click");
          });

          it("updates the dom as observables change", () => {
            rendered.find("#number-button").simulate("click");
            // no update -- derived observable only emits when both subjects have emitted
            expect(rendered.find("#state").text()).toContain("We have 2 bananas");
            rendered.find("#string-button").simulate("click");
            expect(rendered.find("#state").text()).toContain("We have 6 apples");
          });
        });

        describe("when props change", () => {
          it("updates the dom as expected", () => {
            rendered.setProps({ otherProp: "moldy cheese" });
            expect(rendered.find("#other").text()).toContain("moldy cheese");
          });
        });
      });

      describe("with a view model that has no initial value for state", () => {
        let initDerivedSignal2: Subject<string> = new Subject();
        beforeEach(() => {
          derived1Signal = combineLatest(numberSubject, stringSubject).pipe(
            map(([num, str]) => `${num} ${str}`),
            startWith("2 bananas")
          );
          derived2Signal = initDerivedSignal2;
          rendered = subject();
        });
        afterEach(() => {
          rendered.unmount();
        });

        it("renders nothing until all observables have values", () => {
          expect(rendered.exists()).toEqual(true);
        });

        describe("when observables get values", () => {
          beforeEach(async () => {
            initDerivedSignal2.next("applesauce");
          });

          it("renders content", () => {
            rendered.update();
            expect(rendered.find("#other").text()).toContain("cheese");
            expect(rendered.find("#state").text()).toContain("We have 2 bananas applesauce");
          });
        });
      });
    });

    describe("given as single state signal", () => {
      let numberSubject: Subject<number> = new Subject();
      let stringSubject: Subject<string> = new Subject();
      let derived: Observable<{ derived1: string; derived2: string }>;

      function subject() {
        let vm = {
          inputs: derived,
          outputs: {
            inputNumber: numberSubject,
            inputString: stringSubject
          }
        };
        let ComponentWithViewModel = withViewModel(vm)(Component);
        return mount(<ComponentWithViewModel otherProp={"cheese"} />);
      }

      let rendered: ReactWrapper<any, any>;

      describe("with a view model that has an initial value for state", () => {
        beforeEach(() => {
          derived = combineLatest(numberSubject, stringSubject).pipe(
            map(([num, str]) => ({
              derived1: `${num} ${str}`,
              derived2: "applesauce"
            })),
            startWith({
              derived1: "2 bananas",
              derived2: "applesauce"
            })
          );
          rendered = subject();
        });
        afterEach(() => {
          rendered.unmount();
        });

        it("renders passed in properties", () => {
          expect(rendered.find("#other").text()).toContain("cheese");
        });
        it("renders initial state", () => {
          expect(rendered.find("#state").text()).toContain("We have 2 bananas");
        });

        describe("when actions are called", () => {
          it("emits values from subjects", () => {
            expect.assertions(2);
            let numberSubscription = numberSubject.subscribe(num => expect(num).toBe(6));
            let stringSubscription = stringSubject.subscribe(str => expect(str).toBe("apples"));

            rendered.find("#number-button").simulate("click");
            rendered.find("#string-button").simulate("click");
          });

          it("updates the dom as observables change", () => {
            rendered.find("#number-button").simulate("click");
            // no update -- derived observable only emits when both subjects have emitted
            expect(rendered.find("#state").text()).toContain("We have 2 bananas");
            rendered.find("#string-button").simulate("click");
            expect(rendered.find("#state").text()).toContain("We have 6 apples");
          });
        });

        describe("when props change", () => {
          it("updates the dom as expected", () => {
            rendered.setProps({ otherProp: "moldy cheese" });
            expect(rendered.find("#other").text()).toContain("moldy cheese");
          });
        });
      });

      describe("with a view model that has no initial value for state", () => {
        let initDerivedSignal: Subject<{ derived1: string; derived2: string }> = new Subject();
        beforeEach(() => {
          derived = combineLatest(numberSubject, stringSubject).pipe(
            map(([num, str]) => ({
              derived1: `${num} ${str}`,
              derived2: "applesauce"
            })),
            merge(initDerivedSignal)
          );
          rendered = subject();
        });
        afterEach(() => {
          rendered.unmount();
        });

        it("renders nothing until all observables have values", () => {
          expect(rendered.exists()).toEqual(true);
        });

        describe("when observables get values", () => {
          beforeEach(async () => {
            initDerivedSignal.next({
              derived1: "2 bananas",
              derived2: "applesauce"
            });
          });

          it("renders content", () => {
            rendered.update();
            expect(rendered.find("#other").text()).toContain("cheese");
            expect(rendered.find("#state").text()).toContain("We have 2 bananas applesauce");
          });
        });
      });
    });
  });

  describe("given a factory function that returns a view model", () => {
    let vm = (otherProps: Observable<{ otherProp: string }>) => {
      let tempSubject: Subject<string> = new Subject();

      return {
        inputs: {
          propDerived: otherProps.pipe(map(otherProps => `how bout some ${otherProps.otherProp}`)),
          subjectDerived: tempSubject.pipe(startWith("oranges"))
        },
        outputs: {
          inputString: tempSubject
        }
      };
    };

    interface ComponentProps {
      otherProp: string;
      otherOtherProp: string;
      propDerived: string;
      subjectDerived: string;
      inputString: (_: string) => void;
    }

    let Component: React.SFC<ComponentProps> = ({
      otherProp,
      otherOtherProp,
      propDerived,
      subjectDerived,
      inputString
    }) => {
      return (
        <div>
          <p id="pass-through">{otherOtherProp}</p>
          <p id="prop-derived">{propDerived}</p>
          <p id="subject-derived">{subjectDerived}</p>

          <button id="string-button" onClick={() => inputString("apples")}>
            Set the thing to be apples
          </button>
        </div>
      );
    };

    let ComponentWithViewModel = withViewModel(vm)(Component);

    let rendered: ReactWrapper<any, any>;

    beforeEach(() => {
      rendered = mount(
        <ComponentWithViewModel otherOtherProp="pass-through" otherProp={"cheese"} />
      );
    });

    afterEach(() => {
      rendered.unmount();
    });
    it("can still pass through props", () => {
      expect(rendered.find("#pass-through").text()).toContain("pass-through");
    });
    it("builds derived signals from props", () => {
      expect(rendered.find("#prop-derived").text()).toContain("how bout some cheese");
    });
    it("renders temporary subject derived signal", () => {
      expect(rendered.find("#subject-derived").text()).toContain("oranges");
    });

    describe("when actions are called on temporary subject", () => {
      beforeEach(() => {
        rendered.find("#string-button").simulate("click");
      });

      it("updates dom", () => {
        expect(rendered.find("#subject-derived").text()).toContain("apples");
      });

      describe("when component is reinstantiated", () => {
        beforeEach(() => {
          rendered.unmount();
          rendered = mount(
            <ComponentWithViewModel otherOtherProp={"pass-through"} otherProp={"cheese"} />
          );
        });

        it("resets subject derived signal", () => {
          expect(rendered.find("#subject-derived").text()).toContain("oranges");
        });
      });
    });

    describe("when props change", () => {
      it("updates prop derived signals", () => {
        rendered.setProps({ otherProp: "moldy cheese" });
        expect(rendered.find("#prop-derived").text()).toContain("how bout some moldy cheese");
      });
    });
  });
});
