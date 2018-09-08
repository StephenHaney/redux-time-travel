# Redux Time Travel
A scalable undo redo time travel implementation that leaves your original state intact... powered by diffs and merges.

[![npm](https://img.shields.io/npm/v/redux-time-travel.svg)](https://www.npmjs.com/package/redux-time-travel)
[![NpmLicense](https://img.shields.io/npm/l/redux-time-travel.svg)](https://www.npmjs.com/package/redux-time-travel)
[![style](https://img.shields.io/badge/code_style-airbnb-green.svg)](https://www.npmjs.com/package/redux-time-travel)
[![dependencies Status](https://david-dm.org/stephenhaney/redux-time-travel/status.svg)](https://david-dm.org/stephenhaney/redux-time-travel)

## Quick Start

### Installation:
`npm i redux-time-travel --save`

### Wire up:
In your store, import the `createTimeTravelMiddleware` and `timeTravelReducer` functions:
```
import createTimeTravelMiddleware, { timeTravelReducer } from 'redux-time-travel';
```

Wrap your combined reducers in the reducer function:
```
const rootReducer = timeTravelReducer(combineReducers({ appReducer1, appReducer2 }));
```

Instantiate the middleware (see Settings section below for configuration):
```
const timeTravel = createTimeTravelMiddleware();
```

Invoke Redux `createStore` with the `timeTravel` middleware:
```
const store = createStore(rootReducer, initialState, applyMiddleware(timeTravel));
```

### Undo / Redo:
In the file where you'd like to trigger a time travel event, import the time travel action creators:
```
import { timeTravelBackward, timeTravelForward } from 'redux-time-travel';
```

In your connect function, add the time travel action creators to the mapDispatchToProps:
```
export default connect(null, { timeTravelBackward, timeTravelForward })(ExampleComponent);
```

Invoke whenever you are ready for an undo / redo!
```
// Undo the last change in the history:
this.props.timeTravelBackward();

// Redo forward in the history:
this.props.timeTravelForward();
```

## Settings
You can change settings by providing a configuration object to the middleware creator, like this:
```
const timeTravelOptions = {
  maxHistoryLength: 30,
  slicesToWatch: ['values', 'interface'],
  actionsToIgnore: [
    UPDATE_AUTH_USER,
    UPDATE_PROJECTS_META,
  ],
  actionsToGroup: [
    [TREE_CREATE_NODE, TREE_INSERT_CHILD_NODE]
   ],
};
const timeTravel = createTimeTravelMiddleware(timeTravelOptions);
```

### Options

#### maxHistoryLength
_int_
Specify the number of history events that will be cached. Higher settings allow more undo events, but take up more memory.

#### slicesToWatch
_array of strings_
By default, Redux Time Travel will keep track of all slices in your state and move them forward or backward with time travel events. Often, we only need to undo/redo slices of our state (like a user changing a value) while ignoring other slices of our state (like the currently authorized user). You can use slicesToWatch to specify the state slices that should be impacted by undos and redos.

#### actionsToIgnore (usually unnecessary)
_array of strings (action types)_
By default, Redux Time Travel pays attention to every action and keeps track of the resulting changes. If you know certain actions will never impact slices of state that you want to undo/redo, you can tell Redux Time Travel to ignore these actions, which saves some 

__IMPORTANT:__ actionsToIgnore is potentially dangerous and usually premature optimization. If you accidentally tell Redux Time Travel to ignore an action that DOES end up impacting a slice of state that is watched and time travels, you can push your state unrecoverably out of sync. 

#### actionsToGroup
Sometimes a single undo should undo multiple actions. Common use cases include creating a new entry in state, and then in a separate action assocating it with another element as a child or parent.

You can tell Redux Time Travel to treat multiple concurrent actions as one change event by specifying actionsToGroup.

A few limitations:
1. Currently, each action type can only belong to one group.
2. Actions cannot group with themselves... e.g., 2 concurrent actions of the same type will always create 2 change events.

## Future Improvements
1. Tests written for 100% coverage
2. Action grouping and ignoring could be enhanced with new features (see issues for specifics)
3. Thorough scalability and performance testing
4. Add option to store diffs in state to allow for undo/redo persistence across browsing sessions.

## Performance

### Recommendations
1. __DO__ use slicesToWatch to specify slices of state that need to move forward and backward.
2. __DON'T__ use actionsToIgnore unless you understand what you're doing. You can potentially break your state if you ignore an action that impacts a time traveled reducer slice. The performance savings are very small.

### Test Results
__On every action:__ Even in complex state trees, the middleware differ averages between 0 and 1 ms on an older MacBook laptop.

__During undo / redo events:__ In initial tests, the additional time spent in time travel code is under 1 ms.

__Testing Needed__ More testing is needed, especially on mobile devices, but initial results point to a very low performance impact and high scalability.

## License
Copyright 2018 Stephen Haney

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
