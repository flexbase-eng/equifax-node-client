import fetch from 'node-fetch'
import FormData = require('formdata')
import path from 'path'
import camelcaseKeys from 'camelcase-keys'

import { AuthenticationApi } from './authentication'
import { ScoresAndAttributesApi } from './scores'

const ClientVersion = require('../package.json').version
const PROTOCOL = 'https'
const EQUIFAX_HOST = 'api.equifax.com'

/*
 * These are the acceptable options to the creation of the Client:
 *
 *   {
 *     host: 'api.sandbox.equifax.com',
 *     clientId: "abc123456def",
 *     clientSecret: "654321",
 *     memberNumber: "abc123456",
 *     securityCode: "XYZ",
 *     customerCode: "AOK",
 *     authScope: "https://api.equifax.com/business/scores-and-attributes/v1"
 *   }
 *
 * and the construction of the Client will use this data for all
 * calls made to Equifax.
 */
export interface EquifaxOptions {
  host?: string;
  clientId: string;
  clientSecret: string;
  memberNumber: string;
  securityCode: string;
  customerCode: string;
  authScope: string;
}

/*
 * These are the standard error objects from Equifax - and will be returned
 * from their API for any bad condition. We will allow these - as well as just
 * strings in the errors being returned from the calls.
 */
export interface EquifaxError {
  type: string;
  description?: string;
  efxErrorCode?: string;
}

/*
 * This is the main constructor of the Equifax Client, and will be called
 * with something like:
 *
 *   import { Equifax } from "@flexbase/equifax-node-client"
 *   const client = new Equifax('123abc566', '54321')
 */
export class Equifax {
  host: string
  clientId: string
  clientSecret: string
  memberNumber: string
  securityCode: string
  customerCode: string
  authScope: string
  authentication: AuthenticationApi
  scoresAttributes: ScoresAndAttributesApi

  constructor (options: EquifaxOptions) {
    this.host = options.host ?? EQUIFAX_HOST
    this.clientId = options.clientId
    this.clientSecret = options.clientSecret
    this.memberNumber = options.memberNumber
    this.securityCode = options.securityCode
    this.customerCode = options.customerCode
    this.authScope = options.authScope
    // now construct all the specific domain objects
    this.authentication = new AuthenticationApi(this, options)
    this.scoresAttributes = new ScoresAndAttributesApi(this, options)
  }

  /*
   * Function to fire off a GET, PUT, POST, (method) to the uri, preceeded
   * by the host, with the optional query params, and optional body, and
   * puts the 'apiKey' into the headers for the call, and fires off the call
   * to the Persona host and returns the response.
   */
  async fire(
    method: string,
    uri: string,
    headers?: any,
    query?: { [index: string] : number | string | string[] | boolean },
    body?: object | object[] | FormData,
  ): Promise<{ response: any, payload?: any }> {
    // build up the complete url from the provided 'uri' and the 'host'
    let url = new URL(PROTOCOL+'://'+path.join(this.host, uri))
    if (query) {
      Object.keys(query).forEach(k => {
        if (something(query![k])) {
          url.searchParams.append(k, query![k].toString())
        }
      })
    }
    const isForm = isFormData(body)
    const isParams = isSearchParams(body)
    // make the appropriate headers
    headers = { ...headers,
      Accept: 'application/json',
      'X-Equifax-Client-Ver': ClientVersion,
    } as any
    if (!isForm && !isParams) {
      headers = { ...headers, 'Content-Type': 'application/json' }
    }
    // allow a few retries on the authentication token expiration
    let response: any
    for (let cnt = 0; cnt < 3; cnt++) {
      if (uri !== 'v2/oauth/token' || method !== 'POST') {
        const auth = await this.authentication.checkToken()
        if (!auth?.success) {
          return { response: { payload: auth } }
        }
        headers = { ...headers,
          'Authorization': 'Bearer ' + this.authentication.accessToken,
        }
      }
      // now we can make the call... see if it's a JSON body or a FormData one...
      try {
        response = await fetch(url, {
          method: method,
          body: (isForm || isParams) ? (body as any) : (body ? JSON.stringify(body) : undefined),
          headers,
          redirect: 'follow',
        })
        const payload = camelcaseKeys((await response?.json()), { deep: true })
        // check for an invalid token from the service
        if (response.status == 401 && Array.isArray(payload?.messages) &&
            payload?.messages.includes('User Token Invalid')) {
          const auth = await this.authentication.resetToken()
          if (!auth?.success) {
            return { response: { ...response, payload: auth } }
          }
          // ...and try it all again... :)
          continue
        }
        return { response, payload }
      } catch (err) {
        return { response }
      }
    }
    // this will mean we retried, and still failed
    return { response }
  }
}

/*
 * Simple function used to weed out undefined and null query params before
 * trying to place them on the call.
 */
function something(arg: any) {
  return arg || arg === false || arg === 0 || arg === ''
}

/*
 * Function to examine the argument and see if it's 'empty' - and this will
 * work for undefined values, and nulls, as well as strings, arrays, and
 * objects. If it's a regular data type - then it's "not empty" - but this
 * will help know if there's something in the data to look at.
 */
export function isEmpty(arg: any): boolean {
  if (arg === undefined || arg === null) {
    return true
  } else if (typeof arg === 'string' || Array.isArray(arg)) {
    return arg.length == 0
  } else if (typeof arg === 'object') {
    return Object.keys(arg).length == 0
  }
  return false
}

/*
 * Simple predicate function to return 'true' if the argument is a FormData
 * object - as that is one of the possible values of the 'body' in the fire()
 * function. We have to handle that differently on the call than when it's
 * a more traditional JSON object body.
 */
function isFormData(arg: any): boolean {
  let ans = false
  if (arg && typeof arg === 'object') {
    ans = (arg.constructor.name === 'FormData')
  }
  return ans
}

/*
 * Simple predicate function to return 'true' if the argument is a
 * URLSearchParams object - as that is one of the possible values of the
 * 'body' in the fire() function. We have to handle that differently on
 * the call than when it's a more traditional JSON object body.
 */
function isSearchParams(arg: any): boolean {
  let ans = false
  if (arg && typeof arg === 'object') {
    ans = (arg.constructor.name === 'URLSearchParams')
  }
  return ans
}

/*
 * Convenience function to create a EcreditError based on a simple message
 * from the Client code. This is an easy way to make EcreditError instances
 * from the simple error messages we have in this code.
 */
export function mkError(message: string): EquifaxError {
  return {
    type: 'client',
    description: message,
  }
}

/*
 * Function to recursively remove all the 'empty' values from the provided
 * Object and return what's left. This will not cover the complete boolean
 * falsey set.
 */
export function removeEmpty(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(itm => removeEmpty(itm)) }
  else if (typeof obj === 'object') {
    return Object.entries(obj)
      .filter(([_k, v]) => !isEmpty(v))
      .reduce(
        (acc, [k, v]) => (
          { ...acc, [k]: v === Object(v) ? removeEmpty(v) : v }
        ), {}
      )
  }
  return obj
}
