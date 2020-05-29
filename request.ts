import { ServerRequest } from "https://deno.land/std@0.53.0/http/server.ts"
import { bodyParser } from './bodyParser.ts'

export interface IRequest {
  body: () => any
  serverRequest: ServerRequest
}

export class Request implements IRequest{
  serverRequest: ServerRequest
  [key: string]: any
  private parsedBody: any = undefined

  constructor(req: ServerRequest) {
    this.serverRequest = req
  }

  async body() {
    if (this.parsedBody) {
      return this.parsedBody
    }
    if (!this.hasBody()) {
      return undefined
    }
    this.parsedBody = await bodyParser(this.serverRequest)
    return this.parsedBody
  }

  hasBody(): boolean {
    return (
      this.serverRequest.headers.get("transfer-encoding") !== null ||
      !!parseInt(this.serverRequest.headers.get("content-length") ?? "")
    );
  }
}