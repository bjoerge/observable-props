# `observable-props`

## Install
```
npm i -S observable-props
```

## Usage example

```js
import {Observable} from 'rxjs'
import props from 'observable-props'

const object = {
  foo: 'bar',
  time: Observable.interval(1000)
}

props(object).subscribe(snapshot => console.log(snapshot))

//=> { foo: 'bar', time: 0 }
//=> { foo: 'bar', time: 1 }
//=> { foo: 'bar', time: 2 }
//=> { foo: 'bar', time: 3 }
//=> ...
```

Note: The returned observable will wait for the first value of every observable found on keys before emitting the first snapshot

# License

MIT
