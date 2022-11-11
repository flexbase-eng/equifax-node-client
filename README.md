# equifax-node-client

`equifax-node-client` is a Node/JS and TypeScript Client for
[Equifax](https://equifax.com) that allows you to use normal Node
syntax to the different Equifax applications. Currently, this is
only written for the _Scores & Attributes_ application, but it can
be extended rather easily.

## Install

```bash
# with npm
$ npm install @flexbase/equifax-node-client
```

## Usage

This README isn't going to cover all the specifics of what Equifax is,
and how to use it - it's targeted as a _companion_ to the Equifax developer
[docs](https://developer.equifax.com/)
that explain each of the endpoints and how the general Equifax
[API](https://developer.equifax.com/) works.

However, we'll put in plenty of examples so that it's clear how to use this
library to interact with Equifax.

### Getting your Credentials

This client uses the following account parameters, obtainable from the
Equifax support team:

These are obtained from the Equifax Developer's Dashboard, and are
**_different_** for each of the three Equifax environments: `sandbox`,
`test`, and `production`:

* `clientId`
* `clientSecret`

Once you have promoted your Equifax application to `test`, the Equifax
support team will email you the following for the `test` environment:

* `memberNumber`
* `securityCode`
* `customerCode`

and these, with the new `clientId` and `clientSecret` for `test`, will
allow you to run the calls in their `test` environment.

### Creating the Client

At the current time, a targeted subset of functions are available from the
client. These are currently about the Equifax _Scores & Attributes_
application. As we add more features, this client will exapnd, but for now,
this works as we need it to.

The basic construction of the client is:

```typescript
import { Equifax } from '@flexbase/equifax-node-client'
const client = new Equifax({
  clientId: 'abcdefgh123456789',
  clientSecret: '123bcd445kjhsdf',
  memberNumber: '999XX00000',
  securityCode: 'XXX',
  customerCode: 'BQ81',
  authScope: 'https://api.equifax.com/business/scores-and-attributes/v1',
})
```

If you'd like to provide the Host to use, say, for sandbox access,
this can also be provided in the constructor:

```typescript
const client = new Equifax({
  clientId: 'abcdefgh123456789',
  clientSecret: '123bcd445kjhsdf',
  memberNumber: '999XX00000',
  securityCode: 'XXX',
  customerCode: 'BQ81',
  authScope: 'https://api.equifax.com/business/scores-and-attributes/v1',
  host: 'api.sandbox.equifax.com',
})
```

### Scores & Attributes Calls

The Equifax API
[documentation](https://developer.equifax.com/) is broken up into
different sections, and for the Equifax application, as they are called.
We have implemented the calls most important to our work.

#### Basic Report

You can get a Basic Equifax Scores and Attributes Report with a single call:

```typescript
const one = await client.scoresAttributes.report({
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
})
```

where this user is a test user for Equifax's sandbox instance. And the
response will be something like:

```javascript
{
  success: true,
  report: {
    status: 'completed',
    consumers: { equifaxUsConsumerCreditReport: [{
      identifier: 'Individual Report 1',
      customerNumber: '999FZ13988',
      consumerReferralCode: '392',
      multipleReportIndicator: '1',
      ecoaInquiryType: 'I',
      outputFormatCode: 'T2',
      hitCode: { code: '1', description: 'Hit' },
      fileSinceDate: '04012005',
      lastActivityDate: '10102022',
      reportDate: '11112022',
      subjectName: { firstName: 'DENNIS', lastName: 'BGBPGK', middleName: 'W' },
      subjectSocialNum: '666847432',
      birthDate: '11081978',
      addressDiscrepancyIndicator: 'N',
      fraudIdScanAlertCodes: [
        {
          code: '8',
          description: 'UNABLE TO PERFORM TELEPHONE VALIDATION DUE TO INSUFFICIENT TELEPHONE INPUT'
        }
      ],
      addresses: [
        {
          addressType: 'current',
          houseNumber: '714',
          streetName: 'ALMAKA',
          streetType: 'DR',
          cityName: 'POOLVILLE',
          stateAbbreviation: 'TX',
          zipCode: '76487',
          sourceOfAddress: [Object],
          addressLine1: '714 ALMAKA DR'
        },
        ...
      ],
      employments: [
        { identifier: 'current', occupation: 'RAFTERLCHUCKWAGON' },
        { identifier: 'former', employer: 'SELF' }
      ],
      trades: [
        {
          customerNumber: '458ON13374',
          automatedUpdateIndicator: '*',
          monthsReviewed: '99',
          accountDesignator: [Object],
          thirtyDayCounter: 3,
          sixtyDayCounter: 3,
          ninetyDayCounter: 43,
          previousHighRate1: 5,
          previousHighDate1: '072022',
          previousHighRate2: 5,
          previousHighDate2: '062022',
          previousHighRate3: 5,
          previousHighDate3: '052022',
          customerName: 'JPMCB CARD',
          dateReported: '102022',
          dateOpened: '062014',
          highCredit: 5000,
          balance: 2139,
          rate: [Object],
          narrativeCodes: [Array],
          rawNarrativeCodes: [Array],
          lastActivityDate: '102022'
        },
        ...
      ],
      inquiries: [
        {
          type: 'fileInquiry',
          industryCode: 'ZR',
          inquiryDate: '10102022',
          customerNumber: '999ZR00251',
          customerName: 'TCI'
        }
      ],
      models: [
        {
          type: 'FICO',
          ficoScoreIndicatorCode: [Object],
          score: 614,
          reasons: [Array]
        }
      ],
      identification: {
        subjectSocialNum: '666847432',
        inquirySocialNum: '666847432',
        inquirySocialNumStateIssued: 'GA',
        inquirySocialNumYearIssued: '1969'
      }
    }] }
  }
}
```

where the complete, detailed structure is in the Typescript `interface`
definitions.

## Development

For those interested in working on the library, there are a few things that
will make that job a little simpler. The organization of the code is all in
`src/`, with one module per _section_ of the Client: `authentication`,
`scores`, etc. This makes location of the function very easy.

Additionally, the main communication with the Equifax service is in the
`src/index.ts` module in the `fire()` function. In the constructor for the
Client, each of the _sections_ are created, and then they link back to the
main class for their communication work.

### Setup

In order to work with the code, the development dependencies include `dotenv`
so that each user can create a `.env` file with the options for creating the
`Equifax` client:

```env
EQUIFAX_HOST='api.sandbox.equifax.com'
EQUIFAX_CLIENT_ID='abcdefgh123456789'
EQUIFAX_CLIENT_SECRET='123bcd445kjhsdf'
EQUIFAX_MEMBER_NUMBER='999XX00000'
EQUIFAX_SECURITY_CODE='XXX'
EQUIFAX_CUSTOMER_CODE='BQ81'
EQUIFAX_AUTH_SCOPE='https://api.equifax.com/business/scores-and-attributes/v1'
```

### Testing

There are several test scripts that test, and validate, information on the
Equifax service exercising different parts of the API. Each is
self-contained, and can be run with:

```bash
$ npm run ts tests/check-auth.ts

> @flexbase/equifax-node-client@0.1.0 ts
> ts-node -r dotenv/config

attempting to get an authentication token...
Success!
checking that the authentication token stuck...
Success!
attempting to reset for a new authentication token...
Success!
```

Each of the tests will run a series of calls through the Client, and check the
results to see that the operation succeeded. As shown, if the steps all
report back with `Success!` then things are working.

If there is an issue with one of the calls, then an `Error!` will be printed
out, and the data returned from the client will be dumped to the console.
