import { serve, ServerRequest, Response as DenoResponse, Server, HTTPOptions } from "https://deno.land/std@0.53.0/http/server.ts";

export interface Request {
  body: any
  serverRequest: ServerRequest
}

export type NextFunction = (err?: any) => void

export type Middleware  = (request: Request | any, response: Response | any, next: NextFunction) => void

export const REDIRECT_BACK = Symbol("redirect backwards")

export interface Response extends DenoResponse {
  error?: any
  body: any
  headers: Headers
  finished: boolean
  sendResponse: boolean
  sent: boolean
  send: () => void
  redirect: (
    url: string | URL | typeof REDIRECT_BACK,
    alt?: string | URL
  ) => void
}

/** Encodes the url preventing double enconding */
export function encodeUrl(url: string) {
  return String(url)
    .replace(UNMATCHED_SURROGATE_PAIR_REGEXP, UNMATCHED_SURROGATE_PAIR_REPLACE)
    .replace(ENCODE_CHARS_REGEXP, encodeURI)
}

const ENCODE_CHARS_REGEXP = /(?:[^\x21\x25\x26-\x3B\x3D\x3F-\x5B\x5D\x5F\x61-\x7A\x7E]|%(?:[^0-9A-Fa-f]|[0-9A-Fa-f][^0-9A-Fa-f]|$))+/g

const UNMATCHED_SURROGATE_PAIR_REGEXP = /(^|[^\uD800-\uDBFF])[\uDC00-\uDFFF]|[\uD800-\uDBFF]([^\uDC00-\uDFFF]|$)/g;

const UNMATCHED_SURROGATE_PAIR_REPLACE = "$1\uFFFD$2";

/**
 * A class which registers middleware (via `.use()`) and then processes
 * inbound requests against that middleware (via `.listen()`).
 */
export class Mith {
  private middlewareArray: Middleware[] = []
  private errorHandlerArray: Middleware[] = []
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
      this.errorHandlerArray.push(...middleware)
    } else {
      this.errorHandlerArray.push(middleware)
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
        this.dispatch(await this.buildRequest(req), this.buildResponse(req), 0)
      }
    }
  }

  /**
   * dispatchError function will trigger the error middleware in sequence
   *
   * @param request Deno Server Request Object
   * @param response Mith Server Response Object
   * @param index number
   * @param next function can be passed to cicle between Mith apps
   * @return void
   */
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
   * @param next function can be passed to cicle between Mith apps
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

  /**
   * nextMiddleware function will trigger the next middleware in line
   * In case an error is passed it moves to the error middleware stack
   *
   * @param request Deno Server Request Object
   * @param response Mith Server Response Object
   * @param index number
   * @param next function can be passed to cicle between Mith apps
   * @param error received from a callback
   * @return void
   */
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

  /**
   * nextErrorMiddleware function will trigger the next middleware in line
   *
   * @param request Deno Server Request Object
   * @param response Mith Server Response Object
   * @param index number
   * @param next function can be passed to cicle between Mith apps
   * @return void
   */
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

  /**
   * Calls sendResponse in case Mith server is already setup
   * Calls the next function in case this is a sub application
   * Stops execution otherwise
   *
   * @param request Deno Server Request Object
   * @param response Mith Server Response Object
   * @return void
   */
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
      await request.serverRequest.respond(response).catch((e) => {console.log(e)})
    }
  }

  /**
   * Generates the inicial Mith Response Object
   *
   * @param request Deno Server Request Object
   * @param response Mith Server Response Object
   * @return void
   */
  private async buildRequest(req: ServerRequest): Promise<Request> {
    const newRequest = {
      serverRequest: req,
      body: undefined
    }
    if (req.body) {
      const decoder = new TextDecoder()
      const rawBody = await Deno.readAll(req.body)
      newRequest.body = JSON.parse(decoder.decode(rawBody))
    }
    return newRequest
  }

  /**
   * Generates the inicial Mith Response Object
   *
   * @param request Deno Server Request Object
   * @param response Mith Server Response Object
   * @return void
   */
  private buildResponse(req: ServerRequest): Response {
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
      },
      redirect: (url, alt = "/"): void => {
        if (url === REDIRECT_BACK) {
          url = req.headers.get("Referrer") ?? String(alt);
        } else if (typeof url === "object") {
          url = String(url);
        }
        newResponse.headers.set("Location", encodeUrl(url));
        
        newResponse.status = 302;
        
        newResponse.headers.set('Content-Type', 'text/plain; charset=utf-8')
        newResponse.body = `Redirecting to ${url}.`;
        newResponse.send()
      }
    }
    return  newResponse
  }
}