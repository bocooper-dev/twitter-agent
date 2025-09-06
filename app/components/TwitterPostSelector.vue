<!-- Add right click context menu UContextMenu to Post Cards. https://ui.nuxt.com/raw/components/context-menu.md -->
<template>
	<UCard>
		<template #header>
			<div class="flex items-center gap-2">
				<UIcon name="i-lucide-twitter" class="w-5 h-5 text-blue-500" />
				<h3 class="text-lg font-semibold">
					Choose Your Twitter Post
				</h3>
			</div>
		</template>

		<div class="space-y-4">
			<p class="text-sm text-gray-600 dark:text-gray-400">
				Select one of the generated posts to share on Twitter:
			</p>

			<div
				v-for="(post, index) in posts"
				:key="index"
				class="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
				:class="{ 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20': selectedIndex === index }"
				@click="selectedIndex = index"
			>
				<div class="flex items-start gap-3">
					<URadioGroup
						:model-value="selectedIndex === index"
						:name="`post-${index}`"
						:items="[{ label: '', value: true }]"
						class="mt-1"
					/>
					<div class="flex-1">
						<p class="text-sm leading-relaxed">
							{{ post }}
						</p>
						<div class="flex items-center justify-between mt-2 text-xs text-gray-500">
							<span>
								Variant {{ index + 1 }}
							</span>
							<span>
								{{ post.length }}/280 characters
							</span>
						</div>
					</div>
				</div>
			</div>

			<div class="flex gap-3 pt-4">
				<UButton
					variant="outline"
					@click="$emit('regenerate')"
				>
					Generate New Posts
				</UButton>
				<UButton
					:disabled="selectedIndex === null"
					:loading="posting"
					@click="postToTwitter"
				>
					<UIcon name="i-simple-icons-twitter" class="w-4 h-4 mr-2" />
					Post to Twitter
				</UButton>
			</div>
		</div>
	</UCard>
</template>

<script setup lang="ts">
interface Props {
	posts: string[]
	posting?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
	select: [post: string]
	regenerate: []
}>()

const selectedIndex = ref<number | null>(null)

function postToTwitter() {
	if (selectedIndex.value !== null) {
		const selectedPost = props.posts[selectedIndex.value]
		if (selectedPost) {
			emit('select', selectedPost)
		}
	}
}
</script>
