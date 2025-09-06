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
					class="lg:pt-(--ui-header-height) pb-4 sm:pb-6"
					:spacing-offset="160"
				>
					<template #content="{ message }">
						<div class="space-y-4">
							<template v-for="(part, index) in message.parts" :key="`${part.type}-${index}-${message.id}`">
								<UButton
									v-if="part.type === 'reasoning' && part.state !== 'done'"
									label="Thinking..."
									variant="link"
									color="neutral"
									class="p-0"
									loading
								/>
							</template>
							<MDCCached
								:value="getTextFromMessage(message)"
								:cache-key="message.id"
								unwrap="p"
								:components="components"
								:parser-options="{ highlight: false }"
							/>
						</div>
					</template>
				</UChatMessages>

				<div
					v-if="showTwitterForm || showPostSelector"
					class="absolute inset-0 flex justify-center items-center bg-accented/15 backdrop-blur-sm"
				>
					<!-- Twitter Profile Form -->
					<TwitterProfileForm
						v-if="showTwitterForm"
						@submit="handleProfileSubmit"
					/>

					<!-- Twitter Post Selector -->
					<TwitterPostSelector
						v-if="showPostSelector"
						:posts="generatedPosts"
						:posting="postingToTwitter"
						@select="handlePostSelect"
						@regenerate="handleRegenerate"
					/>
				</div>

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
						<div class="w-full flex items-between gap-4">
							<ModelSelect v-model="model" />
							<UButton
								v-if="!showTwitterForm && !showPostSelector /* && twitter.isConnected.value */"
								variant="solid"
								color="primary"
								icon="i-simple-icons-twitter"
								label="Birdy won't tweet? Let me chirp!"
								class="ml-auto"
								@click="showTwitterForm = true"
							/>
						</div>
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
import TwitterPostSelector from '../../components/TwitterPostSelector.vue'
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
const showTwitterForm = ref(false)
const showPostSelector = ref(false)
const generatedPosts = ref<string[]>([])
const postingToTwitter = ref(false)
const currentProfile = ref<TwitterProfile | null>(null)

const { data } = await useFetch(`/api/chats/${route.params.id}`, {
	cache: 'force-cache'
})

if (!data.value) {
	throw createError({ statusCode: 404,
		statusMessage: 'Chat not found',
		fatal: true })
}

const input = ref('')

const chat = new Chat({
	id: data.value.id,
	messages: data.value.messages,
	transport: new DefaultChatTransport({
		api: `/api/chats/${data.value.id}`,
		body: {
			model: model.value
		}
	}),
	onFinish() {
		refreshNuxtData('chats')
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

// Watch for Twitter connection status
watchEffect(() => {
	if (twitter.isConnected.value && !currentProfile.value) {
		showTwitterForm.value = true
	}
})

async function handleProfileSubmit(profile: TwitterProfile) {
	currentProfile.value = profile
	twitter.updateProfile(profile)
	showTwitterForm.value = false

	// Generate AI posts with enhanced system prompt
	const systemPrompt = twitter.generateSystemPrompt(profile)

	chat.sendMessage({
		text: systemPrompt
	})

	// Wait for AI response and parse it
	// We'll watch for new messages instead of using the private onFinish
	watch(() => chat.messages.length, () => {
		const lastMessage = chat.messages[chat.messages.length - 1]
		if (lastMessage?.role === 'assistant' && currentProfile.value) {
			const textContent = getTextFromMessage(lastMessage)
			const posts = twitter.parseAIResponse(textContent)

			if (posts.length > 0) {
				generatedPosts.value = posts
				showPostSelector.value = true
			}
		}
	})
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

		showPostSelector.value = false
		generatedPosts.value = []
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
		handleProfileSubmit(currentProfile.value)
	}
}

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
	if (data.value?.messages.length === 1) {
		chat.regenerate()
	}

	// Refresh Twitter session on mount
	twitter.refreshSession()
})
</script>
