export interface SpotifyImage {
	url: string;
	height: number | null;
	width: number | null;
}

/** External IDs returned by Spotify API (ISRC for tracks, UPC for albums) */
export interface SpotifyExternalIds {
	isrc?: string;
	ean?: string;
	upc?: string;
}

export interface SpotifyArtist {
	id: string;
	name: string;
	uri: string;
	href: string;
	external_urls: {
		spotify: string;
	};
}

export interface SpotifyFullArtist extends SpotifyArtist {
	images: SpotifyImage[];
	genres: string[];
	popularity: number;
	followers: {
		total: number;
	};
}

export interface SpotifyFollowedArtistsResponse {
	artists: {
		items: SpotifyFullArtist[];
		next: string | null;
		cursors: {
			after: string | null;
		};
		limit: number;
		total: number;
	};
}

export interface SpotifyAlbum {
	id: string;
	name: string;
	uri: string;
	href: string;
	album_type: 'album' | 'single' | 'compilation';
	total_tracks: number;
	release_date: string;
	images: SpotifyImage[];
	artists: SpotifyArtist[];
	external_urls: {
		spotify: string;
	};
	external_ids?: SpotifyExternalIds;
	tracks?: {
		items: SpotifyTrack[];
		total: number;
	};
}

export interface SpotifyTrack {
	id: string;
	name: string;
	uri: string;
	href: string;
	duration_ms: number;
	track_number: number;
	disc_number: number;
	explicit: boolean;
	preview_url: string | null;
	album: SpotifyAlbum;
	artists: SpotifyArtist[];
	external_urls: {
		spotify: string;
	};
	external_ids?: SpotifyExternalIds;
}

export interface SpotifyPlaylist {
	id: string;
	name: string;
	uri: string;
	href: string;
	description: string | null;
	public: boolean;
	collaborative: boolean;
	images: SpotifyImage[];
	owner: {
		id: string;
		display_name: string;
		uri: string;
	};
	tracks: {
		total: number;
		href: string;
		items?: Array<{
			added_at: string;
			track: SpotifyTrack;
		}>;
	};
	external_urls: {
		spotify: string;
	};
}

export interface SpotifyDevice {
	id: string;
	name: string;
	type: string;
	is_active: boolean;
	is_private_session: boolean;
	is_restricted: boolean;
	volume_percent: number;
}

export interface SpotifyPlaybackState {
	device: SpotifyDevice;
	repeat_state: 'off' | 'track' | 'context';
	shuffle_state: boolean;
	timestamp: number;
	progress_ms: number | null;
	is_playing: boolean;
	item: SpotifyTrack | null;
	currently_playing_type: 'track' | 'episode' | 'ad' | 'unknown';
	context: {
		type: 'album' | 'artist' | 'playlist';
		uri: string;
		href: string;
	} | null;
}

export interface SpotifyPaginatedResponse<T> {
	items: T[];
	total: number;
	limit: number;
	offset: number;
	href: string;
	next: string | null;
	previous: string | null;
}

export interface SpotifySearchResults {
	tracks?: SpotifyPaginatedResponse<SpotifyTrack>;
	albums?: SpotifyPaginatedResponse<SpotifyAlbum>;
	artists?: SpotifyPaginatedResponse<SpotifyArtist>;
	playlists?: SpotifyPaginatedResponse<SpotifyPlaylist>;
}
