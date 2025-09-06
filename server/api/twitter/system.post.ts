export default defineEventHandler(async event => {
	const body = await readBody<{ system?: string }>(event)
	if (!body?.system || typeof body.system !== 'string') {
		throw createError({
			statusCode: 400,
			statusMessage: 'Missing system prompt'
		})
	}

	const session = await getUserSession(event)
	await setUserSession(event, {
		...session,
		twitterSystemPrompt: body.system
	})

	return { ok: true }
})
