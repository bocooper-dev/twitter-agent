declare module '#auth-utils' {
	interface User {
		id: string
		name: string
		email: string
		avatar: string
		username: string
		provider: 'github'
		providerId: number
	}

	interface UserSession {
		user?: User
		twitter?: {
			accessToken: string
			accessSecret: string
			userId: string
			screenName: string
		}
		twitterOAuth?: {
			token: string
			secret: string
		}
	}
}

export { }
