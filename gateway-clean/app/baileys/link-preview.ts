/**
 * Baileys auto-generates WhatsApp link previews when `link-preview-js` is
 * resolvable (dynamic import inside @whiskeysockets/baileys). Importing it
 * here fails fast at startup if the package is missing from the image.
 */
import { getLinkPreview } from 'link-preview-js'
import { logger } from '../utils/logger'

export async function assertLinkPreviewReady(): Promise<void> {
  if (typeof getLinkPreview !== 'function') {
    throw new Error('link-preview-js did not export getLinkPreview')
  }
  logger.info('link previews enabled (link-preview-js)')
}
