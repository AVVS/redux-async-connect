'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.loadFail = exports.loadSuccess = exports.load = exports.endGlobalLoad = exports.beginGlobalLoad = exports.clearKey = exports.reducer = exports.END_GLOBAL_LOAD = exports.BEGIN_GLOBAL_LOAD = exports.CLEAR = exports.LOAD_FAIL = exports.LOAD_SUCCESS = exports.LOAD = undefined;

var _handleActions;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.asyncConnect = asyncConnect;

var _reactRedux = require('react-redux');

var _reduxActions = require('redux-actions');

var _isPromise = require('./isPromise.js');

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var LOAD = exports.LOAD = 'reduxAsyncConnect/LOAD';
var LOAD_SUCCESS = exports.LOAD_SUCCESS = 'reduxAsyncConnect/LOAD_SUCCESS';
var LOAD_FAIL = exports.LOAD_FAIL = 'reduxAsyncConnect/LOAD_FAIL';
var CLEAR = exports.CLEAR = 'reduxAsyncConnect/CLEAR';
var BEGIN_GLOBAL_LOAD = exports.BEGIN_GLOBAL_LOAD = 'reduxAsyncConnect/BEGIN_GLOBAL_LOAD';
var END_GLOBAL_LOAD = exports.END_GLOBAL_LOAD = 'reduxAsyncConnect/END_GLOBAL_LOAD';

var initialState = {
  loaded: false,
  loadState: {}
};

var reducer = exports.reducer = (0, _reduxActions.handleActions)((_handleActions = {}, _defineProperty(_handleActions, BEGIN_GLOBAL_LOAD, function (state) {
  return _extends({}, state, {
    loaded: false
  });
}), _defineProperty(_handleActions, END_GLOBAL_LOAD, function (state) {
  return _extends({}, state, {
    loaded: true
  });
}), _defineProperty(_handleActions, LOAD, function (state, _ref) {
  var payload = _ref.payload;
  return _extends({}, state, {
    loadState: _extends({}, state.loadState, _defineProperty({}, payload.key, {
      loading: true,
      loaded: false
    }))
  });
}), _defineProperty(_handleActions, LOAD_SUCCESS, function (state, _ref2) {
  var _ref2$payload = _ref2.payload;
  var key = _ref2$payload.key;
  var data = _ref2$payload.data;
  return _extends({}, state, _defineProperty({
    loadState: _extends({}, state.loadState, _defineProperty({}, key, {
      loading: false,
      loaded: true,
      error: null
    }))
  }, key, data));
}), _defineProperty(_handleActions, LOAD_FAIL, function (state, _ref3) {
  var _ref3$payload = _ref3.payload;
  var key = _ref3$payload.key;
  var error = _ref3$payload.error;
  return _extends({}, state, {
    loadState: _extends({}, state.loadState, _defineProperty({}, key, {
      loading: false,
      loaded: false,
      error: error
    }))
  });
}), _defineProperty(_handleActions, CLEAR, function (state, _ref4) {
  var payload = _ref4.payload;
  return _extends({}, state, _defineProperty({
    loadState: _extends({}, state.loadState, _defineProperty({}, payload, {
      loading: false,
      loaded: false,
      error: null
    }))
  }, payload, null));
}), _handleActions), initialState);

var clearKey = exports.clearKey = (0, _reduxActions.createAction)(CLEAR);

var beginGlobalLoad = exports.beginGlobalLoad = (0, _reduxActions.createAction)(BEGIN_GLOBAL_LOAD);

var endGlobalLoad = exports.endGlobalLoad = (0, _reduxActions.createAction)(END_GLOBAL_LOAD);

var load = exports.load = (0, _reduxActions.createAction)(LOAD, function (key) {
  return {
    key: key
  };
});

var loadSuccess = exports.loadSuccess = (0, _reduxActions.createAction)(LOAD_SUCCESS, function (key, data) {
  return {
    key: key,
    data: data
  };
});

var loadFail = exports.loadFail = (0, _reduxActions.createAction)(LOAD_FAIL, function (key, error) {
  return {
    key: key,
    error: error
  };
});

function wrapWithDispatch(asyncItems) {
  return asyncItems.map(function (item) {
    var key = item.key;
    if (!key) {
      return item;
    }

    return _extends({}, item, {
      promise: function promise(options) {
        var dispatch = options.store.dispatch;

        var next = item.promise(options);

        if ((0, _isPromise.isPromise)(next)) {
          dispatch(load(key));
          next.then(function (data) {
            return dispatch(loadSuccess(key, data));
          }).catch(function (err) {
            return dispatch(loadFail(key, err));
          });
        } else if (next) {
          dispatch(loadSuccess(key, next));
        }

        return next;
      }
    });
  });
}

function asyncConnect(asyncItems) {
  return function (Component) {
    Component.reduxAsyncConnect = wrapWithDispatch(asyncItems);

    var finalMapStateToProps = function finalMapStateToProps(state) {
      return asyncItems.reduce(function (result, _ref5) {
        var key = _ref5.key;

        if (!key) {
          return result;
        }

        return _extends({}, result, _defineProperty({}, key, state.reduxAsyncConnect[key]));
      }, {});
    };

    return (0, _reactRedux.connect)(finalMapStateToProps)(Component);
  };
}