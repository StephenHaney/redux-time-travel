# redux-time-travel v0.1
A scalable undo redo time travel implementation that leaves your original state intact... powered by diffs and merges.

## Quick Start

### Installation:
`npm install redux-time-travel`

### Wire up:
1. In your store file, import the `timeTravelReducer` and `createTimeTravelMiddleware` functions:
```
import createTimeTravelMiddleware from 'redux-time-travel/timeTravelMiddleware';
import timeTravelReducer from 'redux-time-travel/timeTravelReducer';
```

2. Configure options (all optional) and instantiate the middleware:
```
const timeTravelOptions = {
  slicesToWatch: ['slices', 'of', 'state', 'to', 'track'],
  maxHistoryLength: 30,
  actionsToIgnore: [ACTION_TYPE_TO_IGNORE_1, ACTION_TYPE_TO_IGNORE_2],
  actionsToGroup: [ [GROUPED_ACTION_1, GROUPED_ACTION_2] ],
};
const timeTravel = createTimeTravelMiddleware(timeTravelOptions);
```

3. Wrap your combined reducers in the reducer function:
```
const appReducers = combineReducers({ appReducer1, appReducer2 });
const timeTravelReducer = timeTravelReducer(appReducers);
```

4. Create your store with the timeTravel middleware:
```
const store = createStore(timeTravelReducer, initialState, applyMiddleware(timeTravel));
```

### Undo / Redo:
1. In the file where you'd like to trigger a time travel event, import the time travel action creators:
```
import { timeTravelBackward, timeTravelForward } from 'redux-time-travel/timeTravelActions';
```

2. In your connect function, add the time travel action creators to the mapDispatchToProps:
```
export default connect(null, { timeTravelBackward, timeTravelForward })(ExampleComponent);
```

3. Invoke whenever you are ready for an undo / redo!
```
// Undo the last change in the history:
this.props.timeTravelBackward();
```

## Settings
_TODO_

## Current Limitations
_TODO_

## Performance
_TODO_
