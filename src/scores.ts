import type { Equifax, EquifaxOptions, EquifaxError } from './'

export interface CreditReport {
  status: string;
  consumers: {
    equifaxUsConsumerCreditReport: ConsumerReport[];
  }
}

export interface ConsumerReport {
  identifier: string;
  customerReferenceNumber: string;
  customerNumber: string;
  consumerReferralCode: string;
  multipleReportIndicator: string;
  ecoaInquiryType: string;
  hitCode: Code;
  fileSinceDate: string;
  lastActivityDate: string;
  reportDate: string;
  subjectName: Name;
  subjectSocialNum: string;
  birthDate: number | string;
  addressDiscrepancyIndicator?: string;
  impactedDataIndicator?: string;
  fraudVictimIndicator?: Code;
  fraudIdScanAlertCodes?: Code[];
  addresses: Address[];
  formerNames?: Name[];
  trades?: any[];
  inquiries?: Inquiry[];
  employments?: Employment[];
  bankruptcies?: Bankruptcy[];
  consumerStatements: ConsumerStatement[];
  models: Model[];
  ofacAlerts?: OFACAlert[];
}

export interface Code {
  code: string;
  description?: string;
}

export interface Name {
  lastName: string;
  firstName: string;
  middleInitial?: string;
  suffix?: string;
}

export interface Address {
  addressType: string;
  houseNumber: string;
  streetName: string;
  streetType: string;
  cityName: string;
  stateAbbreviation: string;
  zipCode: string;
  sourceOfAddress: Code;
  addressVarianceIndicator?: Code;
  addressLine1: string;
}

export interface ConsumerStatement {
  dateReported: string;
  datePurged: string;
  statement: string;
}

export interface Model {
  type: string;
  ficoScoreIndicatorCode: {};
  score: number;
  reasons: Code[];
}

export interface OFACAlert {
  revisedLegalVerbiageIndicator: string;
  memberFirmCode: string;
  cdcTransactionDate: string;
  cdcTransactionTime: string;
  transactionType: string;
  cdcResponseCode: string;
  legalVerbiage: string;
  dataSegmentRegulated: string;
}

export interface Inquiry {
  type: string;
  industryCode: string;
  inquiryDate: string;
  customerNumber: string;
  customerName: string;
}

export interface Employment {
  identifier: string;
  occupation?: string;
  employer: string;
}

export interface Bankruptcy {
  customerNumber: string;
  type: string;
  filer: string;
  industryCode: string;
  currentIntentOrDispositionCode: Code;
  dateFiled: string;
}

import { v4 as uuidv4 } from 'uuid'
import { isEmpty } from './'

export class ScoresAndAttributesApi {
  client: Equifax

  constructor(client: Equifax, _options?: EquifaxOptions) {
    this.client = client
  }

