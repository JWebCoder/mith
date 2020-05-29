import { Response as DenoResponse, ServerRequest } from './deps.ts'

/** Encodes the url preventing double enconding */
export function encodeUrl(url: string) {
  return String(url)
    .replace(UNMATCHED_SURROGATE_PAIR_REGEXP, UNMATCHED_SURROGATE_PAIR_REPLACE)
    .replace(ENCODE_CHARS_REGEXP, encodeURI)
}

const ENCODE_CHARS_REGEXP = /(?:[^\x21\x25\x26-\x3B\x3D\x3F-\x5B\x5D\x5F\x61-\x7A\x7E]|%(?:[^0-9A-Fa-f]|[0-9A-Fa-f][^0-9A-Fa-f]|$))+/g

const UNMATCHED_SURROGATE_PAIR_REGEXP = /(^|[^\uD800-\uDBFF])[\uDC00-\uDFFF]|[\uD800-\uDBFF]([^\uDC00-\uDFFF]|$)/g;

const UNMATCHED_SURROGATE_PAIR_REPLACE = "$1\uFFFD$2";

export const REDIRECT_BACK = Symbol("redirect backwards")

export interface IResponse extends DenoResponse {
  error?: any
  body: any
  headers: Headers
  finished: boolean
  sent: boolean
  send: () => void
  redirect: (
    url: string | URL | typeof REDIRECT_BACK,
    alt?: string | URL
  ) => void
}

export class Response implements IResponse{
  error?: any
  body: any
  headers: Headers
  finished: boolean
  sent: boolean
  status: number
  private request: ServerRequest

  constructor(req: ServerRequest) {
    this.request = req
    this.body = {}
    this.headers = new Headers()
    this.finished = false
    this.sent = false
    this.status = 200
  }

  send() {
    this.finished = true
    return this
  }

  redirect(url: string | URL | typeof REDIRECT_BACK, alt: string | URL = "/") {
    if (url === REDIRECT_BACK) {
      url = this.request.headers.get("Referrer") ?? String(alt);
    } else if (typeof url === "object") {
      url = String(url);
    }
    this.headers.set("Location", encodeUrl(url));
    
    this.status = 302;
    
    this.headers.set('Content-Type', 'text/plain; charset=utf-8')
    this.body = `Redirecting to ${url}.`;
    this.send()
  }

  /**
   * Sends the response back to the caller
   *
   * @param request Deno Server Request Object
   * @param response Mith Server Response Object
   * @return void
   */
  public async sendResponse() {
    if (!this.sent) {
      this.sent = true
      if (typeof this.body === 'object') {
        if (!this.headers.get('content-type')) {
          this.headers.set('content-type', 'application/json')
        }
        this.body = JSON.stringify(this.body)
      }
      await this.request.respond(this).catch((e) => {console.log(e)})
    }
  }
}