'use strict'
var isObservable = require('is-observable')
var xtend = require('xtend')
var hasOwn = {}.hasOwnProperty

function someKeys (object, predicateFn) {
  for (var key in object) {
    if (hasOwn.call(object, key) && predicateFn(object[key], key, object)) {
      return true
    }
  }
  return false
}

function create (ObservableImpl) {
  return function props (object) {
    ObservableImpl = (ObservableImpl || require('any-observable'))
    return new ObservableImpl(function (observer) {
      var snapshot = object

      var observableKeys = Object.keys(snapshot).filter(function (key) {
        return isObservable(snapshot[key])
      })

      var subscriptions = {}
      var pendingKeys = observableKeys.slice()
      observableKeys.forEach(subscribeKey)

      if (observableKeys.length === 0) {
        observer.next(snapshot)
        observer.complete()
      }

      return function unsubscribeAll () {
        return Object.keys(subscriptions).forEach(unsubscribeKey)
      }

      function subscribeKey (key) {
        subscriptions[key] = object[key].subscribe({
          next: onKeyUpdate,
          error: onKeyError,
          complete: onKeyComplete
        })

        function onKeyUpdate (value) {
          pendingKeys = pendingKeys.filter(k => k !== key)
          updateKey(key, value)
        }
        function onKeyError (error) {
          observer.error(error)
        }
        function onKeyComplete () {
          disposeKey(key)
        }
      }

      function checkDone () {
        if (!someKeys(subscriptions, Boolean)) {
          observer.complete()
        }
      }

      function disposeKey (key) {
        subscriptions[key] = undefined
        checkDone()
      }
      function unsubscribeKey (key) {
        if (subscriptions[key] !== undefined) {
          subscriptions[key].unsubscribe()
          disposeKey(key)
        }
      }

      function updateKey (key, next) {
        var nextSnapshot = xtend(snapshot)
        nextSnapshot[key] = next
        snapshot = nextSnapshot
        if (pendingKeys.length === 0) {
          observer.next(snapshot)
        }
      }
    })
  }
}

module.exports = create()
module.exports.create = create

