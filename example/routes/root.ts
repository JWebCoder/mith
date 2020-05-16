import { Router } from '../deps.ts'
import innerRouter from './inner.ts'
import app from '../example.ts'
import userController from '../controllers/users.ts'

const router = new Router()

router.use(
  'GET',
  '/user/:id',
  (req, res, next) => {

    res.body = userController.getUserById(req.params.id)
    next()
  }
)

router.use(
  'GET',
  '/users',
  (req, res, next) => {
    res.body = userController.getUsers()
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
  '/test1',
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
  '/test2',
  (req, res, next) => {
    req.session.test = {
      stuff: 1
    }
    res.body.test = 'tested'
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

export default router