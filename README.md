# mith

A middleware framework for Deno's http/s server

Highly inspired by the Express middleware system

Differently from Express, the main Mith application is only responsible to handle the middleware system, it has no routes support, and it tries to leave the request and response objects form Deno untouched as much as possible

## Usage

**Basic integration with routing**
```typescript
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
```

Right now I'm still working on the documentation, so you can check the **example** folder for full usage examples

## Available middlewares

- **router.ts** - router middleware
- **cookieSession.ts** - session middleware using cookies (WIP)
- **cookieSession.ts** - session middleware using cookies (WIP)

**Note:** These middlewares will eventually move to their own repositories to split responsibilities and improve maintenance

[//]: # (For Routing, session, or any other middleware you can check our awesome-mith site of community resources.)
