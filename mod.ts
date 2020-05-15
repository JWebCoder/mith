import { serve, ServerRequest, Response as DenoResponse, Server } from "https://deno.land/std@0.51.0/http/server.ts";

export type NextFunction = (err?: any) => void

export type Middleware = (request: ServerRequest, response: Response, next: NextFunction) => void 

export type listenOptions = { port?: number}

export interface Response extends DenoResponse {
  error?: any
  body: any
  headers: Headers
  [key: string]: any
}

export default class Mith {
  private middlewareArray: Middleware[] = []
  private PORT = 8000
  private server?: Server
  public use(middleware: Middleware) {
    this.middlewareArray.push(middleware)
  }
  
  public async listen(options: listenOptions) {
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
        this.runMiddleware(req, this.buildResponse())
      }
    }
  }

  private runMiddleware(request: ServerRequest, response: Response) {
    this.dispatch(request, response, 0)
  }

  private async dispatch (request: ServerRequest, response: Response, index: number): Promise<void> {
    this.middlewareArray[index](
      request,
      response,
      async (error?: any): Promise<void> => {
        if (error) {
          response.error = error
          await this.dispatch(request, response, this.middlewareArray.length - 1)
        } else if (index + 1 < this.middlewareArray.length) {
          await this.dispatch(request, response, index + 1)
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
    request.respond(response).catch((e) => {})
  }

  private buildResponse(): Response {
    return {
      body: {},
      headers: new Headers()
    }
  }
}