  /*
   * Function to take some standard User information and run the Basic
   * Equifax Credit Report on the data and return it. This is something
   * that should be pretty standard. The optional 'config' is there to
   * indicate what type of Equifax Credit Report we are looking to obtain.
   */
  async report(data: {
    firstName: string,
    middleName?: string,
    lastName: string,
    suffix?: string,
    dob?: string,
    ssn?: string,
    houseNumber?: string,
    streetName?: string,
    streetType?: string,
    apartmentNumber?: string,
    city: string,
    state: string,
    zip?: string,
    phone?: string,
  }, options?: {
    customerReferenceIdentifier?: string,
    correlationId?: string,
  }): Promise<{
    success: boolean,
    report?: CreditReport,
    error?: EquifaxError,
  }> {
    // prep the fields for the the call - if needed
    if (!isEmpty(data.zip)) {
      data.zip = data.zip!.replace(/-/g, '')
    }
    if (!isEmpty(data.ssn)) {
      data.ssn = data.ssn!.replace(/-/g, '')
    }
    if (!isEmpty(data.phone)) {
      data.phone = data.phone!.replace(/[-\(\) ]/g, '')
    }
    if (!isEmpty(data.dob)) {
      const hits = data.dob!.match(/^([0-9]{4})-([0-9]{2})-([0-9]{2})$/)!
      if (hits) {
        const [_, y, m, d] = hits
        if (y && m && d) {
          data.dob = `${m}${d}${y}`
        }
      }
    }
    // build the body
    const body: any = {
      consumers: {
        name: [{
          identifier: 'current',
          firstName: data.firstName,
          lastName: data.lastName,
          middleName: data.middleName,
          suffix: data.suffix,
        }],
        socialNum: [{
          identifier: 'current',
          number: data.ssn,
        }],
        phoneNumbers: [{
          identifier: 'current',
          number: data.phone,
        }],
        dateOfBirth: data.dob,
        addresses: [{
          identifier: 'current',
          houseNumber: data.houseNumber,
          streetName: data.streetName,
          streetType: data.streetType,
          apartmentNumber: data.apartmentNumber,
          city: data.city,
          state: data.state,
          zip: data.zip,
        }],
      },
      customerReferenceIdentifier: options?.customerReferenceIdentifier,
      customerConfiguration: {
        equifaxUSConsumerCreditReport: {
          memberNumber: this.client.memberNumber,
          securityCode: this.client.securityCode,
          codeDescriptionRequired: true,
          customerCode: this.client.customerCode,
          fixedInquiryFormat: '72',
          multipleReportIndicator: '1',
          fileSelectionLevel: 'B',
          monthsForInquiry: '',
          plainLanguage: 'P',
          ECOAInquiryType: 'Individual',
          optionalFeatureCode: ['X'],
          vendorIdentificationCode: 'FI',
        },
      },
    }
    // ...now make the call...
    const resp = await this.client.fire(
      'POST',
      'business/scores-and-attributes/v1/reports/score-attributes',
      { 'efx-client-correlation-id': options?.correlationId ?? uuidv4() },
      undefined,
      body,
    )
    if ((resp?.response?.status >= 400) || !isEmpty(resp?.payload?.timestamp)) {
      return { success: false, error: { ...resp?.payload, type: 'equifax' } }
    }
    return { success: true, report: resp?.payload }
  }

  /*
   * Simple function to extract the FICO Score from the Equifax Report
   * and return it - or `undefined` if there's nothing to be found.
   */
  ficoScore(rpt: CreditReport): number | undefined {
    let score
    const base = rpt?.consumers?.equifaxUsConsumerCreditReport
    if (Array.isArray(base) && base.length > 0) {
      const crpt = base.find(itm => Array.isArray(itm.models))
      if (crpt) {
        const fico = crpt.models.find(rm => rm.type === 'FICO')
        if (fico?.score) {
          score = Number(fico?.score)
        }
      }
    }
    return score
  }

  /*
   * Simple predicate function to look and see if the User's credit has
   * been 'frozen' so that Credit Reports can't be run against it - for
   * anti-fraud reasons.
   */
  isFrozen(rpt: CreditReport): boolean {
    let frozen = false
    const base = rpt?.consumers?.equifaxUsConsumerCreditReport
    if (Array.isArray(base) && base.length > 0) {
      const crpt = base.find(itm => itm.hitCode)
      if (crpt) {
        frozen = crpt.hitCode.code === 'A'
      }
    }
    return frozen
  }

  /*
   * Simple function to look for any indication of this being a Fraud
   * Victim, and if so, return the 'description' string as the answer.
   * This can double as a predicate function as no Fraud issues will
   * return 'undefined'.
   */
  isFraud(rpt: CreditReport): string[] | undefined {
    let fraud
    const base = rpt?.consumers?.equifaxUsConsumerCreditReport
    if (Array.isArray(base) && base.length > 0) {
      const crpt = base.find(itm => Array.isArray(itm.fraudIdScanAlertCodes))
      if (crpt && crpt.fraudIdScanAlertCodes!.length > 0) {
        const hits = crpt.fraudIdScanAlertCodes!
          .filter(c => c.code !== '8')
          .map(c => c.description!)
        if (!isEmpty(hits)) {
          fraud = hits
        }
      }
    }
    return fraud
  }

  /*
   * Function to look at the public records of the TransUnion data and
   * return a string[] of all the records - mostly Bankruptcies - that
   * are on this credit report.
   */
  bankruptcies(rpt: CreditReport): string[] | undefined {
    let ans
    const base = rpt?.consumers?.equifaxUsConsumerCreditReport
    if (Array.isArray(base) && base.length > 0) {
      const crpt = base.find(itm => Array.isArray(itm.bankruptcies))
      if (crpt && crpt.bankruptcies!.length > 0) {
        ans = crpt.bankruptcies!
          .map(bk => `[${bk.dateFiled}] ${bk.currentIntentOrDispositionCode.description!}`)
      }
    }
    return ans
  }
}
