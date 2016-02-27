"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isPromise = isPromise;
function isPromise(obj) {
  return obj && obj.then instanceof Function;
}