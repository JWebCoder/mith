import { Mith, NextFunction, Request, Response } from './mod.ts'

const app = new Mith()

app.before(
  async (req: Request, res: Response, next: NextFunction) => {
    res.body.before = true
    next()
  }
)

app.after(
  (req: Request, res: Response, next: NextFunction) => {
    const encoder = new TextEncoder();
    Deno.writeFile('./after.dat', encoder.encode(`${Deno.pid} - ${JSON.stringify(res.body)}\n`), {append: true})
    next()
  }
)

app.use(
  async (req: Request, res: Response, next: NextFunction) => {
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
  }
)

app.error(
  (req: Request, res: Response, next: NextFunction) => {
    res.status = res.error.status || 500
    res.body = res.error.message
    next()
  }
)

export default app