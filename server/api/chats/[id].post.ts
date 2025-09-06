import { gateway } from '@ai-sdk/gateway'
import type { UIMessage } from 'ai'
import {
	convertToModelMessages,
	createUIMessageStream,
	createUIMessageStreamResponse,
	generateText,
	streamText
} from 'ai'
import { z } from 'zod'

defineRouteMeta({
	openAPI: {
		description: 'Chat with AI.',
		tags: [ 'ai' ]
	}
})

export default defineEventHandler(async event => {
	const session = await getUserSession(event)

	const { id } = getRouterParams(event)

	const {
		model, messages, system
	} = await readValidatedBody(event, z.object({
		model: z.string(),
		messages: z.array(z.custom<UIMessage>()),
		system: z.string().optional()
	}).parse)

	const db = useDrizzle()

	const chat = await db.query.chats.findFirst({
		where: (chat, { eq }) => and(eq(chat.id, id as string), eq(chat.userId, session.user?.id || session.id)),
		with: {
			messages: true
		}
	})
	if (!chat) {
		throw createError({ statusCode: 404,
			statusMessage: 'Chat not found' })
	}

	if (!chat.title) {
		const { text: title } = await generateText({
			model: gateway('openai/gpt-5-nano'),
			system: `You are a title generator for a chat:
					- Generate a short title based on the first user's message
					- The title should be less than 30 characters long
					- The title should be a summary of the user's message
					- Do not use quotes (' or ") or colons (:) or any other punctuation
					- Do not use markdown, just plain text`,
			prompt: JSON.stringify(messages[0])
		})

		setHeader(event, 'X-Chat-Title', title.replace(/:/g, '').split('\n')[0])
		await db.update(tables.chats).set({ title }).where(eq(tables.chats.id, id as string))
	}

	const lastMessage = messages[messages.length - 1]
	if (lastMessage?.role === 'user' && messages.length > 1) {
		await db.insert(tables.messages).values({
			chatId: id as string,
			role: 'user',
			parts: lastMessage.parts
		})
	}

	// Determine effective system prompt before streaming begins
	const sessionSystem = (session as any).twitterSystemPrompt as string | undefined
	const effectiveSystem = system || sessionSystem || 'You are a helpful assistant that can answer questions and help.'

	// If consuming a one-time system prompt from session, clear it now (before headers are sent)
	if (!system && sessionSystem) {
		await setUserSession(event, {
			...session,
			twitterSystemPrompt: undefined
		})
	}

	const stream = createUIMessageStream({
		execute: ({ writer }) => {
			const result = streamText({
				model: gateway(model),
				system: effectiveSystem,
				messages: convertToModelMessages(messages)
			})

			writer.merge(result.toUIMessageStream())
		},
		onFinish: async ({ messages }) => {
			await db.insert(tables.messages).values(messages.map(message => ({
				chatId: chat.id,
				role: message.role as 'user' | 'assistant',
				parts: message.parts
			})))
		}
	})

	return createUIMessageStreamResponse({
		stream
	})
})
