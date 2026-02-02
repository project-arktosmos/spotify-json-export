import { ObjectServiceClass } from '$services/classes/object-service.class';
import { browser } from '$app/environment';
import type { ID } from '$types/core.type';
import type {
	SpotifyTrack,
	SpotifyAlbum,
	SpotifyPlaylist,
	SpotifyPaginatedResponse,
	SpotifyFollowedArtistsResponse
} from '$types/spotify.type';

export interface SpotifyAuth {
	id: ID;
	accessToken: string | null;
	refreshToken: string | null;
	expiresAt: number | null;
	codeVerifier: string | null;
}

const initialState: SpotifyAuth = {
	id: 'spotify-auth',
	accessToken: null,
	refreshToken: null,
	expiresAt: null,
	codeVerifier: null
};

class SpotifyService extends ObjectServiceClass<SpotifyAuth> {
	private clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';
	private redirectUri = 'http://127.0.0.1:1998/api/spotify/callback';
	private baseUrl = 'https://api.spotify.com/v1';
	private scopes = [
		'user-read-private',
		'user-read-email',
		'user-library-read',
		'user-follow-read',
		'playlist-read-private',
		'playlist-read-collaborative'
	];

	constructor() {
		super('spotify', initialState);
	}

	private generateRandomString(length: number): string {
		const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		const values = crypto.getRandomValues(new Uint8Array(length));
		return values.reduce((acc, x) => acc + possible[x % possible.length], '');
	}

	private async sha256(plain: string): Promise<ArrayBuffer> {
		const encoder = new TextEncoder();
		const data = encoder.encode(plain);
		return crypto.subtle.digest('SHA-256', data);
	}

