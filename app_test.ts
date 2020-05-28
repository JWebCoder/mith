import { Mith, Request, Response, NextFunction } from './mod.ts'

const app = new Mith()

app.use(async (req: Request, res: Response, next: NextFunction) => {
  if (req.body.type === 'error') {
    return next(new Error('error'))
  }
  if (req.body.type === 'redirect') {
    res.redirect('/')
  } else {
    res.body.test = 'test'
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