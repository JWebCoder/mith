/*!
 * cookie-session
 * Copyright(c) 2020 João Moura
 * MIT Licensed
 */

import { ServerRequest } from "https://deno.land/std@0.51.0/http/server.ts"
import { setCookie, getCookies } from "https://deno.land/std@0.51.0/http/cookie.ts"
import { v4 } from "https://deno.land/std@0.51.0/uuid/mod.ts";
import { Middleware, Response, NextFunction } from "https://raw.githubusercontent.com/JWebCoder/mith/master/mod.ts"
import debug from 'https://deno.land/x/debuglog/debug.ts'
let logger = debug('cookie_session')

type keyTypes = string | number

declare module "https://deno.land/std@0.51.0/http/server.ts" {
    interface ServerRequest {
      session: {
        [key in keyTypes]: any
      }
    }
}

export interface options {
  name?: string,
  keys?: string[],
  secret?: string,
  maxAge?: number,
  expires?: Date,
  path?: string,
  domain?: string,
  sameSite?: "Strict" | "Lax" | "None" | undefined,
  secure?: boolean,
  httpOnly?: boolean,
  signed?: boolean,
  overwrite?: boolean
}

let configurationOptions: options
/**
 * Module exports.
 * @public
 */
/**
 * Create a new cookie session middleware.
 *
 * @param {object} [options]
 * @param {boolean} [options.httpOnly=true]
 * @param {array} [options.keys]
 * @param {string} [options.name=session] Name of the cookie to use
 * @param {boolean} [options.overwrite=true]
 * @param {string} [options.secret]
 * @param {boolean} [options.signed=true]
 * @return {function} middleware
 * @public
 */

export function cookieSession (options: options): Middleware {
  // cookie name
  configurationOptions = options
  configurationOptions.name = configurationOptions.name || 'mith'

  // secrets
  if (!configurationOptions.keys && !configurationOptions.secret) {
    throw "You should specify keys or secret properties for the cookie session configuration"
  }
  configurationOptions.keys = configurationOptions.keys || [configurationOptions.secret || '']
  
  logger('session options %j', configurationOptions) 

  return (req: ServerRequest, res: Response, next: NextFunction) => {
    logger('running')
    let authString = getCookies(req)[(configurationOptions.name as string)]
    
    let authData: {[key: string]: any} = {}
    logger('authString %s', authString)
    if (authString) {
      authData = JSON.parse(authString)
    }
    if (!authData.id) {
      authData.id = v4.generate()
    }
    const handler = {
      get: (target: {[key: string]: any}, property: string): any => {1
        if (typeof target[property] === 'object' && target[property] !== null) {
          return new Proxy(target[property], handler)
        } else {
          return target[property];
        }
      },
      set: (target: {[key: string]: any}, property: string, newValue: any) => {
        target[property] = newValue
        setCookie(res, {
          name: (configurationOptions.name as string),
          value: JSON.stringify(req.session),
          ...configurationOptions
        })
        return true
      }
    }

    req.session = new Proxy(authData, handler)
    next()
  }
}

export function cookieSessionSave (): Middleware {
  return async (req, res, next) => {
    logger('Saving session %O', )
    logger(JSON.stringify(req.session))
    setCookie(res, {
      name: (configurationOptions.name as string),
      value: JSON.stringify(req.session),
      ...configurationOptions
    })
    next()
  }
}

