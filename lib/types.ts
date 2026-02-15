export type DocumentStatus = 'draft' | 'sent' | 'completed' | 'declined' | 'expired'
export type SignerStatus = 'pending' | 'sent' | 'viewed' | 'signed' | 'declined'
export type FieldType = 'signature' | 'text' | 'date' | 'initials' | 'checkbox'

export interface Profile {
  id: string
  full_name: string | null
  company: string | null
  avatar_url: string | null
  created_at: string
}

export interface Document {
  id: string
  user_id: string
  title: string
  file_url: string | null
  file_name: string | null
  status: DocumentStatus
  is_template: boolean
  template_name: string | null
  created_at: string
  updated_at: string
  expires_at: string | null
  signers?: Signer[]
  signature_fields?: SignatureField[]
}

export interface Signer {
  id: string
  document_id: string
  name: string
  email: string
  sign_order: number
  status: SignerStatus
  token: string
  signed_at: string | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface SignatureField {
  id: string
  document_id: string
  signer_id: string | null
  field_type: FieldType
  page_number: number
  x_position: number
  y_position: number
  width: number
  height: number
  value: string | null
  required: boolean
  created_at: string
}

export interface AuditLog {
  id: string
  document_id: string
  signer_id: string | null
  action: string
  details: string | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
  signer?: Signer
}
