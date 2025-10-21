export default defineEventHandler(async event => {
	const session = await getUserSession(event)

	const { input } = await readBody(event)
	const db = useDrizzle()

	// Clear any stale Twitter system prompt when creating a new chat
	if ((session as any).twitterSystemPrompt || (session as any).twitterSystemPrompts) {
		await setUserSession(event, {
			...session,
			twitterSystemPrompt: undefined,
			twitterSystemPrompts: undefined
		})
	}

	const [ chat ] = await db.insert(tables.chats).values({
		title: '',
		userId: session.user?.id || session.id
	}).returning()
	if (!chat) {
		throw createError({ statusCode: 500,
			statusMessage: 'Failed to create chat' })
	}

	await db.insert(tables.messages).values({
		chatId: chat.id,
		role: 'user',
		parts: [ { type: 'text',
			text: input } ]
	})

	return chat
})
