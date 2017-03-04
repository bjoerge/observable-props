'use strict'
var isObservable = require('is-observable')
var xtend = require('xtend')

// immutable omit keys from object
function omit(ob, keys) {
  return Object.keys(ob).reduce(function (result, key) {
    if (keys.includes(key)) {
      return result
    }
    result[key] = ob[key]
    return result
  }, {})
}

// mutable remove from array
function remove(array, item) {
  var idx = array.indexOf(item)
  if (idx === -1) {
    return array
  }
  array.splice(idx, 1)
  return array
}

function configure (options) {
  var ObservableImpl = (typeof options === 'function') ? options : (options || {}).Observable

  return function props (object) {
    ObservableImpl = (ObservableImpl || require('any-observable'))
    return new ObservableImpl(function (observer) {

      var observableKeys = Object.keys(object).filter(function (key) {
        return isObservable(object[key])
      })

      if (observableKeys.length === 0) {
        // fast path, just pass the given object through
        observer.next(object)
        observer.complete()
        return
      }

      // the current snapshot
      var snapshot = omit(object, observableKeys)

      // keep track of subscriptions by key so we can unsubscribe them later
      var subscriptionsByKey = {}
      // keys that has not yet received any value
      var pendingInitialKeys = observableKeys.slice()
      // keys currently open, i.e. not completed
      var openKeys = observableKeys.slice()

      observableKeys.forEach(subscribeKey)

      return function unsubscribeAll () {
        return openKeys.forEach(unsubscribeKey)
      }

      function subscribeKey (key) {
        var didCompleteSync = false
        var subscription = object[key].subscribe({
          next: onKeyUpdate,
          error: onKeyError,
          complete: onKeyComplete
        })

        if (!didCompleteSync) {
          subscriptionsByKey[key] = subscription
        }

        function onKeyComplete () {
          didCompleteSync = true
          completeKey(key)
        }

        function onKeyUpdate (value) {
          updateKey(key, value)
        }

        function onKeyError (error) {
          observer.error(error)
        }
      }

      function unsubscribeKey (key) {
        subscriptionsByKey[key].unsubscribe()
        subscriptionsByKey[key] = null
      }

      function completeKey (key) {
        remove(openKeys, key)
        if (openKeys.length === 0) {
          observer.complete()
        }
      }

      function updateKey (key, next) {
        var nextSnapshot = xtend(snapshot)
        nextSnapshot[key] = next
        snapshot = nextSnapshot
        remove(pendingInitialKeys, key)
        if (pendingInitialKeys.length === 0) {
          observer.next(snapshot)
        }
      }
    })
  }
}

module.exports = configure()
module.exports.configure = configure

// todo: remove in next major
var warned = false
function warn() {
  if (!warned) {
    console.warn('observable-props\'s create() is renamed to configure() and will be removed in next major release')
    warned = true
  }
}
module.exports.create = function () {
  warn()
  return configure.apply(this, arguments)
}
