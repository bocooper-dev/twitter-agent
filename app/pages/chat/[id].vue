<template>
	<UDashboardPanel id="chat" class="relative" :ui="{ body: 'p-0 sm:p-0' }">
		<template #header>
			<DashboardNavbar>
				<template #right>
					<!-- Twitter Connect Button -->
					<UButton
						v-if="!twitter.isConnected.value"
						color="blue"
						variant="soft"
						icon="i-simple-icons-twitter"
						:loading="connectingTwitter"
						@click="connectToTwitter"
					>
						Connect Twitter
					</UButton>
					<div
						v-else
						class="flex items-center gap-2 text-sm text-green-600 dark:text-green-400"
					>
						<UIcon name="i-lucide-check-circle" class="w-4 h-4" />
						<span>
							Twitter Connected
						</span>
					</div>
				</template>
			</DashboardNavbar>
		</template>

		<template #body>
			<UContainer class="relative flex-1 flex flex-col gap-4 sm:gap-6">
				<UChatMessages
					:messages="chat.messages"
					:status="chat.status"
					:assistant="{ actions: [{ label: 'Copy', icon: copied ? 'i-lucide-copy-check' : 'i-lucide-copy', onClick: copy }] }"
					class="lg:pt-(--ui-header-height) pb-4 sm:gap-6"
					:spacing-offset="160"
				>
					<template #content="{ message }">
						<div class="space-y-4">
							<template v-for="(part, index) in message.parts" :key="`${part.type}-${index}-${message.id}`">
								<!-- Reasoning indicator -->
								<UButton
									v-if="part.type === 'reasoning' && part.state !== 'done'"
									label="Thinking..."
									variant="link"
									color="neutral"
									class="p-0"
									loading
								/>

								<!-- Twitter Profile Form Card -->
								<TwitterProfileForm
									v-else-if="isPart(part, 'twitter_profile_form')"
									@submit="handleProfileSubmit"
								/>

								<!-- Twitter Post Selector Card with System Prompt Inspector -->
								<SystemPromptInspector
									v-else-if="isPart(part, 'twitter_post_selector')"
									:posts="getPartData(part).posts || []"
									:posting="postingToTwitter"
									:prompt="latestSystemPrompt"
									@select="handlePostSelect"
									@regenerate="handleRegenerate"
								/>

								<!-- Twitter Post Card (single post) -->
								<UCard v-else-if="isPart(part, 'twitter_post_card')">
									<div class="space-y-2">
										<div class="flex items-center justify-between">
											<span class="text-sm font-medium text-gray-600">
												Variant {{ getPartData(part).variant ?? 1 }}
											</span>
											<span class="text-xs text-gray-500">
												{{ (getPartData(part).content ?? '').length }}/280
											</span>
										</div>
										<p class="text-sm">
											{{ getPartData(part).content ?? '' }}
										</p>
									</div>
								</UCard>
							</template>

							<!-- Standard text content -->
							<MDCCached
								v-if="hasTextContent(message)"
								:value="getTextFromMessage(message)"
								:cache-key="message.id"
								unwrap="p"
								:components="components"
								:parser-options="{ highlight: false }"
							/>
						</div>
					</template>
				</UChatMessages>

				<UChatPrompt
					v-model="input"
					:error="chat.error"
					variant="subtle"
					class="sticky bottom-0 [view-transition-name:chat-prompt] rounded-b-none z-10"
					@submit="handleSubmit"
				>
					<UChatPromptSubmit
						:status="chat.status"
						color="neutral"
						@stop="chat.stop"
						@reload="chat.regenerate"
					/>

					<template #footer>
						<ModelSelect v-model="model" />
					</template>
				</UChatPrompt>
			</UContainer>
		</template>
	</UDashboardPanel>
</template>

<script setup lang="ts">
import { Chat } from '@ai-sdk/vue'
import { getTextFromMessage } from '@nuxt/ui/utils/ai'
import { useClipboard } from '@vueuse/core'
import type { UIMessage } from 'ai'
import { DefaultChatTransport } from 'ai'
import type { DefineComponent } from 'vue'
import type { TwitterProfile } from '../../../shared/types/twitter'
import ProseStreamPre from '../../components/prose/PreStream.vue'
import SystemPromptInspector from '../../components/SystemPromptInspector.vue'
import TwitterProfileForm from '../../components/TwitterProfileForm.vue'

const components = {
	pre: ProseStreamPre as unknown as DefineComponent
}

const route = useRoute()
const toast = useToast()
const clipboard = useClipboard()
const { model } = useModels()

// Twitter functionality
const twitter = useTwitter()
const connectingTwitter = ref(false)
const postingToTwitter = ref(false)
const currentProfile = ref<TwitterProfile | null>(null)
const latestSystemPrompt = ref<string | null>(null)
const sendSystemPrompt = ref(false) // Flag to control when to send the prompt
const input = ref('')

