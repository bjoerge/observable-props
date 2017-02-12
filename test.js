const test = require('tap').test

const Observable = require('rxjs').Observable
const props = require('./')

test('one-off observable', t => {
  const object = {
    foo: 'bar',
    observable: Observable.of('OK')
  }

  props(object)
    .subscribe({
      next (snapshot) {
        t.same(snapshot, {
          foo: 'bar',
          observable: 'OK'
        })
      },
      complete () {
        t.end()
      }
    })
})

test('delayed observable', t => {
  const object = {
    foo: 'bar',
    observable: Observable.timer(100).map(() => 'OK')
  }

  props(object)
    .subscribe({
      next (snapshot) {
        t.same(snapshot, {
          foo: 'bar',
          observable: 'OK'
        })
      },
      complete () {
        t.end()
      }
    })
})

test('multiple values over time', t => {
  const object = {
    foo: 'bar',
    observable: Observable.interval(10).map(i => `OK ${i}`)
  }

  const values = []
  const subscription = props(object)
    .subscribe({
      next (snapshot) {
        values.push(snapshot)
      },
      complete () {
        t.fail('Did not expect observable to complete')
      }
    })

  setTimeout(() => {
    subscription.unsubscribe()
    t.ok(values.length > 10)
    t.same(values[0], {foo: 'bar', observable: 'OK 0'})
    t.same(values[1], {foo: 'bar', observable: 'OK 1'})
    t.same(values[2], {foo: 'bar', observable: 'OK 2'})
    t.end()
  }, 200)
})