	private base64encode(input: ArrayBuffer): string {
		return btoa(String.fromCharCode(...new Uint8Array(input)))
			.replace(/=/g, '')
			.replace(/\+/g, '-')
			.replace(/\//g, '_');
	}

	async login(): Promise<void> {
		if (!browser) return;

		const codeVerifier = this.generateRandomString(64);
		const hashed = await this.sha256(codeVerifier);
		const codeChallenge = this.base64encode(hashed);

		this.set({ ...this.get(), codeVerifier });

		const params = new URLSearchParams({
			response_type: 'code',
			client_id: this.clientId,
			scope: this.scopes.join(' '),
			code_challenge_method: 'S256',
			code_challenge: codeChallenge,
			redirect_uri: this.redirectUri
		});

		window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
	}

	async handleCallback(code: string): Promise<boolean> {
		if (!browser) return false;

		const { codeVerifier } = this.get();
		if (!codeVerifier) {
			console.error('No code verifier found');
			return false;
		}

		try {
			const response = await fetch('https://accounts.spotify.com/api/token', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded'
				},
				body: new URLSearchParams({
					client_id: this.clientId,
					grant_type: 'authorization_code',
					code,
					redirect_uri: this.redirectUri,
					code_verifier: codeVerifier
				})
			});

			if (!response.ok) {
				console.error('Token exchange failed:', await response.text());
				return false;
			}

			const data = await response.json();
			this.set({
				id: 'spotify-auth',
				accessToken: data.access_token,
				refreshToken: data.refresh_token,
				expiresAt: Date.now() + data.expires_in * 1000,
				codeVerifier: null
			});

			return true;
		} catch (error) {
			console.error('Token exchange error:', error);
			return false;
		}
	}

	async refreshAccessToken(): Promise<boolean> {
		if (!browser) return false;

		const { refreshToken } = this.get();
		if (!refreshToken) return false;

		try {
			const response = await fetch('https://accounts.spotify.com/api/token', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded'
				},
				body: new URLSearchParams({
					client_id: this.clientId,
					grant_type: 'refresh_token',
					refresh_token: refreshToken
				})
			});

			if (!response.ok) return false;

			const data = await response.json();
			this.set({
				...this.get(),
				accessToken: data.access_token,
				refreshToken: data.refresh_token || refreshToken,
				expiresAt: Date.now() + data.expires_in * 1000
			});

			return true;
		} catch {
			return false;
		}
	}

	isAuthenticated(): boolean {
		const { accessToken, expiresAt } = this.get();
		return !!accessToken && !!expiresAt && Date.now() < expiresAt;
	}

	logout(): void {
		this.set(initialState);
	}

	getAccessToken(): string | null {
		return this.get().accessToken;
	}

	private async fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
		if (!browser) return null;

		const token = this.getAccessToken();
		if (!token) return null;

		// Check if token is expired and refresh if needed
		const { expiresAt } = this.get();
		if (expiresAt && Date.now() >= expiresAt - 60000) {
			const refreshed = await this.refreshAccessToken();
			if (!refreshed) return null;
		}

		const response = await fetch(`${this.baseUrl}${endpoint}`, {
			...options,
			headers: {
				Authorization: `Bearer ${this.getAccessToken()}`,
				'Content-Type': 'application/json',
				...options.headers
			}
		});

		if (response.status === 204) {
			return null;
		}

		if (!response.ok) {
			console.error(`Spotify API error: ${response.status}`, await response.text());
			return null;
		}

		return response.json();
	}

	// Library methods
	async getSavedTracks(
		limit: number = 20,
		offset: number = 0
	): Promise<SpotifyPaginatedResponse<{ added_at: string; track: SpotifyTrack }> | null> {
		return this.fetchApi(`/me/tracks?limit=${limit}&offset=${offset}`);
	}

	async getSavedAlbums(
		limit: number = 20,
		offset: number = 0
	): Promise<SpotifyPaginatedResponse<{ added_at: string; album: SpotifyAlbum }> | null> {
		return this.fetchApi(`/me/albums?limit=${limit}&offset=${offset}`);
	}

	async getPlaylists(
		limit: number = 20,
		offset: number = 0
	): Promise<SpotifyPaginatedResponse<SpotifyPlaylist> | null> {
		return this.fetchApi(`/me/playlists?limit=${limit}&offset=${offset}`);
	}

	async getFollowedArtists(
		limit: number = 20,
		after?: string
	): Promise<SpotifyFollowedArtistsResponse | null> {
		const params = new URLSearchParams({ type: 'artist', limit: String(limit) });
		if (after) {
			params.set('after', after);
		}
		return this.fetchApi(`/me/following?${params.toString()}`);
	}

	async getPlaylistTracks(
		playlistId: string,
		limit: number = 100,
		offset: number = 0
	): Promise<SpotifyPaginatedResponse<{ added_at: string; track: SpotifyTrack }> | null> {
		return this.fetchApi(`/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`);
	}

	async getAlbum(albumId: string): Promise<SpotifyAlbum | null> {
		return this.fetchApi(`/albums/${albumId}`);
	}

	/**
	 * Get all tracks from an album
	 * Returns tracks with full details including external_ids
	 */
	async getAlbumTracks(albumId: string): Promise<SpotifyTrack[]> {
		const album = await this.getAlbum(albumId);
		if (!album || !album.tracks?.items) return [];

		// The album.tracks.items may not have full track details (like external_ids)
		// So we fetch full track details using getTracks
		const trackIds = album.tracks.items.map((t) => t.id);
		const allTracks: SpotifyTrack[] = [];

		// Fetch in batches of 50 (API limit)
		for (let i = 0; i < trackIds.length; i += 50) {
			const batch = trackIds.slice(i, i + 50);
			const tracks = await this.getTracks(batch);
			allTracks.push(...tracks);
		}

		return allTracks;
	}

	/**
	 * Get an artist's top tracks
	 * Returns up to 10 top tracks for the artist
	 */
	async getArtistTopTracks(artistId: string, market: string = 'US'): Promise<SpotifyTrack[]> {
		const result = await this.fetchApi<{ tracks: SpotifyTrack[] }>(
			`/artists/${artistId}/top-tracks?market=${market}`
		);
		return result?.tracks || [];
	}

	async getTrack(trackId: string): Promise<SpotifyTrack | null> {
		return this.fetchApi(`/tracks/${trackId}`);
	}

	/**
	 * Get multiple tracks at once (max 50)
	 * Returns tracks with external_ids containing ISRC
	 */
	async getTracks(trackIds: string[]): Promise<SpotifyTrack[]> {
		if (trackIds.length === 0) return [];
		if (trackIds.length > 50) {
			console.warn('getTracks: max 50 tracks per request');
			trackIds = trackIds.slice(0, 50);
		}
		const result = await this.fetchApi<{ tracks: SpotifyTrack[] }>(
			`/tracks?ids=${trackIds.join(',')}`
		);
		return result?.tracks || [];
	}

	/**
	 * Get multiple albums at once (max 20)
	 * Returns albums with external_ids containing UPC
	 */
	async getAlbums(albumIds: string[]): Promise<SpotifyAlbum[]> {
		if (albumIds.length === 0) return [];
		if (albumIds.length > 20) {
			console.warn('getAlbums: max 20 albums per request');
			albumIds = albumIds.slice(0, 20);
		}
		const result = await this.fetchApi<{ albums: SpotifyAlbum[] }>(
			`/albums?ids=${albumIds.join(',')}`
		);
		return result?.albums || [];
	}
}

export const spotifyService = new SpotifyService();
