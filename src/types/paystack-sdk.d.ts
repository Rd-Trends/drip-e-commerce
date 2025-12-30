declare module '@paystack/paystack-sdk' {
  export default class Paystack {
    constructor(secretKey: string)

    customer: {
      create(params: CreateCustomerPayload): Promise<{
        status: boolean
        message: string
        data: CreateCustomerResponse
      }>
      fetch(params: { code: string }): Promise<{
        status: boolean
        message: string
        data: FetchCustomerResponse
      }>
      list(params?: { [key: string]: unknown }): Promise<unknown>
    }

    transaction: {
      initialize: (params: InitializeTransactionPayload) => Promise<{
        status: boolean
        message: string
        data: { authorization_url: string; access_code: string; reference: string }
      }>
      verify: (params: { reference: string }) => Promise<{
        status: boolean
        message: string
        data: VerifyTransactionData
      }>
      charge(params: { [key: string]: unknown }): Promise<unknown>
      list(params?: { [key: string]: unknown }): Promise<unknown>
    }
  }
}

type InitializeTransactionPayload = {
  email: string
  amount: number
  currency?: string
  reference?: string
  callback_url?: string
  plan?: string
  invoice_limit?: number
  metadata?: string
  channels?: Array<string>
  split_code?: string
  subaccount?: string
  transaction_charge?: string
  bearer?: string
}

type VerifyTransactionData = {
  id: number
  domain: string
  status: string
  reference: string
  receipt_number: unknown
  amount: number
  message: unknown
  gateway_response: string
  paid_at: string
  created_at: string
  channel: string
  currency: string
  ip_address: string
  metadata: Record<string, unknown>
  log: {
    start_time: number
    time_spent: number
    attempts: number
    errors: number
    success: boolean
    mobile: boolean
    input: Array<unknown>
    history: Array<{
      type: string
      message: string
      time: number
    }>
  }
  fees: number
  fees_split: unknown
  authorization: {
    authorization_code: string
    bin: string
    last4: string
    exp_month: string
    exp_year: string
    channel: string
    card_type: string
    bank: string
    country_code: string
    brand: string
    reusable: boolean
    signature: string
    account_name: unknown
  }
  customer: {
    id: number
    first_name: unknown
    last_name: unknown
    email: string
    customer_code: string
    phone: unknown
    metadata: unknown
    risk_action: string
    international_format_phone: unknown
  }
  plan: unknown
  split: Record<string, unknown>
  order_id: unknown
  paidAt: string
  createdAt: string
  requested_amount: number
  pos_transaction_data: unknown
  source: unknown
  fees_breakdown: unknown
  connect: unknown
  transaction_date: string
  plan_object: Record<string, unknown>
  subaccount: Record<string, unknown>
}

type CreateCustomerPayload = {
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  metadata?: Record<string, unknown>
}

type CreateCustomerResponse = {
  email: string
  integration: number
  domain: string
  customer_code: string
  id: number
  identified: boolean
  identifications: unknown
  createdAt: string
  updatedAt: string
}

type FetchCustomerResponse = {
  transactions: Array<unknown>
  subscriptions: Array<unknown>
  authorizations: Array<{
    authorization_code: string
    bin: string
    last4: string
    exp_month: string
    exp_year: string
    channel: string
    card_type: string
    bank: string
    country_code: string
    brand: string
    reusable: boolean
    signature: string
    account_name: unknown
  }>
  first_name: unknown
  last_name: unknown
  email: string
  phone: unknown
  metadata: unknown
  domain: string
  customer_code: string
  risk_action: string
  id: number
  integration: number
  createdAt: string
  updatedAt: string
  created_at: string
  updated_at: string
  total_transactions: number
  total_transaction_value: Array<unknown>
  dedicated_account: unknown
  identified: boolean
  identifications: unknown
}
