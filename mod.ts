import { serve, ServerRequest, Response as DenoResponse, Server, HTTPOptions } from "https://deno.land/std@0.51.0/http/server.ts";

export type NextFunction = (err?: any) => void

export type Middleware = (request: Request, response: Response, next: NextFunction) => void 

export interface Request extends ServerRequest {}

export interface Response extends DenoResponse {
  error?: any
  body: any
  headers: Headers
  finished: boolean
  sendResponse: boolean
  sent: boolean
  send: () => void
}

/**
 * A class which registers middleware (via `.use()`) and then processes
 * inbound requests against that middleware (via `.listen()`).
 */
export class Mith {
  private middlewareArray: Middleware[] = []
  private errorHandlerArray: Middleware[] = []
  private PORT = 8000
  private server?: Server
  private middlewareLastIndex: number = -1
  private errorHandlerLastIndex: number = -1

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
    this.middlewareLastIndex = this.middlewareArray.length - 1
  }

  /**
   * Register middleware to be used when next(error) is called.
   * @param Middleware can be a single one or an array
   * @return void
  */
  public error(middleware: Middleware | Middleware[]) {
    if (Array.isArray(middleware)) {
      this.errorHandlerArray.push(...middleware)
    } else {
      this.errorHandlerArray.push(middleware)
    }
    this.errorHandlerLastIndex = this.errorHandlerArray.length - 1
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
    this.setupListener()
    return 
  }

  /**
   * Closes the ongoing server
   *
   *  mith.close()
   */

  public close() {
    this.server?.close()
  }

  /**
   * Listens to the async iterable server instance for incoming requests
   * Runs the stack of middleware for each request
   */
  private async setupListener() {
    if (this.server) {
      for await (const req of this.server) {
        this.dispatch(req, this.buildResponse(req), 0)
      }
    }
  }

  public async dispatchError(request: Request, response: Response, index: number, next?: NextFunction) {
    let nextCalled = false
    await this.errorHandlerArray[index](
      request,
      response,
      (): void => {
        nextCalled = true
        this.nextErrorMiddleware(request, response, index, next)
      }
    )
    if (!nextCalled) {
      this.nextErrorMiddleware(request, response, index, next)
    }
  }

  /**
   * Dispatch function will trigger the middleware in sequence
   * In case a callback is called with an error
   * the last middleware in the stack is called
   *
   * @param request Deno Server Request Object
   * @param response Mith Server Response Object
   * @param index number
   * @return void
   */
  public async dispatch (request: Request, response: Response, index: number, next?: NextFunction): Promise<void> {
    let nextCalled = false
    await this.middlewareArray[index](
      request,
      response,
      (error?: any): void => {
        nextCalled = true
        this.nextMiddleware(request, response, index, next, error)
      }
    )
    if (!nextCalled) {
      this.nextMiddleware(request, response, index, next)
    }
  }

  private nextMiddleware(request: Request, response: Response, index: number, next?: NextFunction, error?: any) {
    if (response.finished) {
      return this.sendOrNext(request, response, next)
    }
    if (error) {
      response.error = error
      if (this.errorHandlerArray.length !== 0) {
        return this.dispatchError(request, response, 0)
      }
      return this.sendOrNext(request, response, next, error)
      
    } else if (index + 1 < this.middlewareArray.length) {
      this.dispatch(request, response, index + 1)
    } else {
      return this.sendOrNext(request, response, next)
    }
  }

  private nextErrorMiddleware(request: Request, response: Response, index: number, next?: NextFunction) {
    if (response.finished) {
      return this.sendOrNext(request, response, next)
    }
    if (index + 1 < this.errorHandlerArray.length) {
      this.dispatch(request, response, index + 1)
    } else {
      return this.sendOrNext(request, response, next)
    }
  }

  private sendOrNext(req: Request, res: Response, next?: NextFunction, error?: any) {
    if (this.server) {
      return this.sendResponse(req, res)
    } else if (next) {
      return next(error)
    }
    console.log('Request finished but no next middleware defined')
    return
  }

  /**
   * Sends the response back to the caller
   *
   * @param request Deno Server Request Object
   * @param response Mith Server Response Object
   * @return void
   */
  private async sendResponse(request: Request, response: Response) {
    if (!response.sent) {
      response.sent = true
      if (typeof response.body === 'object') {
        if (!response.headers.get('content-type')) {
          response.headers.set('content-type', 'application/json')
        }
        response.body = JSON.stringify(response.body)
      }
      await request.respond(response).catch((e) => {console.log(e)})
    }
  }

  /**
   * Generates the inicial Mith Response Object
   *
   * @param request Deno Server Request Object
   * @param response Mith Server Response Object
   * @return void
   */
  private buildResponse(req: Request): Response {
    const newResponse: Response = {
      body: {},
      headers: new Headers(),
      sendResponse: false,
      finished: false,
      sent: false,
      status: 200,
      send: async () => {
        newResponse.finished = true
        return newResponse
      }
    }
    return  newResponse
  }
}