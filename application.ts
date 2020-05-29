import { serve, Server, HTTPOptions } from './deps.ts'
import { Request, Response } from './mod.ts'

export type NextFunction = (err?: any) => void

export type Middleware  = (request: Request | any, response: Response | any, next: NextFunction) => void

/**
 * A class which registers middleware (via `.use()`) and then processes
 * inbound requests against that middleware (via `.listen()`).
 */
export class Mith {
  private middlewareArray: Middleware[] = []
  private errorMiddlewareArray: Middleware[] = []
  private PORT = 8000
  public server?: Server

  /**
   * Register middleware to be used with the application.
   * @param Middleware can be a single one or an array
   * @return void
  */
  public use(middleware: Middleware | Middleware[]) {
    if (Array.isArray(middleware)) {
      this.middlewareArray.push(...middleware)
    } else {
      this.middlewareArray.push(middleware)
    }
  }

  /**
   * Register middleware to be used when next(error) is called.
   * @param Middleware can be a single one or an array
   * @return void
  */
  public error(middleware: Middleware | Middleware[]) {
    if (Array.isArray(middleware)) {
      this.errorMiddlewareArray.push(...middleware)
    } else {
      this.errorMiddlewareArray.push(middleware)
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
        this.dispatch(new Request(req), new Response(req), 'main')
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
  public async dispatch (request: Request, response: Response, stack: string, index: number = 0, next?: NextFunction): Promise<void> {
    let nextCalled = false
    let middleWare = this.getMiddlewareArray(stack)
    
    await middleWare[index](
      request,
      response,
      (error?: any): void => {
        nextCalled = true
        this.nextMiddleware(request, response, stack, index, next, error)
      }
    )
    if (!nextCalled) {
      this.nextMiddleware(request, response, stack, index, next)
    }
  }

  private getMiddlewareArray(stack: string) {
    switch (stack) {
      case 'error':
        return this.errorMiddlewareArray
    }
    return this.middlewareArray
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
  private nextMiddleware(request: Request, response: Response, stack: string, index: number, next?: NextFunction, error?: any) {
    if (response.finished) {
      return this.sendOrNext(request, response, next, error)
    }
    if (error) {
      response.error = error
      if (this.errorMiddlewareArray.length) {
        if (stack === 'error') {
          if (index + 1 < this.middlewareArray.length) {
            return this.dispatch(request, response, stack, index + 1)
          }
        } else {
          return this.dispatch(request, response, 'error', stack !== 'error' ? 0 : index)
        }
      }
    } else if (index + 1 < this.middlewareArray.length) {
      return this.dispatch(request, response, stack, index + 1)
    }

    return this.sendOrNext(request, response, next, error)
  }

  /**
   * Calls sendResponse in case Mith server is already setup
   * Calls the next function in case this is a sub application
   * Stops execution otherwise
   *
   * @param request Deno Server Request Object
   * @param response Mith Server Response Object
   * @param next function can be passed to cicle between Mith apps
   * @param error in case of error, use it has the response body
   * @return void
   */
  private sendOrNext(req: Request, res: Response, next?: NextFunction, error?: any) {
    if (this.server) {
      if (error) {
        res.body = error
      }
      return res.sendResponse()
    } else if (next) {
      return next(error)
    }
    console.log('Request finished but no next middleware defined')
    return
  }
}