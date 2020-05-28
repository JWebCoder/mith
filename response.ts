import { Response as DenoResponse } from "https://deno.land/std@0.53.0/http/server.ts"
import { Request } from './mod.ts'

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
  request: Request
  error?: any
  body: any
  headers: Headers
  finished: boolean
  sent: boolean
  status: number

  constructor(req: Request) {
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
    newResponse.headers.set("Location", encodeUrl(url));
    
    newResponse.status = 302;
    
    newResponse.headers.set('Content-Type', 'text/plain; charset=utf-8')
    newResponse.body = `Redirecting to ${url}.`;
    newResponse.send()
  }
}