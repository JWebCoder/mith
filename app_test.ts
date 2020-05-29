import { Mith, NextFunction } from './mod.ts'
import { Request } from './request.ts'
import { Response } from './response.ts'

const app = new Mith()

app.use(async (req: Request, res: Response, next: NextFunction) => {
  const body = await req.body()
  if (body.type === 'error') {
    return next(new Error('error'))
  } else if (body.type === 'redirect') {
    res.redirect('/')
  } else if (body.type === 'urlencoded') {
    res.body.test = 'urlencoded'
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