import { Middleware, Response, NextFunction } from "https://raw.githubusercontent.com/JWebCoder/mith/master/mod.ts";
import { ServerRequest } from "https://deno.land/std@0.51.0/http/server.ts";
import { match, MatchFunction } from 'https://raw.githubusercontent.com/pillarjs/path-to-regexp/master/src/index.ts'
import { getStatePath, setStatePath, deleteStatePath } from './routerState.ts'

declare module "https://deno.land/std@0.51.0/http/server.ts" {
    interface ServerRequest {
      params: Object
    }
}


interface RouterMiddleware extends Middleware {
  isRouter: boolean
}

type methods = 'GET' | 'POST' | 'DELETE' | 'PATCH'

export default class Router {
  private paths: {
    [key in methods]: {
      [key: string]: {
        middleware: Middleware | RouterMiddleware,
        isRouter: boolean,
        matcher: MatchFunction
      }
    }
  } = {
    GET: {},
    POST: {},
    DELETE: {},
    PATCH: {},
  }

  private savedPaths: {
    [key in methods]: string[]
  } = {
    GET: [],
    POST: [],
    DELETE: [],
    PATCH: [],
  }

  use(method: methods, path: string, middleware: Middleware | RouterMiddleware) {
    const isRouter = (middleware as RouterMiddleware).isRouter
    this.paths[method][path] = {
      middleware,
      isRouter,
      matcher: match(path, { end: !(middleware as RouterMiddleware).isRouter })
    }
    this.savedPaths[method] = Object.keys(this.paths[method])
  }

  getRoutes(): RouterMiddleware {
    const router: RouterMiddleware = (req: ServerRequest, res: Response, next: NextFunction) => {
      let matchedRoute = false
      res.noMatch = true
      const connectionId = req.conn.rid
      const statePath = getStatePath(req.conn.rid)
      for (const savedPath of this.savedPaths[req.method as methods]) {
        const route = this.paths[req.method as methods][savedPath]
        
        const matched = route.matcher(req.url.replace(statePath, ''))
        if (matched) {
          res.noMatch = false
          matchedRoute = true
          req.params = {
            ...req.params,
            ...matched.params
          }
          if (route.isRouter) {
            if (matched.path !== '/') {
              setStatePath(connectionId, matched.path)
            }
          } else {
            deleteStatePath(connectionId)
          }
          route.middleware(req, res, next)
          return
        }
      }
      if (!matchedRoute) {
        deleteStatePath(connectionId)
        next()
      }
    }

    router.isRouter = true
    return router
  }
}