import { TwitterApi } from 'twitter-api-v2'

export default defineEventHandler(async event => {
	try {
		const body = await readBody(event)
		const { content } = body

		if (!content || typeof content !== 'string') {
			throw createError({
				statusCode: 400,
				statusMessage: 'Missing or invalid content'
			})
		}

		if (content.length > 280) {
			throw createError({
				statusCode: 400,
				statusMessage: 'Content exceeds Twitter character limit'
			})
		}

		const session = await getUserSession(event)
		const twitter = session.twitter as {
			accessToken: string
			accessSecret: string
			userId: string
			screenName: string
		} | undefined

		if (!twitter?.accessToken || !twitter?.accessSecret) {
			throw createError({
				statusCode: 401,
				statusMessage: 'Twitter not connected'
			})
		}

		const client = new TwitterApi({
			appKey: process.env.TWITTER_API_KEY!,
			appSecret: process.env.TWITTER_API_SECRET!,
			accessToken: twitter.accessToken,
			accessSecret: twitter.accessSecret
		})

		const tweet = await client.v2.tweet(content)

		return {
			success: true,
			tweetId: tweet.data.id,
			content
		}
	} catch (error) {
		console.error('Twitter posting error:', error)

		if (error && typeof error === 'object' && 'statusCode' in error) {
			throw error
		}

		throw createError({
			statusCode: 500,
			statusMessage: 'Failed to post to Twitter'
		})
	}
})
