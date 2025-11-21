import type {
	TwitterConfig,
	TwitterProfile
} from '../../shared/types/twitter'

// Maps each tone to [Variant1, Variant2, Variant3] descriptions
const TONE_VARIANT_MAP: Record<string, [string, string, string]> = {
	professional: [ 'Industry insight or achievement', 'Behind-the-scenes content', 'Gratitude or community focus' ],
	fun: [ 'Relatable musician humor', 'Playful observation', 'Light-hearted music content' ],
	edgy: [ 'Bold artistic statement', 'Rebellious or authentic take', 'Raw, unfiltered perspective' ],
	dramatic: [ 'Intense emotional revelation', 'Theatrical process reveal', 'Epic artistic declaration' ],
	romantic: [ 'Heartfelt love declaration', 'Passionate music dedication', 'Tender musical moment' ],
	whimsical: [ 'Magical creative daydream', 'Playful creative adventure', 'Fanciful sound experiment' ],
	quirky: [ 'Oddly charming observation', 'Unconventional studio moment', 'Endearingly weird insight' ],
	absurd: [ 'Nonsensical artistic manifesto', 'Surreal creative process', 'Logic-defying creative statement' ],
	sarcastic: [ 'Witty industry criticism', 'Deadpan music commentary', 'Mockingly appreciative post' ],
	poetic: [ 'Lyrical artistic expression', 'Metaphorical sound journey', 'Eloquent artistic meditation' ],
	mysterious: [ 'Cryptic creative hint', 'Enigmatic project tease', 'Shadowy creative revelation' ],
	inspirational: [ 'Motivational artistic journey', 'Uplifting creative message', 'Empowering artistic wisdom' ],
	nostalgic: [ 'Wistful memory reflection', 'Vintage sound exploration', 'Bittersweet musical memory' ],
	humorous: [ 'Clever music joke', 'Self-deprecating music humor', 'Absurd musical anecdote' ],
	casual: [ 'Laid-back studio update', 'Everyday creative moment', 'Chill creative sharing' ]
}

const DEFAULT_VARIANT_DESCRIPTIONS: [string, string, string] = [
	'Detached creative observation',
	'Indifferent artistic update',
	'Emotionally distant content'
]

function getVariantDescription(tone: string, variantIndex: 0 | 1 | 2): string {
	return TONE_VARIANT_MAP[tone]?.[variantIndex] ?? DEFAULT_VARIANT_DESCRIPTIONS[variantIndex]
}

export function useTwitter() {
	const twitterConfig = ref<TwitterConfig>({
		profile: {
			genre: '',
			age: 25,
			artistType: 'solo',
			instruments: [],
			audience: '',
			tone: 'professional'
		},
		connected: false
	})

	const sessionData = ref<any>(null)

	// Fetch session data
	const refreshSession = async () => {
		try {
			sessionData.value = await $fetch('/api/_auth/session')
		} catch (error) {
			console.error('Failed to fetch session:', error)
		}
	}

	// Check if Twitter is connected from session
	const isConnected = computed(() => {
		return !!(sessionData.value?.twitter?.accessToken)
	})

	// Update connected status
	watchEffect(() => {
		twitterConfig.value.connected = isConnected.value
		if (isConnected.value && sessionData.value?.twitter) {
			twitterConfig.value.tokens = sessionData.value.twitter
		}
	})

	// Initial load
	onMounted(refreshSession)

	async function connectTwitter() {
		try {
			const result = await $fetch('/api/auth/twitter/login', {
				method: 'POST'
			})

			if (result?.authUrl) {
				window.location.href = result.authUrl
			}
		} catch (error) {
			console.error('Twitter connect error:', error)
			throw error
		}
	}

	async function postToTwitter(content: string) {
		try {
			const result = await $fetch('/api/twitter/post', {
				method: 'POST',
				body: { content }
			})
			return result
		} catch (error) {
			console.error('Twitter post error:', error)
			throw error
		}
	}

	function updateProfile(profile: TwitterProfile) {
		twitterConfig.value.profile = { ...profile }
	}

	function generateSystemPrompt(profile: TwitterProfile): string {
		const basePrompt = `
			You are an AI social media manager for a ${profile.artistType} ${profile.genre} artist.
			Artist Profile:
			- Genre: ${profile.genre}
			- Age: ${profile.age}
			- Type: ${profile.artistType}
			- Instruments/Role: ${profile.instruments.join(', ')}
			- Target Audience: ${profile.audience}
			- Voice Tone: ${profile.tone}

			Based on this profile, generate engaging Twitter posts that:
			1. Stay under 280 characters
			2. Match the ${profile.tone} tone
			3. Appeal to ${profile.audience}
			4. Reflect the ${profile.genre} music scene
			5. Are authentic to a ${profile.age}-year-old ${profile.artistType} artist

			Generate exactly 3 different post variants with different approaches:
			- Variant 1: ${getVariantDescription(profile.tone, 0)}
			- Variant 2: ${getVariantDescription(profile.tone, 1)}
			- Variant 3: ${getVariantDescription(profile.tone, 2)}

			Format your response as:
			VARIANT 1: [post content]
			VARIANT 2: [post content]
			VARIANT 3: [post content]
		`
		return basePrompt
	}

	function parseAIResponse(response: string): string[] {
		if (!response) return []
		// Robustly parse variants labeled like "VARIANT 1:" (colon optional), case-insensitive, even if labels run together without newlines.
		const regex = /variant\s*(\d+)\s*:?\s*([\s\S]*?)(?=variant\s*\d+\s*:?|$)/gi
		const results: string[] = []
		let match: RegExpExecArray | null
		while ((match = regex.exec(response)) !== null) {
			const content = (match[2] || '').trim()
			if (content) results.push(content.substring(0, 280))
			if (results.length >= 3) break
		}
		// Fallback: try numbered list formatting like "1) ...", "1. ..." or new line splits
		if (results.length === 0) {
			const fallback = response
				.split(/\n\s*(?:\d+[).]|[-•])\s+/)
				.map(s => s.trim())
				.filter(Boolean)
				.slice(0, 3)
				.map(s => s.substring(0, 280))
			results.push(...fallback)
		}
		// Last resort: split on the word VARIANT regardless of format
		if (results.length === 0 && /variant\s*\d+/i.test(response)) {
			const parts = response.split(/variant\s*\d+\s*:?/i).map(s => s.trim()).filter(Boolean)
			results.push(...parts.slice(0, 3).map(s => s.substring(0, 280)))
		}
		return results.slice(0, 3)
	}

	return {
		twitterConfig: readonly(twitterConfig),
		isConnected,
		connectTwitter,
		postToTwitter,
		updateProfile,
		generateSystemPrompt,
		parseAIResponse,
		refreshSession
	}
}
