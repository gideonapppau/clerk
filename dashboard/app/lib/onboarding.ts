import { getWhatsAppStatus, listInventory } from '@/lib/api'

const ONBOARDING_DONE_KEY = 'clerk_onboarding_done'

export const ONBOARDING_STEPS = [
  { id: 1, label: 'Account' },
  { id: 2, label: 'WhatsApp' },
  { id: 3, label: 'Products' },
  { id: 4, label: 'Go live' },
  { id: 5, label: 'Community' },
] as const

export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number]['id']

export function markOnboardingDone(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ONBOARDING_DONE_KEY, '1')
}

export function isOnboardingMarkedDone(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(ONBOARDING_DONE_KEY) === '1'
}

export function clearOnboardingDone(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ONBOARDING_DONE_KEY)
}

export function isSetupComplete(waConnected: boolean, productCount: number): boolean {
  return waConnected && productCount > 0
}

export function suggestOnboardingStep(waConnected: boolean, productCount: number): OnboardingStepId {
  if (!waConnected) return 2
  if (productCount === 0) return 3
  if (productCount > 0 && waConnected) return 5
  return 4
}

/** After sign-in: skip onboarding when setup is already complete on the server. */
export async function resolvePostAuthDestination(): Promise<'/dashboard' | '/onboarding'> {
  if (isOnboardingMarkedDone()) return '/dashboard'

  try {
    const [inv, wa] = await Promise.all([
      listInventory(),
      getWhatsAppStatus().catch(() => null),
    ])
    const connected = wa?.connected === true
    const productCount = inv.items?.length ?? 0
    if (connected && productCount > 0) {
      return '/dashboard'
    }
  } catch {
    // Fall through to onboarding if profile can't be loaded yet.
  }

  return '/onboarding'
}
