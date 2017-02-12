const isObservable = require('is-observable')

function create(ObservableImpl = require('any-observable')) {

  function ObservableOf(value) {
    return new ObservableImpl(observer => {
      observer.next(value)
      observer.complete()
    })
  }

  function toObservable(value) {
    return isObservable(value) ? value : ObservableOf(value)
  }

  return function props(object) {
    return new ObservableImpl(observer => {
      const snapshot = {}
      const keys = Object.keys(object)
      let pendingKeys = keys.slice()

      const subscriptions = keys.map(key =>
        toObservable(object[key])
          .subscribe(value => {
            update(key, value)
          })
      )

      function update(key, value) {
        if (pendingKeys) {
          pendingKeys.splice(pendingKeys.indexOf(key), 1)
          if (pendingKeys.length === 0) {
            pendingKeys = null
          }
        }
        snapshot[key] = value
        if (!pendingKeys) {
          observer.next(snapshot)
        }
      }

      return () => subscriptions.forEach(sub => sub.unsubscribe())
    })
  }
}

module.exports = create()
module.exports.create = create

