const {Observable} = require('rxjs')
const props = require('observable-props')

const object = {
  foo: 'bar',
  time: Observable.interval(1000)
}

props(object).subscribe(snapshot => console.log(snapshot))
