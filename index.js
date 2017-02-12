'use strict'
const isObservable = require('is-observable')

function create (ObservableImpl) {
  function ObservableOf (value) {
    return new ObservableImpl(observer => {
      observer.next(value)
      observer.complete()
    })
  }

  function toObservable (value) {
    return isObservable(value) ? value : ObservableOf(value)
  }

  return function props (object) {
    ObservableImpl = (ObservableImpl || require('any-observable'))

    return new ObservableImpl(observer => {
      let snapshot = {}
      const keys = Object.keys(object)
      let pendingInitial = keys.slice()
      let active = keys.slice()

      const subscriptions = keys.map(key =>
        toObservable(object[key])
          .subscribe({
            next (value) {
              update(key, value)
            },
            error (err) {
              observer.error(err)
            },
            complete () {
              active.splice(active.indexOf(key), 1)
              if (active.length === 0) {
                observer.complete()
              }
            }
          })
      )

      function update (key, value) {
        if (pendingInitial) {
          pendingInitial.splice(pendingInitial.indexOf(key), 1)
        }
        snapshot = Object.assign({}, snapshot, {[key]: value})
        if (pendingInitial.length === 0) {
          observer.next(snapshot)
        }
      }

      return () => subscriptions.forEach(sub => sub.unsubscribe())
    })
  }
}

module.exports = create()
module.exports.create = create

