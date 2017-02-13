'use strict'
var isObservable = require('is-observable')
var xtend = require('xtend')

function create (ObservableImpl) {
  function ObservableOf (value) {
    return new ObservableImpl(function (observer) {
      observer.next(value)
      observer.complete()
    })
  }

  function toObservable (value) {
    return isObservable(value) ? value : ObservableOf(value)
  }

  return function props (object) {
    ObservableImpl = (ObservableImpl || require('any-observable'))

    return new ObservableImpl(function (observer) {
      var snapshot = {}
      var keys = Object.keys(object)
      var pendingInitial = keys.slice()
      var active = keys.slice()

      var subscriptions = keys.map(function (key) {
        return toObservable(object[key])
          .subscribe({
            next: function (value) {
              update(key, value)
            },
            error: function (err) {
              observer.error(err)
            },
            complete: function () {
              active.splice(active.indexOf(key), 1)
              if (active.length === 0) {
                observer.complete()
              }
            }
          })
      })

      function update (key, value) {
        if (pendingInitial) {
          pendingInitial.splice(pendingInitial.indexOf(key), 1)
        }

        snapshot = xtend(snapshot)
        snapshot[key] = value

        if (pendingInitial.length === 0) {
          observer.next(snapshot)
        }
      }

      return function () {
        subscriptions.forEach(function (subscription) {
          subscription.unsubscribe()
        })
      }
    })
  }
}

module.exports = create()
module.exports.create = create

