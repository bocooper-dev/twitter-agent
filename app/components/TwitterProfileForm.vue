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

		<form
			class="space-y-6"
			@submit.prevent="submitForm"
		>
			<UFormGroup
				label="Music Genre"
				required
			>
				<USelect
					v-model="formData.genre"
					:options="genreOptions"
					placeholder="Select your music genre"
				/>
			</UFormGroup>

			<UFormGroup
				label="Age"
				required
			>
				<UInput
					v-model.number="formData.age"
					type="number"
					min="16"
					max="100"
					placeholder="25"
				/>
			</UFormGroup>

			<UFormGroup
				label="Artist Type"
				required
			>
				<URadioGroup
					v-model="formData.artistType"
					:options="artistTypeOptions"
				/>
			</UFormGroup>

			<UFormGroup
				label="Instruments/Role"
				required
			>
				<UCheckboxGroup
					v-model="formData.instruments"
					:options="instrumentOptions"
				/>
			</UFormGroup>

			<UFormGroup
				label="Target Audience"
				required
			>
				<USelect
					v-model="formData.audience"
					:options="audienceOptions"
					placeholder="Select your target audience"
				/>
			</UFormGroup>

			<UFormGroup
				label="Voice Tone"
				required
			>
				<URadioGroup
					v-model="formData.tone"
					:options="toneOptions"
				/>
			</UFormGroup>

			<UButton
				type="submit"
				block
				:loading="loading"
			>
				Generate Twitter Posts
			</UButton>
		</form>
	</UCard>
</template>

<script setup lang="ts">
import type { TwitterProfile } from '../../shared/types/twitter'

const emit = defineEmits<{
	submit: [profile: TwitterProfile]
}>()

const loading = ref(false)

const formData = reactive<TwitterProfile>({
	genre: '',
	age: 25,
	artistType: 'solo',
	instruments: [],
	audience: '',
	tone: 'professional'
})

const genreOptions = [
	'Pop',
	'Rock',
	'Hip-Hop',
	'Electronic/EDM',
	'Country',
	'R&B',
	'Folk',
	'Jazz',
	'Reggae',
	'Alternative',
	'Indie',
	'Classical'
]

const artistTypeOptions = [
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
	}
]

const instrumentOptions = [
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
]

const audienceOptions = [
	'Teens (13-17)',
	'Young Adults (18-25)',
	'Adults (26-35)',
	'Middle-aged (36-50)',
	'Music Enthusiasts',
	'General Audience'
]

const toneOptions = [
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
	}
]

function isFormValid(): boolean {
	return !!(
		formData.genre
		&& formData.age >= 16
		&& formData.artistType
		&& formData.instruments.length > 0
		&& formData.audience
		&& formData.tone
	)
}

async function submitForm() {
	if (!isFormValid()) return

	loading.value = true
	try {
		emit('submit', { ...formData })
	} finally {
		loading.value = false
	}
}
</script>
