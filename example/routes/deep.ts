import { Router } from '../deps.ts'

const deepRouter = new Router()

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

deepRouter.use(
  'GET',
  '/',
  (req, res, next) => {
    res.body.params = req.params
    next()
  }  
)

export default deepRouter