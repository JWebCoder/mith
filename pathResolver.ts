import { match } from 'https://raw.githubusercontent.com/pillarjs/path-to-regexp/master/src/index.ts'

const keys: any[] = []
const test = match('/:a*')

console.log(keys)
console.log(test('/test/joao/stuff'))
console.log(test('/test/joao/stuffs'))
console.log(test('/tests/joao/stuff'))