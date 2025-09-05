export interface TwitterProfile {
	genre: string
	age: number
	artistType: 'solo' | 'band' | 'duo'
	instruments: string[]
	audience: string
	tone: 'professional' | 'fun' | 'edgy'
}

export interface TwitterPost {
	id: string
	content: string
	selected?: boolean
}

export interface TwitterAuthTokens {
	accessToken: string
	accessSecret: string
	userId: string
	screenName: string
}

export interface TwitterConfig {
	profile: TwitterProfile
	connected: boolean
	tokens?: TwitterAuthTokens
}
