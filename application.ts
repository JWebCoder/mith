import { serve, Server, HTTPOptions } from './deps.ts'
import { Request, Response } from './mod.ts'

export type NextFunction = (err?: any) => void

export type Middleware  = (request: Request, response: Response, next: NextFunction) => void

type MiddlewareStacks =  {
  before: Middleware [],
  after: Middleware [],
  main: Middleware [],
  error: Middleware [],
}
type Stacks = 'before' | 'after' | 'main' | 'error'
/**
 * A class which registers middleware (via `.use()`) and then processes
 * inbound requests against that middleware (via `.listen()`).
 */
export class Mith {
  private middlewareStacks: MiddlewareStacks = {
    before: [],
    after: [],
    main: [],
    error: []
  }
  private PORT = 8000
  public server?: Server

  /**
   * Register middleware on the before stack.
   * @param Middleware can be a single one or an array
   * @return void
  */
  public before(middleware: Middleware | Middleware[]) {
    this.use(middleware, 'before')
  }

  /**
     * Register middleware on the after stack.
     * @param Middleware can be a single one or an array
     * @return void
    */
  public after(middleware: Middleware | Middleware[]) {
    this.use(middleware, 'after')
  }

  /**
   * Register middleware on the main stack.
   * @param Middleware can be a single one or an array
   * @return void
  */
  public main(middleware: Middleware | Middleware[]) {
    this.use(middleware, 'main')
  }

  /**
   * Register middleware to be used when next(error) is called.
   * @param Middleware can be a single one or an array
   * @return void
  */
  public error(middleware: Middleware | Middleware[]) {
    this.use(middleware, 'error')
  }

  /**
   * Register middleware to be used with the application.
   * @param Middleware can be a single one or an array
   * @return void
  */
  public use(middleware: Middleware | Middleware[], stack: Stacks = 'main') {
    if (Array.isArray(middleware)) {
      this.getMiddlewareArray(stack).push(...middleware)
    } else {
      this.getMiddlewareArray(stack).push(middleware)
    }
  }

  /**
   * Create an HTTP server with given options
   *
   *  const options = {
   *    hostname: "localhost",
   *    port: 8000,
   *  }
   * 
   *  mith.listen(options)
   *
   * @param options Server configuration
   * @return void
   */
  public listen(options: string | HTTPOptions = { port: this.PORT }) {
    this.server = serve(options)
    return this.setupListener()
  }

  /**
   * Closes the ongoing server
   *
   *  mith.close()
   */

  public async close() {
    this.server?.close()
  }

  /**
   * Listens to the async iterable server instance for incoming requests
   * Runs the stack of middleware for each request
   */
  private async setupListener() {
    if (this.server) {
      for await (const req of this.server) {
        this.dispatch(new Request(req), new Response(req), 'before')
      }
    }
  }

  /**
   * Dispatch function will trigger the middleware in sequence based on the current stack
   *
   * @param request Deno Server Request Object
   * @param response Mith Server Response Object
   * @param stack indentifies the current middleware stack
   * @param index number
   * @param next function can be passed to cicle between Mith apps
   * @return void
   */
  public async dispatch (request: Request, response: Response, stack: Stacks, index: number = 0, next?: NextFunction, error?: any): Promise<void> {
    let nextCalled = false
    let middleWare = this.getMiddlewareArray(stack)
    if (!middleWare.length) {
      if (stack === 'after') {
        if (next && error) {
          next(error)
        }
        return
      }
      this.dispatch(request, response, this.nextStack(stack), 0, next, error)
      return
    }
    await middleWare[index](
      request,
      response,
      (error?: any): void => {
        nextCalled = true
        this.nextMiddleware(request, response, stack, index, next, error)
      }
    )
    if (!nextCalled) {
      this.nextMiddleware(request, response, stack, index, next, error)
    }
  }

  private getMiddlewareArray(stack: Stacks) {
    return this.middlewareStacks[stack]
  }

  /**
   * nextMiddleware function will trigger the next middleware in line
   * In case an error is passed it moves to the error middleware stack
   *
   * @param request Deno Server Request Object
   * @param response Mith Server Response Object
   * @param stack indentifies the current middleware stack
   * @param index number
   * @param next function can be passed to cicle between Mith apps
   * @param error received from a callback
   * @return void
   */
  private nextMiddleware(request: Request, response: Response, stack: Stacks, index: number, next?: NextFunction, error?: any) {
    if (response.finished) {
      return this.stackSendOrNext(request, response, stack, next, error)
    }
    if (error) {
      response.error = error
      if (this.getMiddlewareArray('error').length) {
        if (stack === 'error') {
          if (index + 1 < this.getMiddlewareArray('error').length) {
            return this.dispatch(request, response, stack, index + 1, next, error)
          }
        } else {
          return this.dispatch(request, response, 'error', 0, next, error)
        }
      }
    } else if (index + 1 < this.getMiddlewareArray(stack).length) {
      return this.dispatch(request, response, stack, index + 1, next)
    }

    return this.stackSendOrNext(request, response, stack, next, error)
  }

  /**
   * Returns the next stack in line before > main > after || error > after
   * @param stack current stack of the request
   */
  private nextStack(stack: Stacks) {
    if (stack === 'before') {
      return 'main'
    }
    return 'after'
  }

  /**
   * Calls sendResponse in case Mith server is already setup
   * Calls the next function in case this is a sub application
   * Stops execution otherwise
   *
   * @param request Deno Server Request Object
   * @param response Mith Server Response Object
   * @param stack on going middleware stack
   * @param next function can be passed to cicle between Mith apps
   * @param error in case of error, use it has the response body
   * @return void
   */
  private stackSendOrNext(req: Request, res: Response,  stack: Stacks, next?: NextFunction, error?: any) {
    if (stack === 'before') {
      this.dispatch(req, res, error ? 'error' : this.nextStack(stack), 0, next, error)
    } else if (stack === 'main' || stack === 'error') {
      if (this.server) {
        if (error) {
          res.body = error
        }
        res.sendResponse()
      }
      this.dispatch(req, res, error && stack !== 'error' ? 'error' : this.nextStack(stack), 0, next, error)
    } else if (next) {
      next(error)
    }
    return
  }
}