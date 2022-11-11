# ecredit-node-client

`ecredit-node-client` is a Node/JS and TypeScript Client for
[CRS Credit](https://crscreditapi.com) that allows you to use normal Node
syntax to Experian, Equifax, and other data from the CRS Credit
[eCredit API](https://crscreditapi.com/signup-smart-api/).

## Install

```bash
# with npm
$ npm install @flexbase/ecredit-node-client
```

## Usage

This README isn't going to cover all the specifics of what CRS Credit is,
and how to use it - it's targeted as a _companion_ to the CRS Credit developer
[docs](https://crsecreditdataapi.redoc.ly/)
that explain each of the endpoints and how the general CRS Credit
[API](https://crsecreditdataapi.redoc.ly/) works.

However, we'll put in plenty of examples so that it's clear how to use this
library to interact with CRS Credit.

### Getting your Credentials

This client uses the standard `username` and `password`, and you obtain those
from the CRS Credit support team.

### Creating the Client

At the current time, a targeted subset of functions are available from the
client. These are currently about the Experian domain. As we add more features,
this client will exapnd, but for now, this works as we need it to.

The basic construction of the client is:

```typescript
import { Ecredit } from '@flexbase/ecredit-node-client'
const client = new Ecredit(username, password)
```

If you'd like to provide the Host to use, say, for sandbox access,
this can also be provided in the constructor:

```typescript
const client = new Eclient(username, password, {
  host: 'mware-dev.crscreditapi.com/api',
})
```

where the options can include:

* `host` - the hostname where all eCredit calls should be sent

### Experian Calls

The CRS Credit API
[documentation](https://crsecreditdataapi.redoc.ly/) is broken up into
different sections, and for the Experian section, we have implemented
the calls most important to our work.

#### [Basic Credit Report](https://crsecreditdataapi.redoc.ly/tag/Experian#operation/creditReportBasic_1)

You can get a Basic Experian Credit Report with a single call:

```typescript
const resp = await client.experian.basic({
  firstName: 'ANDERSON',
  lastName: 'LAURIE',
  ssn: '666-45-5730',
  street1: '9817 LOOP BLVD',
  street2: 'APT G',
  city: 'CALIFORNIA CITY',
  state: 'CA',
  zip: '93505-1352',
})
```

where the user is a test user for Experian's sandbox instance. And the
response will be something like:

```javascript
{
  success: true,
  report: {
    headerRecord: [ [Object] ],
    addressInformation: [ [Object], [Object], [Object] ],
    consumerIdentity: { dob: [Object], name: [Array] },
    employmentInformation: [ [Object], [Object] ],
    informationalMessage: [ [Object], [Object] ],
    inquiry: [ [Object], [Object], [Object] ],
    publicRecord: [ [Object] ],
    riskModel: [ [Object] ],
    tradeline: [
      [Object], [Object],
      [Object], [Object],
      [Object], [Object],
      [Object], [Object],
      [Object], [Object],
      [Object], [Object],
      [Object], [Object],
      [Object], [Object],
      [Object]
    ],
    endTotals: [ [Object] ]
  }
}
```

where the complete, detailed structure is in the Typescript `interface`
definitions.

There is an _optional_ config, as detailed in the CRS Credit docs, and
that can be specified as:

```typescript
const resp = await client.experian.basic(person, {
  config: 'exp-prequal-vantage4',
})
```

and that will be the _version_ of the report that's pulled from Experian
and returned to CRS Credit, and ultimately, the client.


## Development

For those interested in working on the library, there are a few things that
will make that job a little simpler. The organization of the code is all in
`src/`, with one module per _section_ of the Client: `authentication`,
`experian`, etc. This makes location of the function very easy.

Additionally, the main communication with the CRS Credit service is in the
`src/index.ts` module in the `fire()` function. In the constructor for the
Client, each of the _sections_ are created, and then they link back to the
main class for their communication work.

### Setup

In order to work with the code, the development dependencies include `dotenv`
so that each user can create a `.env` file with a single value for working
with CRS Credit:

* `ECREDIT_USERNAME` - this is the CRS Credit generated "username".
* `ECREDIT_PASSWORD` - this is the CRS Credit "password".

### Testing

There are several test scripts that test, and validate, information on the
CRS Credit service exercising different parts of the API. Each is
self-contained, and can be run with:

```bash
$ npm run ts tests/basic.ts

> @flexbase/ecredit-node-client@0.1.0 ts
> ts-node -r dotenv/config "tests/basic.ts"

doing a soft pull from Experian...
Success! Pulled the prequal report for test person
doing a hard pull from Experian...
Success! Pulled the hard report for test person
```

Each of the tests will run a series of calls through the Client, and check the
results to see that the operation succeeded. As shown, if the steps all
report back with `Success!` then things are working.

If there is an issue with one of the calls, then an `Error!` will be printed
out, and the data returned from the client will be dumped to the console.
