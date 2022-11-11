import { Equifax } from '../src/index'

(async () => {
  const client = new Equifax({
    clientId: process.env.EQUIFAX_CLIENT_ID!,
    clientSecret: process.env.EQUIFAX_CLIENT_SECRET!,
    memberNumber: process.env.EQUIFAX_MEMBER_NUMBER!,
    securityCode: process.env.EQUIFAX_SECURITY_CODE!,
    customerCode: process.env.EQUIFAX_CUSTOMER_CODE!,
    authScope: process.env.EQUIFAX_AUTH_SCOPE!,
    host: process.env.EQUIFAX_HOST!,
  })

  console.log('attempting to get an authentication token...')
  const one = await client.authentication.checkToken()
  // console.log('ONE', one)
  if (one.success) {
    console.log('Success!')
  } else {
    console.log('Error! I was not able to get a valid auth token')
    console.log(one)
  }

  console.log('checking that the authentication token stuck...')
  if (client.authentication.accessToken) {
    console.log('Success!')
  } else {
    console.log('Error! I was not able to veify the new auth token')
    console.log(client.authentication.accessToken)
  }

  console.log('attempting to reset for a new authentication token...')
  const two = await client.authentication.resetToken()
  // console.log('TWO', two)
  if (two.success) {
    console.log('Success!')
  } else {
    console.log('Error! I was not able to get a *new* valid auth token')
    console.log(two)
  }
})()
