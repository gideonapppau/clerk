export class ReachoutRestrictedError extends Error {
  readonly code = 'WHATSAPP_REACHOUT_RESTRICTED'

  constructor(message: string) {
    super(message)
    this.name = 'ReachoutRestrictedError'
  }
}
