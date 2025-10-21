<template>
	<div class="flex flex-col gap-3">
		<TwitterPostSelector
			v-if="showPostSelector && posts.length"
			:posts="posts"
			:posting="posting"
			@select="emit('select', $event)"
			@regenerate="emit('regenerate')"
		/>

		<div v-if="hasPrompt || posts.length">
			<div class="flex items-center gap-2">
				<UButton
					variant="ghost"
					color="neutral"
					icon="i-lucide-eye"
					label="Inspect system prompt"
					:disabled="!hasPrompt"
					@click="togglePrompt"
				/>
				<span v-if="showSystemPrompt && hasPrompt" class="text-xs text-muted">
					(debug)
				</span>
			</div>
			<UCard v-if="showSystemPrompt && hasPrompt" class="mt-2">
				<pre class="text-xs whitespace-pre-wrap">
					{{ prompt }}
				</pre>
			</UCard>
		</div>
	</div>
</template>

<script setup lang="ts">
import {
	computed,
	ref,
	watch
} from 'vue'
import TwitterPostSelector from './TwitterPostSelector.vue'

const props = withDefaults(defineProps<{
	posts?: string[]
	prompt?: string | null
	posting?: boolean
	showPostSelector?: boolean
}>(), {
	posts: () => [],
	prompt: null,
	posting: false,
	showPostSelector: true
})

const emit = defineEmits<{
	select: [value: string]
	regenerate: []
}>()

const showSystemPrompt = ref(false)
const hasPrompt = computed(() => {
	const value = props.prompt?.trim()
	return !!value
})

watch(
	() => props.posts,
	() => {
		showSystemPrompt.value = false
	}
)

function togglePrompt() {
	if (!hasPrompt.value) {
		return
	}
	showSystemPrompt.value = !showSystemPrompt.value
}

const posts = computed(() => props.posts)
const posting = computed(() => props.posting)
const showPostSelector = computed(() => props.showPostSelector)
const prompt = computed(() => props.prompt ?? '')
</script>
