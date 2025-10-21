import type { UIMessage } from 'ai'
import type { TwitterProfile } from './twitter'

/**
 * Custom message part types for Twitter agent
 */
export type TwitterMessagePartType = 'twitter_profile_form' | 'twitter_post_selector' | 'twitter_post_card'

/**
 * Custom message part for Twitter profile form
 */
export interface TwitterProfileFormPart {
	type: 'twitter_profile_form'
	data?: Record<string, unknown>
}

/**
 * Custom message part for Twitter post selector
 */
export interface TwitterPostSelectorPart {
	type: 'twitter_post_selector'
	data: {
		posts: string[]
		profile?: TwitterProfile
	}
}

/**
 * Custom message part for a single Twitter post card
 */
export interface TwitterPostCardPart {
	type: 'twitter_post_card'
	data: {
		content: string
		variant?: number
	}
}

/**
 * Union of all Twitter custom message parts
 */
export type TwitterMessagePart = TwitterProfileFormPart | TwitterPostSelectorPart | TwitterPostCardPart

/**
 * Helper to check if a message has Twitter custom parts
 */
export function hasTwitterPart(message: UIMessage, type: TwitterMessagePartType): boolean {
	return message.parts?.some((part: any) => part.type === type) ?? false
}

/**
 * Helper to get Twitter parts from a message
 */
export function getTwitterParts<T extends TwitterMessagePart>(
	message: UIMessage,
	type: TwitterMessagePartType
): T[] {
	return (message.parts?.filter((part: any) => part.type === type) ?? []) as unknown as T[]
}
