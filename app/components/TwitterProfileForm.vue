<template>
	<UCard>
		<template #header>
			<div class="flex items-center gap-2">
				<UIcon name="i-simple-icons-twitter" class="w-5 h-5 text-blue-500" />
				<h3 class="text-lg font-semibold">
					Configure Your Music Profile
				</h3>
			</div>
		</template>

		<UForm
			class="space-y-6 min-w-xs"
			:schema="schema"
			:state="state"
			@submit.prevent="submitForm"
		>
			<UFormField
				label="Music Genre"
				required
			>
				<USelect
					v-model="state.genre"
					:items="genreOptions"
					placeholder="Select your music genre"
				/>
			</UFormField>

			<UFormField
				label="Your Age (Mentally)"
				required
			>
				<div class="flex items-center gap-2">
					<UInput
						v-model.number="state.age"
						type="number"
						min="16"
						max="100"
						placeholder="25"
					/>
					<div
						v-if="state.age > 60"
						class="text-sm text-gray-500"
					>
						Damn gramps, get off my lawn!
					</div>
				</div>
			</UFormField>

			<UFormField
				label="Project Size"
				required
			>
				<URadioGroup
					v-model="state.artistType"
					:items="artistTypeOptions"
				/>
			</UFormField>

			<UFormField
				label="Instruments/Role"
				required
			>
				<UCheckboxGroup
					v-model="state.instruments"
					:items="instrumentOptions"
				/>
			</UFormField>

			<UFormField
				label="Target Audience"
				required
			>
				<USelect
					v-model="state.audience"
					:items="audienceOptions"
					placeholder="Select your target audience"
				/>
			</UFormField>

			<UFormField
				label="Voice Tone"
				required
			>
				<USelect
					v-model="state.tone"
					:items="toneOptions"
					placeholder="What mood do you want to convey?"
				/>
			</UFormField>

			<UButton
				type="submit"
				block
				:loading="loading"
			>
				Generate Twitter Posts
			</UButton>
		</UForm>
	</UCard>
</template>

<script setup lang="ts">
import * as z from 'zod'
import type { TwitterProfile } from '../../shared/types/twitter'

const emit = defineEmits<{
	submit: [profile: TwitterProfile]
}>()

const schema = z.object({
	genre: z.string().min(1, 'Genre is required'),
	age: z.number().min(16, 'Age must be at least 16').max(100, 'Age must be less than 100'),
	artistType: z.string().min(1, 'Artist type is required'),
	instruments: z.array(z.string()).min(1, 'Select at least one instrument or role'),
	audience: z.string().min(1, 'Target audience is required'),
	tone: z.string().min(1, 'Voice tone is required')
})

type Schema = z.output<typeof schema>

const state = reactive<Schema>({
	genre: '',
	age: 25,
	artistType: '',
	instruments: [],
	audience: '',
	tone: ''
})

const loading = ref(false)

const artistTypeOptions = ref([
	{
		value: 'solo',
		label: 'Solo Artist'
	},
	{
		value: 'band',
		label: 'Band'
	},
	{
		value: 'duo',
		label: 'Duo'
	},
	{
		value: '3 squirrels in a trench coat',
		label: '3 Squirrels in a Trench Coat'
	}
])

const genreOptions = ref([
	'Pop',
	'Rock',
	'Metal',
	'Hip-Hop',
	'Electronic/EDM',
	'Dubstep',
	'Trance',
	'Techno',
	'Country',
	'R&B',
	'Folk',
	'Jazz',
	'Reggae',
	'Alternative',
	'Indie',
	'Classical',
	'Blues',
	'Punk'
])

const instrumentOptions = ref([
	'Vocals',
	'Guitar',
	'Bass',
	'Drums',
	'Piano/Keyboard',
	'DJ',
	'Producer',
	'Violin',
	'Saxophone',
	'Trumpet'
])

const audienceOptions = ref([
	'Teens (13-17)',
	'Young Adults (18-25)',
	'Adults (26-35)',
	'Middle-aged (36-50)',
	'Music Enthusiasts',
	'General Audience',
	'Vampires'
])

const toneOptions = ref([
	{
		value: 'professional',
		label: 'Professional'
	},
	{
		value: 'fun',
		label: 'Fun'
	},
	{
		value: 'edgy',
		label: 'Edgy'
	},
	{
		value: 'dramatic',
		label: 'Dramatic'
	},
	{
		value: 'romantic',
		label: 'Romantic'
	},
	{
		value: 'whimsical',
		label: 'Whimsical'
	},
	{
		value: 'quirky',
		label: 'Quirky'
	},
	{
		value: 'absurd',
		label: 'Absurd'
	},
	{
		value: 'sarcastic',
		label: 'Sarcastic'
	},
	{
		value: 'poetic',
		label: 'Poetic'
	},
	{
		value: 'mysterious',
		label: 'Mysterious'
	},
	{
		value: 'inspirational',
		label: 'Inspirational'
	},
	{
		value: 'nostalgic',
		label: 'Nostalgic'
	},
	{
		value: 'humorous',
		label: 'Humorous'
	},
	{
		value: 'casual',
		label: 'Casual'
	},
	{
		value: 'apathetic',
		label: 'Apathetic'
	}
])

async function submitForm() {
	if (!schema.safeParse(state).success) return

	loading.value = true
	try {
		emit('submit', { ...(state as TwitterProfile) })
	} finally {
		loading.value = false
	}
}
</script>
