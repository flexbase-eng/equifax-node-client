import type { Equifax, EquifaxOptions, EquifaxError } from './'

export interface EquifaxAuth {
  success: boolean;
  accessToken?: string;
  error?: EquifaxError;
}

export class AuthenticationApi {
  client: Equifax
  accessToken?: string

  constructor(client: Equifax, _options?: EquifaxOptions) {
    this.client = client
    this.accessToken = undefined
  }

  /*
   * Function to look and see if we already have a token for this instance,
   * and if so, then return it successfully, but if not, then let's fetch
   * one from the Equifax service for the provided credentials, and then
   * save it.
   */
  async checkToken(): Promise<EquifaxAuth> {
    // if we already have a token, use it - we can't check it's expiration
    if (this.accessToken) {
      return { success: true, accessToken: this.accessToken }
    }
    // ...at this point, we know there is no token, so get one
    const resp = await this.getToken()
    if (!resp?.success) {
      return { ...resp, success: false }
    }
    // save the token we just got, and return the response
    this.accessToken = resp.accessToken
    return resp
  }

  /*
   * Function to force a refetching of the access token. Maybe it's expired,
   * or the credentials have changed, but for whatever reason, we need to
   * force a token refresh, and this function does just that.
   */
  async resetToken(): Promise<EquifaxAuth> {
    this.accessToken = undefined
    return (await this.checkToken())
  }

  /*
   * Function to use the credentials in the host Client instance to make
   * a 'token/' call to the service and get back the response that will
   * contain a token - shoot that back to the caller and everyone is happy.
   */
  async getToken(): Promise<EquifaxAuth> {
    const mashup = Buffer.from(this.client.clientId + ':' + this.client.clientSecret).toString('base64')
    // the body is actually Form parameters...
    const params = new URLSearchParams()
    params.append('grant_type', 'client_credentials')
    params.append('scope', this.client.authScope)
    const resp = await this.client.fire(
      'POST',
      'v2/oauth/token',
      { Authorization: `Basic ${mashup}` },
      undefined,
      params,
    )
    if (resp?.response?.status >= 400) {
      return { success: false, error: { ...resp?.payload, type: 'equifax' } }
    }
    return { ...resp?.payload, success: true }
  }
}
