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

2. Wrap your combined reducers in the reducer function:
```
const appReducers = combineReducers({ appReducer1, appReducer2 });
const timeTravelReducer = timeTravelReducer(appReducers);
```

3. Instantiate the middleware (see Settings section below for configuration):
```
const timeTravel = createTimeTravelMiddleware();
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

## Future Improvements
_TODO_

## Performance
_TODO_
