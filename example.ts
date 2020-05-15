import { debug } from './deps.ts'
import Mith from './mod.ts'
import Router from './router.ts'
import { cookieSession, cookieSessionSave } from './cookieSession.ts'
const { env } = Deno
const logger = debug('*')

const router = new Router()
const innerRouter = new Router()
const deepRouter = new Router()

innerRouter.use('GET', '/data', (req, res, next) => {
  console.log('test')
  res.body.test = '/data'
  res.body.params = req.params
  next()
})

innerRouter.use('GET', '/test/:name', deepRouter.getRoutes())

deepRouter.use(
  'GET',
  '/test/:age',
  (req, res, next) => {
    res.body.test = '/test/:name/test/:age'
    res.body.params = req.params
    next()
  }  
)

deepRouter.use(
  'GET',
  '/test',
  (req, res, next) => {
    res.body.test = '/test/:name/test'
    res.body.params = req.params
    next()
  }  
)

router.use(
  'GET',
  '/testname/:name',
  (req, res, next) => {
    res.body.test = '/testname/:name'
    res.body.params = req.params
    next()
  }
)

router.use(
  'GET',
  '/test',
  (req, res, next) => {
    res.body.test = '/test'
    res.body.params = req.params
    next()
  }
)

router.use(
  'GET',
  '/tests',
  (req, res, next) => {
    res.body.test = '/tests'
    res.body.params = req.params
    next()
  }
)

router.use(
  'GET',
  '/error',
  (req, res, next) => {
    next({message: 'this is an error', status: 402})
  }
)

router.use(
  'GET',
  '/session',
  (req, res, next) => {
    if (!req.session.test && req.session.test !== 0) {
      req.session.test = -1
    }
    req.session.test += 1
    res.body.test = req.session
    next()
  }
)

router.use(
  'GET',
  '/close',
  (req, res, next) => {
    app.close()
    res.body = 'closed'
    next()
  }
)

router.use(
  'GET',
  '/',
  innerRouter.getRoutes()
)

const app = new Mith();

app.use(cookieSession({
  secret:'stuff'
}))
app.use(router.getRoutes())
app.use(
  (req, res, next) => {
    if (res.error) {
      res.status = res.error.status || 500
      res.body = res.error.message
    } else if (res.noMatch) {
      res.status = 404
      res.body = 'Not Found'
    }
    next()
  }
)
app.use(cookieSessionSave())

const PORT = Number(env.get('PORT')) || 8000

await app.listen({ port: PORT})
logger('listening on %s', PORT)




