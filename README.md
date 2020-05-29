# Mith

![mith ci](https://github.com/JWebCoder/mith/workflows/mith%20ci/badge.svg)
[![deno doc](https://doc.deno.land/badge.svg)](https://doc.deno.land/https/deno.land/x/mith/mod.ts)

A middleware framework for Deno's http/s server

Highly inspired by the Express middleware system

Differently from Express, the main Mith application is only responsible to handle the middleware system, it has no routes support, and it tries to leave the request and response objects form Deno untouched as much as possible

## Usage

**Basic integration with routing**
```typescript
import Mith from 'https://deno.land/x/mith@v0.1.0/mod.ts'
import Router from 'https://deno.land/x/mith_router@v0.0.1/mod.ts'

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

const app = new Mith()

app.use(router.getRoutes())
app.error(
  (req, res, next) => {
    res.status = res.error?.status || 500
    res.body = res.error?.message || 'Error'
    next()
  }
)

const PORT = Number(env.get('PORT')) || 3000
app.listen({ port: PORT})
console.log('listening on', PORT)
```

Right now I'm still working on the documentation, so you can check the **example** folder for full usage examples

## Available middlewares

- **[mith_router](https://github.com/JWebCoder/mith_router)** - router middleware
- **cookieSession.ts** - session middleware using cookies
- **static.ts** - static file server (WIP)

**Note:** These middlewares will eventually move to their own repositories to split responsibilities and improve maintenance

[//]: # (For Routing, session, or any other middleware you can check our awesome-mith site of community resources.)

## Middleware parameters

### Request
The request contains information about the request received.

#### properties:
- **body**
Parses the body of the request and returns it in json format
- **serverRequest**
The original Deno server request

### Response
The response contains information about the response that will be sent back to the requestor.

#### properties:
- **error**
Contains the error sent when calling next(error)
- **body**
The body of the response
- **headers**
A Headers instance which contains the headers for the response
- **finished**
A boolean indicating that the response is completed
- **sent**
A boolean indicating that the response has been already sent to the requestor
- **send**
Sends the response to the requestor
- **redirect**
Redirects the user to another location

### Next
A function that triggers the next middleware in line.

**Triggers the next middleware**
```typescript
next()
```

**Jumps to the error middleware stack**
```typescript
next([someinput])
```

On the error middleware stack calling next([someinput]) has no effect because connection is already on the error stack