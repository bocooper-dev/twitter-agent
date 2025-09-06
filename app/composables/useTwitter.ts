import type {
  TwitterConfig,
  TwitterProfile
} from '../../shared/types/twitter'

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
      - Variant 1: ${
			profile.tone === 'professional'
				? 'Industry insight or achievement'
				: profile.tone === 'fun'
					? 'Relatable musician humor'
					: profile.tone === 'edgy'
						? 'Bold artistic statement'
						: profile.tone === 'stizzy off the galaxy gas'
							? 'Completely unhinged creative chaos'
							: profile.tone === 'dramatic'
								? 'Intense emotional revelation'
								: profile.tone === 'romantic'
									? 'Heartfelt love declaration'
									: profile.tone === 'whimsical'
										? 'Magical creative daydream'
										: profile.tone === 'quirky'
											? 'Oddly charming observation'
											: profile.tone === 'absurd'
												? 'Nonsensical artistic manifesto'
												: profile.tone === 'sarcastic'
													? 'Witty industry criticism'
													: profile.tone === 'poetic'
														? 'Lyrical artistic expression'
														: profile.tone === 'mysterious'
															? 'Cryptic creative hint'
															: profile.tone === 'inspirational'
																? 'Motivational artistic journey'
																: profile.tone === 'nostalgic'
																	? 'Wistful memory reflection'
																	: profile.tone === 'humorous'
																		? 'Clever music joke'
																		: profile.tone === 'casual'
																			? 'Laid-back studio update'
																			: 'Detached creative observation'
		}

      - Variant 2: ${
			profile.tone === 'professional'
				? 'Behind-the-scenes content'
				: profile.tone === 'fun'
					? 'Playful observation'
					: profile.tone === 'edgy'
						? 'Rebellious or authentic take'
						: profile.tone === 'stizzy off the galaxy gas'
							? 'Reality-bending studio experiment'
							: profile.tone === 'dramatic'
								? 'Theatrical process reveal'
								: profile.tone === 'romantic'
									? 'Passionate music dedication'
									: profile.tone === 'whimsical'
										? 'Playful creative adventure'
										: profile.tone === 'quirky'
											? 'Unconventional studio moment'
											: profile.tone === 'absurd'
												? 'Surreal creative process'
												: profile.tone === 'sarcastic'
													? 'Deadpan music commentary'
													: profile.tone === 'poetic'
														? 'Metaphorical sound journey'
														: profile.tone === 'mysterious'
															? 'Enigmatic project tease'
															: profile.tone === 'inspirational'
																? 'Uplifting creative message'
																: profile.tone === 'nostalgic'
																	? 'Vintage sound exploration'
																	: profile.tone === 'humorous'
																		? 'Self-deprecating music humor'
																		: profile.tone === 'casual'
																			? 'Everyday creative moment'
																			: 'Indifferent artistic update'
		}

      - Variant 3: ${
			profile.tone === 'professional'
				? 'Gratitude or community focus'
				: profile.tone === 'fun'
					? 'Light-hearted music content'
					: profile.tone === 'edgy'
						? 'Raw, unfiltered perspective'
						: profile.tone === 'stizzy off the galaxy gas'
							? 'Interdimensional fan appreciation'
							: profile.tone === 'dramatic'
								? 'Epic artistic declaration'
								: profile.tone === 'romantic'
									? 'Tender musical moment'
									: profile.tone === 'whimsical'
										? 'Fanciful sound experiment'
										: profile.tone === 'quirky'
											? 'Endearingly weird insight'
											: profile.tone === 'absurd'
												? 'Logic-defying creative statement'
												: profile.tone === 'sarcastic'
													? 'Mockingly appreciative post'
													: profile.tone === 'poetic'
														? 'Eloquent artistic meditation'
														: profile.tone === 'mysterious'
															? 'Shadowy creative revelation'
															: profile.tone === 'inspirational'
																? 'Empowering artistic wisdom'
																: profile.tone === 'nostalgic'
																	? 'Bittersweet musical memory'
																	: profile.tone === 'humorous'
																		? 'Absurd musical anecdote'
																		: profile.tone === 'casual'
																			? 'Chill creative sharing'
																			: 'Emotionally distant content'
		}

			Format your response as:
			VARIANT 1: [post content]
			VARIANT 2: [post content]
			VARIANT 3: [post content]
		`
		return basePrompt
	}

	function parseAIResponse(response: string): string[] {
		const variants = response.split(/VARIANT \d+:/).filter(v => v.trim())
		return variants.map(v => v.trim()).slice(0, 3)
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
