import { ServerRequest} from './deps.ts';

export type Body = {
  [key: string]: Body | number
} | string

/**
 * Supported content types on the request headers 
 */
const CONTENT_TYPES: {
  [key: string]: string | undefined
} = {
  'application/json': 'json',
  'application/x-www-form-urlencoded': 'urlencoded',
  'text/plain': 'text',
  'raw': undefined
}

/**
 * Regex for the query string parser, matches all characters after and including '?'
 */
const regex = new RegExp(/\?.+$/)

/**
 * Parses the body of a request into a JSON format
 * Currently only JSON and urlencoded optiosn are supported
 * @param request Deno request object
 * @return Promise<undefined | Body> 
 */
export async function bodyParser(req: ServerRequest): Promise<undefined | Body> {
  let body: Body | undefined
  const contentType = CONTENT_TYPES[req.headers.get("content-type")?.split(';')[0] || 'raw']
  const decoder = new TextDecoder()
  const rawBody = decoder.decode(await Deno.readAll(req.body))
  if (!contentType) {
    return rawBody
  }
  switch (contentType) {
    case 'json': {
      body = JSON.parse(rawBody)
      break;
    }
    case 'urlencoded': {
      const searchParams = new URLSearchParams(rawBody.replace(/\+/g, " "))
      body = {}
      for (var pair of searchParams.entries()) {
        body[pair[0]] = pair[1]
      }
      break;
    }
    default:
      body = rawBody
      break;
  }
  
  return body
}

/**
 * Parses the query string of a request into an URLSearchParams object
 * @param request Deno request object
 * @return URLSearchParams | undefined
 */
export function queryParser(req: ServerRequest) {
  const match = regex.exec(req.url)
  if (match?.length) {
    return new URLSearchParams(match[0])
  }
}
