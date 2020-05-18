import { serve, ServerRequest, Response as DenoResponse, Server, HTTPOptions } from "https://deno.land/std@0.51.0/http/server.ts";

export type NextFunction = (err?: any) => void

export type Middleware = (request: ServerRequest, response: Response, next: NextFunction) => void 

export interface Response extends DenoResponse {
  error?: any
  body: any
  headers: Headers
  finished: boolean
  sendResponse: boolean
  sent: boolean
  send: () => void
  end: () => void
}

export default class Mith {
  private middlewareArray: Middleware[] = []
  private PORT = 8000
  private server?: Server
  public use(middleware: Middleware) {
    this.middlewareArray.push(middleware)
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
   *
   */

  public close() {
    this.server?.close()
  }

  /**
   * Listens to the async iterable server instance for incoming requests
   * Runs the stack of middleware for each request
   *
   */
  private async setupListener() {
    if (this.server) {
      for await (const req of this.server) {
        this.runMiddleware(req, this.buildResponse(req))
      }
    }
  }


  private runMiddleware(request: ServerRequest, response: Response) {
    this.dispatch(request, response, 0)
  }

  private dispatch (request: ServerRequest, response: Response, index: number): void {
    this.middlewareArray[index](
      request,
      response,
      (error?: any): void => {
        if (response.finished) {
          return
        }
        if (error) {
          response.error = error
          this.dispatch(request, response, this.middlewareArray.length - 1)
        } else if (index + 1 < this.middlewareArray.length) {
          this.dispatch(request, response, index + 1)
        }
      }
    )
  }

  private async sendResponse(request: ServerRequest, response: Response) {
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

  private buildResponse(req: ServerRequest): Response {
    const newResponse = {
      body: {},
      headers: new Headers(),
      sendResponse: false,
      finished: false,
      sent: false,
      send: async () => {
        await this.sendResponse(req, newResponse)
      },
      end: () => {
        newResponse.finished = true
      }
    }
    return  newResponse
  }
}