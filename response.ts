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
  sendResponse: () => void
  redirect: (
    url: string | URL | typeof REDIRECT_BACK,
    alt?: string | URL
  ) => void
}

/**
 * This class represents the response object from Mith framework
 */
export class Response implements IResponse{
  error?: any
  body: any = {}
  headers: Headers = new Headers()
  finished: boolean = false
  sent: boolean = false
  status: number = 200
  private request: ServerRequest

  constructor(req: ServerRequest) {
    this.request = req
  }

  /**
   * Redirects the user to the chosen URL
   * @param url string or url or symbol redirect backwards
   * @param alt string or url to be used in case of unexisting "Referrer" when redirecting the user backwards 
   * @return void
   */
  redirect(url: string | URL | typeof REDIRECT_BACK, alt: string | URL = "/") {
    if (url === REDIRECT_BACK) {
      url = this.request.headers.get("Referrer") ?? String(alt);
    } else if (typeof url === "object") {
      url = String(url);
    }
    this.headers.set("Location", encodeUrl(url));
    
    this.status = 302;
    
    this.headers.set('Content-Type', 'text/plain; charset=utf-8')
    this.body = this.body.length !== undefined && this.body.length !== 0 ? this.body : `Redirecting to ${url}.`
  }

  /**
   * Sends the response back to the caller
   *
   * @param request Deno Server Request Object
   * @param response Mith Server Response Object
   * @return void
   */
  public async sendResponse() {
    let body = this.body
    if (!this.sent) {
      this.sent = true
      if (typeof this.body === 'object') {
        if (!this.headers.get('content-type')) {
          this.headers.set('content-type', 'application/json')
        }
        body = JSON.stringify(this.body)
      }
      await this.request.respond({
        status: this.status,
        headers: this.headers,
        body,
      }).catch((e) => {console.log(e)})
    }
  }
}