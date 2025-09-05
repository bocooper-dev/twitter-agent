import { TwitterApi } from 'twitter-api-v2'

export default defineEventHandler(async event => {
	try {
		const query = getQuery(event)
		const {
			oauth_token,
			oauth_verifier
		} = query

		if (!oauth_token || !oauth_verifier) {
			throw createError({
				statusCode: 400,
				statusMessage: 'Missing OAuth parameters'
			})
		}

		const session = await getUserSession(event)
		const twitterOAuth = session.twitterOAuth as {
			token: string
			secret: string
		} | undefined

		if (!twitterOAuth?.token || !twitterOAuth?.secret) {
			throw createError({
				statusCode: 400,
				statusMessage: 'Invalid OAuth session'
			})
		}

		const client = new TwitterApi({
			appKey: process.env.TWITTER_API_KEY!,
			appSecret: process.env.TWITTER_API_SECRET!,
			accessToken: oauth_token as string,
			accessSecret: twitterOAuth.secret
		})

		const login = await client.login(oauth_verifier as string)

		// Store Twitter tokens in session
		await setUserSession(event, {
			...session,
			twitter: {
				accessToken: login.accessToken,
				accessSecret: login.accessSecret,
				userId: login.userId,
				screenName: login.screenName
			},
			twitterOAuth: undefined // Clear temporary OAuth data
		})

		// Redirect back to chat
		await sendRedirect(event, '/')
	} catch (error) {
		console.error('Twitter OAuth callback error:', error)
		// Redirect with error
		await sendRedirect(event, '/?error=twitter_auth_failed')
	}
})
