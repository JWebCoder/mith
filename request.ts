import { ServerRequest } from "./deps.ts"
import { bodyParser, Body, queryParser } from './bodyParser.ts'

export interface IRequest {
  body: () => Promise<Body | undefined>
  query: () => Promise<URLSearchParams | undefined>
  serverRequest: ServerRequest
  [key: string]: any
}

/**
 * This class represents the request object from Mith framework
 */
export class Request implements IRequest{
  serverRequest: ServerRequest
  [key: string]: any
  private hasBody: boolean
  private hasQuery: boolean
  private parsedBody: Body | undefined = undefined
  private parsedQuery: URLSearchParams | undefined = undefined

  constructor(req: ServerRequest) {
    this.serverRequest = req
    this.hasBody = req.headers.get("transfer-encoding") !== null ||
    !!parseInt(req.headers.get("content-length") ?? "")
    this.hasQuery = req.url.indexOf('?') >= 0
  }

  /**
   * Returns the body of a request in a JSON format
   * If the body has not been parsed yet, it will run the body parser
   * and then return the parsed body
   * Performance Note:
   *  It only parses the body if the application requests it
   *  and only if there is a body to be parsed
   * @return Promise<parsedBody | undefined>
   */
  async body(): Promise<Body | undefined> {
    if (this.parsedBody) {
      return this.parsedBody
    }
    if (!this.hasBody) {
      return undefined
    }
    this.parsedBody = await bodyParser(this.serverRequest)
    return this.parsedBody
  }

  async query(): Promise<URLSearchParams | undefined> {
    if (this.parsedQuery) {
      return this.parsedQuery
    }
    if (!this.hasQuery) {
      return undefined
    }
    this.parsedQuery = queryParser(this.serverRequest)
    return this.parsedQuery
  }

  /**
   * response.body will always return the body parser
   * with this method, thirdparty body parsers can be used
   * by setting the parsedBody value mannualy
   * @param body this is the already parsed body
   * @return void
   */
  setBody(body: Body | undefined) {
    this.parsedBody = body
  }
}