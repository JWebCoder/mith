import Mith from 'https://raw.githubusercontent.com/JWebCoder/mith/master/mod.ts'
import Router from 'https://raw.githubusercontent.com/JWebCoder/mith/master/router.ts'

const { env } = Deno

const router = new Router()

router.use(
  'GET',
  '/',
  (req, res, next) => {
    res.body.text = 'something'
    next()
  }
)

const app = new Mith();

app.use(router.getRoutes())

const PORT = Number(env.get('PORT')) || 3000
app.listen({ port: PORT})
console.log('listening on', PORT)