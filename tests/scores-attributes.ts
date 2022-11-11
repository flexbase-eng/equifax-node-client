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

  const dennis = {
    firstName: 'DENNIS',
    lastName: 'BGBPGK',
    middleName: 'W',
    dob: '1977-08-02',
    ssn: '666-84-7432',
    houseNumber: '714',
    streetName: 'ALMAKA',
    streetType: 'DR',
    city: 'POOLVILLE',
    state: 'TX',
    zip: '76487',
  }

  console.log('doing a soft pull from Experian for potential Fraud victim...')
  const one = await client.scoresAttributes.report(dennis)
  // console.log('ONE', one.report!)
  if (one.success) {
    console.log(`Success! Pulled the report for test person... FICO Score: ${client.scoresAttributes.ficoScore(one?.report!)}`)
    console.log(`    ... Fraud indicator: ${client.scoresAttributes.isFraud(one?.report!)}`)
    console.log(`    ... Frozen: ${client.scoresAttributes.isFrozen(one?.report!)}`)
    console.log(`    ... Bankruptcies: ${client.scoresAttributes.bankruptcies(one?.report!)}`)
  } else {
    console.log('Error! Getting Scores & Attributes Equifax pull failed, and the output is:')
    console.log(one)
  }

  const mark = {
    firstName: 'MARK',
    lastName: 'FFUU',
    middleName: 'T',
    ssn: '666-78-4309',
    houseNumber: '9173',
    streetName: 'RCPCAF PJA',
    streetType: 'RD',
    city: 'LASC',
    state: 'NM',
    zip: '88011',
  }

  console.log('doing a soft pull from Equifax for a Frozen user...')
  const two = await client.scoresAttributes.report(mark)
  // console.log('TWO', two.report!)
  if (two.success) {
    console.log(`Success! Pulled the report for test person... FICO Score: ${client.scoresAttributes.ficoScore(two?.report!)}`)
    console.log(`    ... Fraud indicator: ${client.scoresAttributes.isFraud(two?.report!)}`)
    console.log(`    ... Frozen: ${client.scoresAttributes.isFrozen(two?.report!)}`)
    console.log(`    ... Bankruptcies: ${client.scoresAttributes.bankruptcies(two?.report!)}`)
  } else {
    console.log('Error! Getting Scores & Attributes Equifax pull failed, and the output is:')
    console.log(two)
  }

  const shandra = {
    firstName: 'JEROME',
    lastName: 'CCACTUS',
    ssn: '666-29-7213',
    houseNumber: '14610',
    streetName: 'E SPRAGUE',
    streetType: 'AV',
    city: 'SPOKANE VALLEY',
    state: 'WA',
    zip: '99216',
    phone: '(770) 555-1212'
  }

  console.log('doing a soft pull from Equifax for a Normal user...')
  const tre = await client.scoresAttributes.report(shandra)
  // console.log('TRE', tre.report!.consumers.equifaxUsConsumerCreditReport![0].models[0])
  if (tre.success) {
    console.log(`Success! Pulled the report for test person... FICO Score: ${client.scoresAttributes.ficoScore(tre?.report!)}`)
    console.log(`    ... Fraud indicator: ${client.scoresAttributes.isFraud(tre?.report!)}`)
    console.log(`    ... Frozen: ${client.scoresAttributes.isFrozen(tre?.report!)}`)
    console.log(`    ... Bankruptcies: ${client.scoresAttributes.bankruptcies(tre?.report!)}`)
  } else {
    console.log('Error! Getting Scores & Attributes Equifax pull failed, and the output is:')
    console.log(tre)
  }

  const roberto = {
    firstName: 'ROBERTO',
    lastName: 'SCWLXZZXG',
    middleName: 'S',
    suffix: '3',
    ssn: '666-43-9827',
    dob: '1994-03-07',
    houseNumber: '3435',
    streetName: 'RENAISSANCE',
    streetType: 'CIR',
    city: 'ATLANTA',
    state: 'GA',
    zip: '30349',
  }

  console.log('doing a soft pull from Equifax for a user with Bankruptcies...')
  const fou = await client.scoresAttributes.report(roberto)
  // console.log('fou', fou.report!.consumers.equifaxUsConsumerCreditReport[0].bankruptcies!)
  if (fou.success) {
    console.log(`Success! Pulled the report for test person... FICO Score: ${client.scoresAttributes.ficoScore(fou?.report!)}`)
    console.log(`    ... Fraud indicator: ${client.scoresAttributes.isFraud(fou?.report!)}`)
    console.log(`    ... Frozen: ${client.scoresAttributes.isFrozen(fou?.report!)}`)
    console.log(`    ... Bankruptcies: ${client.scoresAttributes.bankruptcies(fou?.report!)}`)
  } else {
    console.log('Error! Getting Scores & Attributes Equifax pull failed, and the output is:')
    console.log(fou)
  }

})()
