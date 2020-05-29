import { Mith, NextFunction, Request, Response } from './mod.ts'

const app = new Mith()

app.use(async (req: Request, res: Response, next: NextFunction) => {
  const body = await req.body()
  switch (body.type) {
    case 'error':
      return next(new Error('error'))
    case 'redirect':
      res.redirect('/')
      break
    case 'urlencoded':
    case 'json':
      res.body.test = body.type
      break
    default:
      res.body.test = body
  }

  next()
})
app.error(
  (req: Request, res: Response, next: NextFunction) => {
    res.status = res.error.status || 500
    res.body = res.error.message
    next()
  }
)

export default app