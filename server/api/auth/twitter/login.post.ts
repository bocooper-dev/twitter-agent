import { TwitterApi } from 'twitter-api-v2'

export default defineEventHandler(async event => {
	try {
		const client = new TwitterApi({
			appKey: process.env.TWITTER_API_KEY!,
			appSecret: process.env.TWITTER_API_SECRET!
		})

		const callbackUrl = process.env.TWITTER_CALLBACK_URL || 'http://localhost:3000/api/auth/twitter/callback'

		const authLink = await client.generateAuthLink(callbackUrl)

		// Store oauth token and secret in session for callback
		await setUserSession(event, {
			...await getUserSession(event),
			twitterOAuth: {
				token: authLink.oauth_token,
				secret: authLink.oauth_token_secret
			}
		})

		return {
			authUrl: authLink.url
		}
	} catch (error) {
		console.error('Twitter OAuth error:', error)
		throw createError({
			statusCode: 500,
			statusMessage: 'Failed to initiate Twitter authentication'
		})
	}
})
