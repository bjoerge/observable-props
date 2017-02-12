const Observable = require('rxjs').Observable
const props = require('.')

const object = {
  foo: 'bar',
  time: Observable.interval(1000)
}

props(object).subscribe(snapshot => console.log(snapshot))
