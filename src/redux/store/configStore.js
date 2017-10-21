import { AsyncStorage } from 'react-native';
import { createStore, applyMiddleware, compose } from 'redux';
import { createLogger } from 'redux-logger';
import { persistStore, autoRehydrate, purgeStoredState } from 'redux-persist';
import createSagaMiddleware from 'redux-saga';
import env from 'utils/env';

import rootReducer from './indexReducers';
import rootSaga from './rootSaga';

// Env
const { PERSIST_ENABLED, PERSIST_PURGE, ENV } = env;

// Common Middlewares
const sagaMiddleware = createSagaMiddleware();
const middlewares = [sagaMiddleware];
let enhancer = [];

if (ENV === 'development') {
  const logger = createLogger({
    duration: true,
    timestamp: true,
    collapsed: (getState, action) => {
      const types = ['persist/REHYDRATE'];

      return types.includes(action.type);
    },
  });

  middlewares.push(logger);

  enhancer = compose(
    PERSIST_ENABLED === 'true' ? autoRehydrate() : f => f,
    applyMiddleware(...middlewares),
    window.__REDUX_DEVTOOLS_EXTENSION__ // eslint-disable-line
      ? window.__REDUX_DEVTOOLS_EXTENSION__({}) // eslint-disable-line
      : f => f,
  );
} else {
  enhancer = compose(autoRehydrate(), applyMiddleware(...middlewares));
}

export default function configureStore() {
  const store = createStore(rootReducer, undefined, enhancer);

  sagaMiddleware.run(rootSaga);

  if (PERSIST_ENABLED === 'true') {
    persistStore(store, {
      storage: AsyncStorage,
      debounce: 500,
      blacklist: ['nav'],
    });
  }

  if (PERSIST_PURGE === 'true') {
    purgeStoredState({ storage: AsyncStorage });
  }

  return store;
}