const { data } = await useFetch(`/api/chats/${route.params.id}`, {
	cache: 'force-cache'
})

if (!data.value) {
	throw createError({
		statusCode: 404,
		statusMessage: 'Chat not found',
		fatal: true
	})
}

function normalizePart(part: any) {
	if (part && typeof part.type === 'string' && part.type.startsWith('data-')) {
		return {
			...part,
			type: part.type.slice(5)
		}
	}

	return part
}

function isPart(part: any, type: string) {
	if (!part || typeof part.type !== 'string') {
		return false
	}

	return part.type === type || part.type === `data-${type}`
}

function getPartData(part: any) {
	return part?.data ?? {}
}

// Transform messages for Chat component
const transformedMessages = (data.value.messages || []).map((msg: any) => ({
	id: msg.id,
	role: msg.role,
	parts: (msg.parts || [
		{
			type: 'text',
			text: msg.content || ''
		}
	]).map(normalizePart),
	createdAt: new Date(msg.createdAt)
}))

const chat = new Chat({
	id: data.value.id,
	messages: transformedMessages,
	transport: new DefaultChatTransport({
		api: `/api/chats/${data.value.id}`,
		body: () => ({
			model: model.value,
			// Only send system prompt when the flag is set
			system: sendSystemPrompt.value ? latestSystemPrompt.value || undefined : undefined
		})
	}),
	onFinish() {
		refreshNuxtData('chats')
		// Clear the flag after the message is sent
		sendSystemPrompt.value = false
	},
	onError(error) {
		const { message } = typeof error.message === 'string' && error.message[0] === '{' ? JSON.parse(error.message) : error
		toast.add({
			description: message,
			icon: 'i-lucide-alert-circle',
			color: 'error',
			duration: 0
		})
	}
})

function handleSubmit(e: Event) {
	e.preventDefault()
	if (input.value.trim()) {
		chat.sendMessage({
			text: input.value
		})
		input.value = ''
	}
}

const copied = ref(false)

function copy(e: MouseEvent, message: UIMessage) {
	clipboard.copy(getTextFromMessage(message))
	copied.value = true
	setTimeout(() => {
		copied.value = false
	}, 2000)
}

onMounted(() => {
	// Auto-regenerate if there's exactly 1 message (initial user message)
	// This will trigger the server to send the profile form
	if (data.value?.messages.length === 1) {
		chat.regenerate()
	}
})

// Twitter functions
async function connectToTwitter() {
	connectingTwitter.value = true
	try {
		await twitter.connectTwitter()
	} catch {
		toast.add({
			description: 'Failed to connect to Twitter',
			icon: 'i-lucide-alert-circle',
			color: 'error'
		})
	} finally {
		connectingTwitter.value = false
	}
}

async function handleProfileSubmit(profile: TwitterProfile) {
	currentProfile.value = profile
	twitter.updateProfile(profile)

	// Generate AI posts with enhanced system prompt
	const systemPrompt = twitter.generateSystemPrompt(profile)
	latestSystemPrompt.value = systemPrompt

	// Set flag to send the system prompt with the next message
	sendSystemPrompt.value = true

	// Send message to trigger post generation
	// The system prompt will be sent via the transport body function
	chat.sendMessage({ text: 'Generate 3 tweet variants.' })

	// Note: We keep the system prompt in latestSystemPrompt so the inspector can display it
	// It will be cleared when a new profile is submitted
}

async function handlePostSelect(post: string) {
	postingToTwitter.value = true

	try {
		await twitter.postToTwitter(post)

		toast.add({
			description: 'Successfully posted to Twitter!',
			icon: 'i-lucide-check-circle',
			color: 'success'
		})

		// Add success message to chat
		chat.sendMessage({
			text: `✅ Posted to Twitter: "${post}"`
		})
	} catch {
		toast.add({
			description: 'Failed to post to Twitter',
			icon: 'i-lucide-alert-circle',
			color: 'error'
		})
	} finally {
		postingToTwitter.value = false
	}
}

function handleRegenerate() {
	if (currentProfile.value) {
		// Set the system prompt again before regenerating
		const systemPrompt = twitter.generateSystemPrompt(currentProfile.value)
		latestSystemPrompt.value = systemPrompt

		// Set flag to send the system prompt with the next message
		sendSystemPrompt.value = true

		// Send message to trigger post generation
		chat.sendMessage({ text: 'Generate 3 tweet variants.' })

		// Note: Keep the system prompt for the inspector
	}
}

// Helper: check if message has text content to render
function hasTextContent(message: UIMessage): boolean {
	return message.parts?.some((part: any) =>
		part.type === 'text' && part.text
	) ?? false
}
</script>
