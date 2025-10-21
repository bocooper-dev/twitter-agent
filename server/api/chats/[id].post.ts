import { gateway } from '@ai-sdk/gateway'
import type { UIMessage } from 'ai'
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateObject,
  generateText,
  streamText
} from 'ai'
import { z } from 'zod'

/**
 * Schema for structured tweet generation
 */
const tweetGenerationSchema = z.object({
	posts: z.array(
		z.object({
			content: z.string().max(280).describe('The tweet content, under 280 characters'),
			variant: z.number().int().min(1).max(3).optional().describe('Variant number (1, 2, or 3)'),
			approach: z.string().optional().describe('The approach used for this variant')
		})
	).length(3).describe('Exactly 3 tweet variants')
})

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
	// IMPORTANT: Only use session system prompt if explicitly provided via the system parameter
	// This prevents old session data from bleeding into new chats
	const effectiveSystem = system || 'You are a helpful assistant that can answer questions and help.'

	// Check if this is a tweet generation request (has custom system prompt)
	const isGeneratingTweets = !!system

	// If using a system prompt, clear any stale session data immediately
	if (system) {
		const sessionSystem = (session as any).twitterSystemPrompt as string | undefined
		if (sessionSystem) {
			await setUserSession(event, {
				...session,
				twitterSystemPrompt: undefined
			})
		}
	}

	// Check if this is a new chat that needs a profile form
	// If there's only 1 message (the initial user message) and no system prompt, send profile form
	const needsProfileForm = chat.messages.length === 1 && !system

	if (needsProfileForm) {
		// Send the Twitter profile form for the user to fill out
		const stream = createUIMessageStream({
			execute: ({ writer }) => {
				writer.write({ type: 'start' })
				writer.write({
					type: 'data-twitter_profile_form',
					data: {}
				})
				writer.write({ type: 'finish' })
			},
			onFinish: async ({ messages: finishedMessages }) => {
				if (!finishedMessages.length) {
					return
				}

				const normalizedMessages = finishedMessages.map(message => ({
					...message,
					parts: message.parts.map(part => {
						if (part.type === 'data-twitter_profile_form') {
							return {
								type: 'twitter_profile_form'
							}
						}
						return part
					})
				}))

				await db.insert(tables.messages).values(normalizedMessages.map(message => ({
					chatId: id as string,
					role: message.role as 'assistant' | 'user',
					parts: message.parts
				})))
			}
		})

		return createUIMessageStreamResponse({
			stream
		})
	}

	// If generating tweets, use generateObject for structured output
	if (isGeneratingTweets) {
		try {
			// Generate structured tweet data
			const result = await generateObject({
				model: gateway(model),
				schema: tweetGenerationSchema,
				prompt: `${effectiveSystem}\n\nGenerate 3 tweet variants based on the artist profile provided.`
			})

			const posts = result.object.posts.map(post => post.content)
			const introText = 'I\'ve generated 3 tweet variants for you based on your profile. Choose the one you\'d like to post:'
			const textChunkId = `text-${Math.random().toString(36).slice(2)}`

			const stream = createUIMessageStream({
				execute: ({ writer }) => {
					writer.write({ type: 'start' })
					writer.write({
						type: 'text-start',
						id: textChunkId
					})
					writer.write({
						type: 'text-delta',
						id: textChunkId,
						delta: introText
					})
					writer.write({
						type: 'text-end',
						id: textChunkId
					})
					writer.write({
						type: 'data-twitter_post_selector',
						data: {
							posts
						}
					})
					writer.write({ type: 'finish' })
				},
				onFinish: async ({ messages: finishedMessages }) => {
					if (!finishedMessages.length) {
						return
					}

					const normalizedMessages = finishedMessages.map(message => ({
						...message,
						parts: message.parts.map(part => {
							if (part.type === 'data-twitter_post_selector') {
								return {
									type: 'twitter_post_selector',
									data: (part as any).data
								}
							}
							return part
						})
					}))

					await db.insert(tables.messages).values(normalizedMessages.map(message => ({
						chatId: id as string,
						role: message.role as 'assistant' | 'user',
						parts: message.parts
					})))
				}
			})

			return createUIMessageStreamResponse({
				stream
			})
		} catch (error) {
			console.error('Tweet generation error:', error)
			throw createError({
				statusCode: 500,
				statusMessage: 'Failed to generate tweets'
			})
		}
	}

	// For non-tweet generation, use normal streaming
	const stream = createUIMessageStream({
		execute: ({ writer }) => {
			const result = streamText({
				model: gateway(model),
				system: effectiveSystem,
				messages: convertToModelMessages(messages)
			})

			writer.merge(result.toUIMessageStream())
		},
		onFinish: async ({ messages: finishedMessages }) => {
			// Persist all messages to database
			await db.insert(tables.messages).values(finishedMessages.map(message => ({
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
