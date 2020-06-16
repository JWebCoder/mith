import { Mith } from './mod.ts'

const app = new Mith()

app.before(
  async (req, res, next) => {
    res.body.before = true
    next()
  }
)

app.after(
  (req, res, next) => {
    const encoder = new TextEncoder();
    Deno.writeFile('./after.dat', encoder.encode(`${Deno.pid} - ${JSON.stringify(res.body)}\n`), {append: true})
    next()
  }
)

app.use(
  async (req, res, next) => {
    const body = await req.body()
    if (typeof body === 'object') {
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
      }
    } else {
      res.body.test = body
    }
    next()
  }
)

app.error(
  (req, res, next) => {
    res.status = res.error.status || 500
    res.body = res.error.message
    next()
  }
)

export default app