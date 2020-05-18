import { debug, Mith, cookieSession, serveStatic, resolve } from './deps.ts'
import rootRouter from './routes/root.ts'

const { env } = Deno
const logger = debug('*')

const app = new Mith()

app.use(cookieSession({
  secret:'stuff'
}))
app.use(serveStatic(resolve(Deno.cwd(), 'static'), {
  maxage: 120
}))
app.use(rootRouter.getRoutes())
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

const PORT = Number(env.get('PORT')) || 8000

app.listen({ port: PORT})
logger('listening on %s', PORT)

export default app