import { Router } from '../deps.ts'
import deepRouter from './deep.ts'
const innerRouter = new Router()

innerRouter.use('GET', '/data', (req, res, next) => {
  console.log('test')
  res.body.test = '/data'
  res.body.params = req.params
  next()
})

innerRouter.use('GET', '/test/:name', deepRouter.getRoutes())

export default innerRouter