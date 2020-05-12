import debug from 'https://deno.land/x/debuglog/debug.ts'
import { serve, ServerRequest, Response as DenoResponse } from "https://deno.land/std/http/server.ts";

const { env } = Deno
const logger = debug('*')

type NextFunction = (err?: any) => void

type middleware = (request: ServerRequest, response: Response, next: NextFunction) => void 

export type listenOptions = { port?: number}

export interface Response extends DenoResponse {
  body?: any
  headers: Headers
}


export default class Mith {
  
  private middlewareArray: middleware[] = []
  private PORT = 8000
  
  public use(middleware: middleware) {
    this.middlewareArray.push(middleware)
  }
  

  public async listen(options: listenOptions) {
    const server = serve({ port: options.port || this.PORT });
    for await (const req of server) {
      this.runMiddleware(req, this.buildResponse())
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
    request.respond(response)
  }

  private buildResponse(): Response {
    return {
      headers: new Headers()
    }
  }
}

const app = new Mith();
app.use(
  (req, res, next) => {
    res.body = {
      test: 'hello'
    }
    next()
  }
)
app.use(
  (req, res, next) => {
    res.body.testing = 'world'
    next()
  }
)

const PORT = Number(env.get('PORT')) || 8000

logger('listening on %s', PORT)
await app.listen({ port: PORT})
