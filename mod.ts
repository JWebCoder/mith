import { serve, ServerRequest, Response as DenoResponse, Server } from "https://deno.land/std@0.51.0/http/server.ts";

export type NextFunction = (err?: any) => void

export type Middleware = (request: ServerRequest, response: Response, next: NextFunction) => void 

export type listenOptions = { port?: number}

export interface Response extends DenoResponse {
  error?: any
  body: any
  headers: Headers
  finished: boolean
  [key: string]: any
}

export default class Mith {
  private middlewareArray: Middleware[] = []
  private PORT = 8000
  private server?: Server
  public use(middleware: Middleware) {
    this.middlewareArray.push(middleware)
  }
  
  public listen(options: listenOptions) {
    this.server = serve({ port: options.port || this.PORT });
    this.setupListener()
    return 
  }

  public close() {
    this.server?.close()
  }

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
          return this.sendResponse(request, response)
        }
        if (error) {
          response.error = error
          this.dispatch(request, response, this.middlewareArray.length - 1)
        } else if (index + 1 < this.middlewareArray.length) {
          this.dispatch(request, response, index + 1)
        } else {
          this.sendResponse(request, response)
        }
      }
    )
  }

  private sendResponse(request: ServerRequest, response: Response) {
    if (typeof response.body === 'object') {
      if (!response.headers.get('content-type')) {
        response.headers.set('content-type', 'application/json')
      }
      response.body = JSON.stringify(response.body)
    }
    request.respond(response).catch((e) => {console.log(e)})
  }

  private buildResponse(req: ServerRequest): Response {
    const newResponse = {
      body: {},
      headers: new Headers(),
      finished: false,
      send: () => {
        newResponse.finished = true
      }
    }
    return  newResponse
  }
}