import {
  debug,
  Mith,
  cookieSession,
  serveStatic,
  resolve,
  mithCors,
  Request,
  Response,
  NextFunction
} from './deps.ts'
import rootRouter from './routes/root.ts'

const { env } = Deno
const logger = debug('*')

const app = new Mith()

app.before(cookieSession({
  secret:'stuff'
}))
app.before(mithCors()); // Enable CORS for All Routes
app.use(serveStatic(resolve(Deno.cwd(), 'static'), '/static', {
  maxage: 120,
}))
app.use(rootRouter.getRoutes())
app.use((req: Request, res: Response, next: NextFunction) => {
  if (!req.requestHandled) {
    next({status: 404, message:'not found'})
  }
})
app.error(
  (req: Request, res: Response, next: NextFunction) => {
    if (res.error) {
      res.status = res.error.status || 500
      res.body = res.error.message
    }
    next()
  }
)

const PORT = Number(env.get('PORT')) || 8000

export default app