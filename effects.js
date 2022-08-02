const $ = (id) => this[`$${id}`];

const $RETURN = (value) => (this["$RETURN"] = value);
const $MASK = (id) => (this[`$${id}`] = this["$PREV_HANDLERS"][`$${id}`]);

const handle =
  (handlers, fn) =>
  (...args) => {
    let prevHandlers = {};
    Object.entries(handlers)
      .map(([id, handler]) => [`$${id}`, handler])
      .forEach(([id, handler]) => {
        prevHandlers[id] = this[id];
        this[id] = handler;
      });
    this["$PREV_HANDLERS"] = prevHandlers;
    let result = fn(...args);
    Object.entries(prevHandlers).forEach(([id, handler]) => {
      this[id] = handler;
    });

    const $return = this["$RETURN"];
    if (typeof $return !== undefined) {
      this["$RETURN"] = undefined;
      return $return;
    }
    return result;
  };

const useState = (init) => {
  let value = init;
  return [() => value, (v) => (value = v)];
};

const iterateState = () => {
  const [getState, setState] = $("state");

  setState(getState() + 1);
};

const logState = () => {
  const [getState] = $("state");
  console.log(getState());
};

const callDeep = () => {
  console.log("call deep 1");
  logState();
  iterateState();
  logState();
};

const callDeep2 = handle(
  {
    state: useState(5),
  },
  () => {
    console.log("call deep 2");
    logState();
    iterateState();
    logState();
  }
);

const callDeep3 = handle(
  {
    state: useState(10),
  },
  () => {
    $MASK("state");
    console.log("call deep 3");
    logState();
    iterateState();
    logState();
  }
);

const traverse = ([head, ...tail]) => {
  if (typeof head !== undefined) {
    if ($("yield")(head)) return traverse(tail);
    else return [];
  }
  return [];
};

const safeDivide = (x, y) => (y === 0 ? $("raise")("div-by-zero") : x / y);

const raiseConst = handle(
  {
    raise: (msg) => $RETURN(42),
  },
  () => {
    let n = safeDivide(1, 0);

    return 8 + n;
  }
);

const main = function () {
  handle(
    {
      state: useState(1),
      yield: (i) => {
        console.log(`yielded ${i}`);
        return i <= 2;
      },
    },
    () => {
      // yield
      traverse([1, 2, 3, 4]);

      // raise
      console.log(raiseConst());

      // state
      callDeep();
      callDeep2();
      callDeep();
      callDeep3();
    }
  )();
}.bind({});

main();
