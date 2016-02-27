'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports.loadOnServer = loadOnServer;

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _RouterContext = require('react-router/lib/RouterContext');

var _RouterContext2 = _interopRequireDefault(_RouterContext);

var _asyncConnect = require('./asyncConnect');

var _reactRedux = require('react-redux');

var _isPromise = require('./isPromise.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var array = _react.PropTypes.array;
var func = _react.PropTypes.func;
var object = _react.PropTypes.object;
var any = _react.PropTypes.any;

/**
 * We need to iterate over all components for specified routes.
 * Components array can include objects if named components are used:
 * https://github.com/rackt/react-router/blob/latest/docs/API.md#named-components
 *
 * @param components
 * @param iterator
 */

function eachComponents(components, iterator) {
  var _loop = function _loop(i, l) {
    // eslint-disable-line id-length
    var component = components[i];
    if ((typeof component === 'undefined' ? 'undefined' : _typeof(component)) === 'object') {
      var keys = Object.keys(component);
      keys.forEach(function (key) {
        return iterator(component[key], i, key);
      });
    } else {
      iterator(component, i);
    }
  };

  for (var i = 0, l = components.length; i < l; i++) {
    _loop(i, l);
  }
}

function filterAndFlattenComponents(components) {
  var flattened = [];
  eachComponents(components, function (component) {
    if (component && component.reduxAsyncConnect) {
      flattened.push(component);
    }
  });
  return flattened;
}

function loadAsyncConnect(_ref) {
  var components = _ref.components;
  var _ref$filter = _ref.filter;
  var filter = _ref$filter === undefined ? function () {
    return true;
  } : _ref$filter;

  var rest = _objectWithoutProperties(_ref, ['components', 'filter']);

  var flattened = filterAndFlattenComponents(components);

  // this allows us to have nested promises, that rely on each other's completion
  // cycle
  return _bluebird2.default.mapSeries(flattened, function (component) {
    var asyncItems = component.reduxAsyncConnect;

    return _bluebird2.default.resolve(asyncItems).reduce(function (itemsResults, item) {
      if (filter(item, component)) {
        var promiseOrResult = item.promise(rest);

        if ((0, _isPromise.isPromise)(promiseOrResult)) {
          promiseOrResult = promiseOrResult.catch(function (error) {
            return { error: error };
          });
        }

        itemsResults.push(promiseOrResult);
      }

      return itemsResults;
    }, []).reduce(function (finalResult, result, idx) {
      var key = asyncItems[idx].key;

      if (key) {
        finalResult[key] = result;
      }

      return finalResult;
    }, {});
  });
}

function loadOnServer(args) {
  return loadAsyncConnect(args).then(function () {
    args.store.dispatch((0, _asyncConnect.endGlobalLoad)());
  });
}

var ReduxAsyncConnect = function (_React$Component) {
  _inherits(ReduxAsyncConnect, _React$Component);

  function ReduxAsyncConnect(props, context) {
    _classCallCheck(this, ReduxAsyncConnect);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(ReduxAsyncConnect).call(this, props, context));

    _this.state = {
      propsToShow: _this.isLoaded() ? props : null
    };

    _this.loadDataCounter = 0;
    return _this;
  }

  _createClass(ReduxAsyncConnect, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      var dataLoaded = this.isLoaded();

      if (!dataLoaded) {
        // we dont need it if we already made it on server-side
        this.loadAsyncData(this.props);
      }
    }
  }, {
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(nextProps) {
      this.loadAsyncData(nextProps);
    }
  }, {
    key: 'shouldComponentUpdate',
    value: function shouldComponentUpdate(nextProps, nextState) {
      return this.state.propsToShow !== nextState.propsToShow;
    }
  }, {
    key: 'isLoaded',
    value: function isLoaded() {
      return this.context.store.getState().reduxAsyncConnect.loaded;
    }
  }, {
    key: 'loadAsyncData',
    value: function loadAsyncData(props) {
      var _this2 = this;

      var store = this.context.store;
      var loadResult = loadAsyncConnect(_extends({}, props, { store: store }));

      this.loadDataCounter++;
      this.props.beginGlobalLoad();
      (function (loadDataCounterOriginal) {
        loadResult.then(function () {
          // We need to change propsToShow only if loadAsyncData that called this promise
          // is the last invocation of loadAsyncData method. Otherwise we can face situation
          // when user is changing route several times and we finally show him route that has
          // loaded props last time and not the last called route
          if (_this2.loadDataCounter === loadDataCounterOriginal) {
            _this2.setState({ propsToShow: props });
          }

          _this2.props.endGlobalLoad();
        });
      })(this.loadDataCounter);
    }
  }, {
    key: 'render',
    value: function render() {
      var propsToShow = this.state.propsToShow;

      return propsToShow && this.props.render(propsToShow);
    }
  }]);

  return ReduxAsyncConnect;
}(_react2.default.Component);

ReduxAsyncConnect.propTypes = {
  components: array.isRequired,
  params: object.isRequired,
  render: func.isRequired,
  beginGlobalLoad: func.isRequired,
  endGlobalLoad: func.isRequired,
  helpers: any
};
ReduxAsyncConnect.contextTypes = {
  store: object.isRequired
};
ReduxAsyncConnect.defaultProps = {
  render: function render(props) {
    return _react2.default.createElement(_RouterContext2.default, props);
  }
};
exports.default = (0, _reactRedux.connect)(null, { beginGlobalLoad: _asyncConnect.beginGlobalLoad, endGlobalLoad: _asyncConnect.endGlobalLoad })(ReduxAsyncConnect);