import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import { spotifyService } from '$services/spotify.service';

export type ExportPhase =
	| 'idle'
	| 'loading-playlists'
	| 'selecting'
	| 'exporting'
	| 'complete'
	| 'error';

export interface SpotifyPlaylistInfo {
	id: string;
	name: string;
	description: string;
	coverImage: string | null;
	trackCount: number;
	selected: boolean;
}

export interface SpotifyAlbumInfo {
	id: string;
	name: string;
	artist: string;
	coverImage: string | null;
	trackCount: number;
	selected: boolean;
}

export interface SpotifyTrackInfo {
	id: string;
	name: string;
	artist: string;
	album: string;
	coverImage: string | null;
	selected: boolean;
}

export interface SpotifyArtistInfo {
	id: string;
	name: string;
	coverImage: string | null;
	genres: string[];
	selected: boolean;
}

export interface PlaylistExportProgress {
	playlistId: string;
	playlistName: string;
	totalTracks: number;
	processedTracks: number;
}

export interface PaginationState {
	currentPage: number;
	totalItems: number;
	hasMoreToLoad: boolean;
	loadingAll: boolean;
}

export interface CursorPaginationState {
	currentPage: number;
	totalItems: number;
	hasMoreToLoad: boolean;
	loadingAll: boolean;
	cursor: string | null;
}

// Export data types (what gets output as JSON)
export interface ExportedTrack {
	spotify_id: string;
	name: string;
	artist: string;
	album: string;
	album_id: string;
	track_number: number;
	disc_number: number;
	duration_ms: number;
	isrc: string | null;
	cover_image_url: string | null;
	spotify_uri: string;
}

export interface ExportedPlaylist {
	spotify_id: string;
	name: string;
	description: string;
	cover_image_url: string | null;
	tracks: ExportedTrack[];
}

export interface ExportedAlbum {
	spotify_id: string;
	name: string;
	artist: string;
	release_date: string;
	album_type: string;
	total_tracks: number;
	upc: string | null;
	cover_image_url: string | null;
	tracks: ExportedTrack[];
}

export interface ExportedArtist {
	spotify_id: string;
	name: string;
	genres: string[];
	cover_image_url: string | null;
	top_tracks: ExportedTrack[];
}

export interface ExportedData {
	exported_at: string;
	playlists: ExportedPlaylist[];
	albums: ExportedAlbum[];
	tracks: ExportedTrack[];
	artists: ExportedArtist[];
}

export interface ExportState {
	phase: ExportPhase;

	// Playlist selection
	playlists: SpotifyPlaylistInfo[];
	loadingPlaylists: boolean;
	playlistsPagination: PaginationState;

	// Album selection
	albums: SpotifyAlbumInfo[];
	loadingAlbums: boolean;
	albumsPagination: PaginationState;

	// Track selection
	tracks: SpotifyTrackInfo[];
	loadingTracks: boolean;
	tracksPagination: PaginationState;

	// Artist selection
	artists: SpotifyArtistInfo[];
	loadingArtists: boolean;
	artistsPagination: CursorPaginationState;

	// Export progress
	totalPlaylistsToExport: number;
	playlistsExported: number;
	currentPlaylist: PlaylistExportProgress | null;

	// Stats
	totalStats: {
		tracksProcessed: number;
		albumsProcessed: number;
		artistsProcessed: number;
	};

	// Result
	exportedData: ExportedData | null;
	jsonOutput: string;

	// Error info
	error: string | null;
}

export const ITEMS_PER_PAGE = 10;
const STORAGE_KEY = 'spotify-export-cache';

interface CachedData {
	playlists: SpotifyPlaylistInfo[];
	playlistsTotal: number;
	albums: SpotifyAlbumInfo[];
	albumsTotal: number;
	tracks: SpotifyTrackInfo[];
	tracksTotal: number;
	artists: SpotifyArtistInfo[];
	artistsTotal: number;
	cachedAt: number;
}

const initialPaginationState: PaginationState = {
	currentPage: 1,
	totalItems: 0,
	hasMoreToLoad: true,
	loadingAll: false
};

const initialState: ExportState = {
	phase: 'idle',
	playlists: [],
	loadingPlaylists: false,
	playlistsPagination: { ...initialPaginationState },
	albums: [],
	loadingAlbums: false,
	albumsPagination: { ...initialPaginationState },
	tracks: [],
	loadingTracks: false,
	tracksPagination: { ...initialPaginationState },
	artists: [],
	loadingArtists: false,
	artistsPagination: { ...initialPaginationState, cursor: null },
	totalPlaylistsToExport: 0,
	playlistsExported: 0,
	currentPlaylist: null,
	totalStats: {
		tracksProcessed: 0,
		albumsProcessed: 0,
		artistsProcessed: 0
	},
	exportedData: null,
	jsonOutput: '',
	error: null
};

class SpotifyExportService {
	public store = writable<ExportState>(initialState);

	private aborted = false;

	constructor() {
		// Load cached data on initialization
		if (browser) {
			this.loadFromStorage();
		}
	}

	get isRunning(): boolean {
		const state = get(this.store);
		return state.phase === 'exporting';
	}

	get hasCachedData(): boolean {
		const state = get(this.store);
		return state.playlists.length > 0 || state.albums.length > 0 ||
			state.tracks.length > 0 || state.artists.length > 0;
	}

	private saveToStorage(): void {
		if (!browser) return;

		const state = get(this.store);
		const cached: CachedData = {
			playlists: state.playlists,
			playlistsTotal: state.playlistsPagination.totalItems,
			albums: state.albums,
			albumsTotal: state.albumsPagination.totalItems,
			tracks: state.tracks,
			tracksTotal: state.tracksPagination.totalItems,
			artists: state.artists,
			artistsTotal: state.artistsPagination.totalItems,
			cachedAt: Date.now()
		};

		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(cached));
		} catch (e) {
			console.warn('Failed to save to localStorage:', e);
		}
	}

	private loadFromStorage(): void {
		if (!browser) return;

		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (!stored) return;

			const cached: CachedData = JSON.parse(stored);

			// Check if we have any data
			if (!cached.playlists?.length && !cached.albums?.length &&
				!cached.tracks?.length && !cached.artists?.length) {
				return;
			}

			this.store.update((s) => ({
				...s,
				phase: 'selecting',
				playlists: cached.playlists || [],
				playlistsPagination: {
					...s.playlistsPagination,
					totalItems: cached.playlistsTotal || cached.playlists?.length || 0,
					hasMoreToLoad: false
				},
				albums: cached.albums || [],
				albumsPagination: {
					...s.albumsPagination,
					totalItems: cached.albumsTotal || cached.albums?.length || 0,
					hasMoreToLoad: false
				},
				tracks: cached.tracks || [],
				tracksPagination: {
					...s.tracksPagination,
					totalItems: cached.tracksTotal || cached.tracks?.length || 0,
					hasMoreToLoad: false
				},
				artists: cached.artists || [],
				artistsPagination: {
					...s.artistsPagination,
					totalItems: cached.artistsTotal || cached.artists?.length || 0,
					hasMoreToLoad: false
				}
			}));
		} catch (e) {
			console.warn('Failed to load from localStorage:', e);
		}
	}

	clearCache(): void {
		if (browser) {
			localStorage.removeItem(STORAGE_KEY);
		}
	}

	// ========== Playlist Loading ==========

	async loadPlaylists(): Promise<void> {
		if (!browser) return;

		this.store.update((s) => ({
			...s,
			phase: 'loading-playlists',
			loadingPlaylists: true,
			playlists: [],
			playlistsPagination: { ...initialPaginationState },
			error: null
		}));

		await this.loadPlaylistsPage();
	}

	private async loadPlaylistsPage(): Promise<void> {
		const state = get(this.store);
		const offset = state.playlists.length;

		try {
			const result = await spotifyService.getPlaylists(ITEMS_PER_PAGE, offset);

			if (!result) {
				this.store.update((s) => ({
					...s,
					phase: 'selecting',
					loadingPlaylists: false,
					playlistsPagination: {
						...s.playlistsPagination,
						hasMoreToLoad: false
					}
				}));
				return;
			}

			const batch: SpotifyPlaylistInfo[] = result.items.map((p) => ({
				id: p.id,
				name: p.name,
				description: p.description || '',
				coverImage: p.images?.[0]?.url || null,
				trackCount: p.tracks.total,
				selected: true
			}));

			const newTotal = state.playlists.length + batch.length;
			const hasMore = newTotal < result.total;

			this.store.update((s) => ({
				...s,
				phase: 'selecting',
				loadingPlaylists: false,
				playlists: [...s.playlists, ...batch],
				playlistsPagination: {
					...s.playlistsPagination,
					totalItems: result.total,
					hasMoreToLoad: hasMore
				}
			}));
		} catch (error) {
			console.error('Failed to load playlists:', error);
			this.store.update((s) => ({
				...s,
				phase: 'error',
				loadingPlaylists: false,
				error: error instanceof Error ? error.message : 'Failed to load playlists'
			}));
		}
	}

	async loadMorePlaylists(): Promise<void> {
		const state = get(this.store);
		if (state.loadingPlaylists || !state.playlistsPagination.hasMoreToLoad) return;

		this.store.update((s) => ({ ...s, loadingPlaylists: true }));
		await this.loadPlaylistsPage();
	}

	async loadAllPlaylists(): Promise<void> {
		const state = get(this.store);
		if (state.playlistsPagination.loadingAll || !state.playlistsPagination.hasMoreToLoad) return;

		this.store.update((s) => ({
			...s,
			playlistsPagination: { ...s.playlistsPagination, loadingAll: true }
		}));

		while (true) {
			const currentState = get(this.store);
			if (!currentState.playlistsPagination.hasMoreToLoad) break;

			this.store.update((s) => ({ ...s, loadingPlaylists: true }));
			await this.loadPlaylistsPage();
		}

		this.store.update((s) => ({
			...s,
			playlistsPagination: { ...s.playlistsPagination, loadingAll: false }
		}));

		this.saveToStorage();
	}

	setPlaylistsPage(page: number): void {
		const state = get(this.store);
		const totalPages = Math.ceil(state.playlistsPagination.totalItems / ITEMS_PER_PAGE);
		const maxLoadedPage = Math.ceil(state.playlists.length / ITEMS_PER_PAGE);

		if (page > maxLoadedPage && state.playlistsPagination.hasMoreToLoad) {
			this.loadMorePlaylists().then(() => {
				this.store.update((s) => ({
					...s,
					playlistsPagination: { ...s.playlistsPagination, currentPage: page }
				}));
			});
		} else {
			this.store.update((s) => ({
				...s,
				playlistsPagination: {
					...s.playlistsPagination,
					currentPage: Math.max(1, Math.min(page, totalPages))
				}
			}));
		}
	}

	// ========== Playlist Selection ==========

	togglePlaylist(playlistId: string): void {
		this.store.update((s) => ({
			...s,
			playlists: s.playlists.map((p) =>
				p.id === playlistId ? { ...p, selected: !p.selected } : p
			)
		}));
	}

	selectAll(): void {
		this.store.update((s) => ({
			...s,
			playlists: s.playlists.map((p) => ({ ...p, selected: true }))
		}));
	}

	deselectAll(): void {
		this.store.update((s) => ({
			...s,
			playlists: s.playlists.map((p) => ({ ...p, selected: false }))
		}));
	}

	// ========== Album Loading ==========

	async loadAlbums(): Promise<void> {
		if (!browser) return;

		this.store.update((s) => ({
			...s,
			loadingAlbums: true,
			albums: [],
			albumsPagination: { ...initialPaginationState }
		}));

		await this.loadAlbumsPage();
	}

	private async loadAlbumsPage(): Promise<void> {
		const state = get(this.store);
		const offset = state.albums.length;

		try {
			const result = await spotifyService.getSavedAlbums(ITEMS_PER_PAGE, offset);

			if (!result) {
				this.store.update((s) => ({
					...s,
					loadingAlbums: false,
					albumsPagination: {
						...s.albumsPagination,
						hasMoreToLoad: false
					}
				}));
				return;
			}

			const batch: SpotifyAlbumInfo[] = result.items.map((item) => ({
				id: item.album.id,
				name: item.album.name,
				artist: item.album.artists.map((a) => a.name).join(', '),
				coverImage: item.album.images?.[0]?.url || null,
				trackCount: item.album.total_tracks,
				selected: true
			}));

			const newTotal = state.albums.length + batch.length;
			const hasMore = newTotal < result.total;

			this.store.update((s) => ({
				...s,
				loadingAlbums: false,
				albums: [...s.albums, ...batch],
				albumsPagination: {
					...s.albumsPagination,
					totalItems: result.total,
					hasMoreToLoad: hasMore
				}
			}));
		} catch (error) {
			console.error('Failed to load albums:', error);
			this.store.update((s) => ({
				...s,
				loadingAlbums: false
			}));
		}
	}

	async loadMoreAlbums(): Promise<void> {
		const state = get(this.store);
		if (state.loadingAlbums || !state.albumsPagination.hasMoreToLoad) return;

		this.store.update((s) => ({ ...s, loadingAlbums: true }));
		await this.loadAlbumsPage();
	}

	async loadAllAlbums(): Promise<void> {
		const state = get(this.store);
		if (state.albumsPagination.loadingAll || !state.albumsPagination.hasMoreToLoad) return;

		this.store.update((s) => ({
			...s,
			albumsPagination: { ...s.albumsPagination, loadingAll: true }
		}));

		while (true) {
			const currentState = get(this.store);
			if (!currentState.albumsPagination.hasMoreToLoad) break;

			this.store.update((s) => ({ ...s, loadingAlbums: true }));
			await this.loadAlbumsPage();
		}

		this.store.update((s) => ({
			...s,
			albumsPagination: { ...s.albumsPagination, loadingAll: false }
		}));

		this.saveToStorage();
	}

	setAlbumsPage(page: number): void {
		const state = get(this.store);
		const totalPages = Math.ceil(state.albumsPagination.totalItems / ITEMS_PER_PAGE);
		const maxLoadedPage = Math.ceil(state.albums.length / ITEMS_PER_PAGE);

		if (page > maxLoadedPage && state.albumsPagination.hasMoreToLoad) {
			this.loadMoreAlbums().then(() => {
				this.store.update((s) => ({
					...s,
					albumsPagination: { ...s.albumsPagination, currentPage: page }
				}));
			});
		} else {
			this.store.update((s) => ({
				...s,
				albumsPagination: {
					...s.albumsPagination,
					currentPage: Math.max(1, Math.min(page, totalPages))
				}
			}));
		}
	}

	// ========== Album Selection ==========

	toggleAlbum(albumId: string): void {
		this.store.update((s) => ({
			...s,
			albums: s.albums.map((a) => (a.id === albumId ? { ...a, selected: !a.selected } : a))
		}));
	}

	selectAllAlbums(): void {
		this.store.update((s) => ({
			...s,
			albums: s.albums.map((a) => ({ ...a, selected: true }))
		}));
	}

	deselectAllAlbums(): void {
		this.store.update((s) => ({
			...s,
			albums: s.albums.map((a) => ({ ...a, selected: false }))
		}));
	}

	// ========== Track Loading ==========

	async loadTracks(): Promise<void> {
		if (!browser) return;

		this.store.update((s) => ({
			...s,
			loadingTracks: true,
			tracks: [],
			tracksPagination: { ...initialPaginationState }
		}));

		await this.loadTracksPage();
	}

	private async loadTracksPage(): Promise<void> {
		const state = get(this.store);
		const offset = state.tracks.length;

		try {
			const result = await spotifyService.getSavedTracks(ITEMS_PER_PAGE, offset);

			if (!result) {
				this.store.update((s) => ({
					...s,
					loadingTracks: false,
					tracksPagination: {
						...s.tracksPagination,
						hasMoreToLoad: false
					}
				}));
				return;
			}

			const batch: SpotifyTrackInfo[] = result.items.map((item) => ({
				id: item.track.id,
				name: item.track.name,
				artist: item.track.artists.map((a) => a.name).join(', '),
				album: item.track.album.name,
				coverImage: item.track.album.images?.[0]?.url || null,
				selected: true
			}));

			const newTotal = state.tracks.length + batch.length;
			const hasMore = newTotal < result.total;

			this.store.update((s) => ({
				...s,
				loadingTracks: false,
				tracks: [...s.tracks, ...batch],
				tracksPagination: {
					...s.tracksPagination,
					totalItems: result.total,
					hasMoreToLoad: hasMore
				}
			}));
		} catch (error) {
			console.error('Failed to load tracks:', error);
			this.store.update((s) => ({
				...s,
				loadingTracks: false
			}));
		}
	}

	async loadMoreTracks(): Promise<void> {
		const state = get(this.store);
		if (state.loadingTracks || !state.tracksPagination.hasMoreToLoad) return;

		this.store.update((s) => ({ ...s, loadingTracks: true }));
		await this.loadTracksPage();
	}

	async loadAllTracks(): Promise<void> {
		const state = get(this.store);
		if (state.tracksPagination.loadingAll || !state.tracksPagination.hasMoreToLoad) return;

		this.store.update((s) => ({
			...s,
			tracksPagination: { ...s.tracksPagination, loadingAll: true }
		}));

		while (true) {
			const currentState = get(this.store);
			if (!currentState.tracksPagination.hasMoreToLoad) break;

			this.store.update((s) => ({ ...s, loadingTracks: true }));
			await this.loadTracksPage();
		}

		this.store.update((s) => ({
			...s,
			tracksPagination: { ...s.tracksPagination, loadingAll: false }
		}));

		this.saveToStorage();
	}

	setTracksPage(page: number): void {
		const state = get(this.store);
		const totalPages = Math.ceil(state.tracksPagination.totalItems / ITEMS_PER_PAGE);
		const maxLoadedPage = Math.ceil(state.tracks.length / ITEMS_PER_PAGE);

		if (page > maxLoadedPage && state.tracksPagination.hasMoreToLoad) {
			this.loadMoreTracks().then(() => {
				this.store.update((s) => ({
					...s,
					tracksPagination: { ...s.tracksPagination, currentPage: page }
				}));
			});
		} else {
			this.store.update((s) => ({
				...s,
				tracksPagination: {
					...s.tracksPagination,
					currentPage: Math.max(1, Math.min(page, totalPages))
				}
			}));
		}
	}

	// ========== Track Selection ==========

	toggleTrack(trackId: string): void {
		this.store.update((s) => ({
			...s,
			tracks: s.tracks.map((t) => (t.id === trackId ? { ...t, selected: !t.selected } : t))
		}));
	}

	selectAllTracks(): void {
		this.store.update((s) => ({
			...s,
			tracks: s.tracks.map((t) => ({ ...t, selected: true }))
		}));
	}

	deselectAllTracks(): void {
		this.store.update((s) => ({
			...s,
			tracks: s.tracks.map((t) => ({ ...t, selected: false }))
		}));
	}

	// ========== Artist Loading ==========

	async loadArtists(): Promise<void> {
		if (!browser) return;

		this.store.update((s) => ({
			...s,
			loadingArtists: true,
			artists: [],
			artistsPagination: { ...initialPaginationState, cursor: null }
		}));

		await this.loadArtistsPage();
	}

	private async loadArtistsPage(): Promise<void> {
		const state = get(this.store);
		const cursor = state.artistsPagination.cursor;

		try {
			const result = await spotifyService.getFollowedArtists(ITEMS_PER_PAGE, cursor || undefined);

			if (!result || !result.artists) {
				this.store.update((s) => ({
					...s,
					loadingArtists: false,
					artistsPagination: {
						...s.artistsPagination,
						hasMoreToLoad: false
					}
				}));
				return;
			}

			const batch: SpotifyArtistInfo[] = result.artists.items.map((artist) => ({
				id: artist.id,
				name: artist.name,
				coverImage: artist.images?.[0]?.url || null,
				genres: artist.genres || [],
				selected: true
			}));

			const hasMore = result.artists.cursors?.after != null;

			this.store.update((s) => ({
				...s,
				loadingArtists: false,
				artists: [...s.artists, ...batch],
				artistsPagination: {
					...s.artistsPagination,
					totalItems: result.artists.total,
					hasMoreToLoad: hasMore,
					cursor: result.artists.cursors?.after || null
				}
			}));
		} catch (error) {
			console.error('Failed to load artists:', error);
			this.store.update((s) => ({
				...s,
				loadingArtists: false
			}));
		}
	}

	async loadMoreArtists(): Promise<void> {
		const state = get(this.store);
		if (state.loadingArtists || !state.artistsPagination.hasMoreToLoad) return;

		this.store.update((s) => ({ ...s, loadingArtists: true }));
		await this.loadArtistsPage();
	}

	async loadAllArtists(): Promise<void> {
		const state = get(this.store);
		if (state.artistsPagination.loadingAll || !state.artistsPagination.hasMoreToLoad) return;

		this.store.update((s) => ({
			...s,
			artistsPagination: { ...s.artistsPagination, loadingAll: true }
		}));

		while (true) {
			const currentState = get(this.store);
			if (!currentState.artistsPagination.hasMoreToLoad) break;

			this.store.update((s) => ({ ...s, loadingArtists: true }));
			await this.loadArtistsPage();
		}

		this.store.update((s) => ({
			...s,
			artistsPagination: { ...s.artistsPagination, loadingAll: false }
		}));

		this.saveToStorage();
	}

	setArtistsPage(page: number): void {
		const state = get(this.store);
		const totalPages = Math.ceil(state.artistsPagination.totalItems / ITEMS_PER_PAGE);
		const maxLoadedPage = Math.ceil(state.artists.length / ITEMS_PER_PAGE);

		if (page > maxLoadedPage && state.artistsPagination.hasMoreToLoad) {
			this.loadMoreArtists().then(() => {
				this.store.update((s) => ({
					...s,
					artistsPagination: { ...s.artistsPagination, currentPage: page }
				}));
			});
		} else {
			this.store.update((s) => ({
				...s,
				artistsPagination: {
					...s.artistsPagination,
					currentPage: Math.max(1, Math.min(page, totalPages))
				}
			}));
		}
	}

	// ========== Artist Selection ==========

	toggleArtist(artistId: string): void {
		this.store.update((s) => ({
			...s,
			artists: s.artists.map((a) => (a.id === artistId ? { ...a, selected: !a.selected } : a))
		}));
	}

	selectAllArtists(): void {
		this.store.update((s) => ({
			...s,
			artists: s.artists.map((a) => ({ ...a, selected: true }))
		}));
	}

	deselectAllArtists(): void {
		this.store.update((s) => ({
			...s,
			artists: s.artists.map((a) => ({ ...a, selected: false }))
		}));
	}

	// ========== Export ==========

	async startExport(): Promise<void> {
		if (!browser) return;
		if (this.isRunning) return;

		const state = get(this.store);
		const selectedPlaylists = state.playlists.filter((p) => p.selected);
		const selectedAlbums = state.albums.filter((a) => a.selected);
		const selectedTracks = state.tracks.filter((t) => t.selected);
		const selectedArtists = state.artists.filter((a) => a.selected);

		const hasSelection =
			selectedPlaylists.length > 0 ||
			selectedAlbums.length > 0 ||
			selectedTracks.length > 0 ||
			selectedArtists.length > 0;

		if (!hasSelection) {
			this.store.update((s) => ({
				...s,
				phase: 'error',
				error: 'No items selected for export'
			}));
			return;
		}

		this.aborted = false;

		this.store.update((s) => ({
			...s,
			phase: 'exporting',
			totalPlaylistsToExport: selectedPlaylists.length,
			playlistsExported: 0,
			currentPlaylist: null,
			totalStats: {
				tracksProcessed: 0,
				albumsProcessed: 0,
				artistsProcessed: 0
			},
			exportedData: null,
			jsonOutput: '',
			error: null
		}));

		const exportedData: ExportedData = {
			exported_at: new Date().toISOString(),
			playlists: [],
			albums: [],
			tracks: [],
			artists: []
		};

		try {
			// Process each playlist sequentially
			for (let i = 0; i < selectedPlaylists.length; i++) {
				if (this.aborted) break;

				const playlist = selectedPlaylists[i];
				const exportedPlaylist = await this.exportPlaylist(playlist);
				if (exportedPlaylist) {
					exportedData.playlists.push(exportedPlaylist);
				}

				this.store.update((s) => ({
					...s,
					playlistsExported: i + 1
				}));
			}

			// Process selected albums
			for (const album of selectedAlbums) {
				if (this.aborted) break;
				const exportedAlbum = await this.exportAlbum(album);
				if (exportedAlbum) {
					exportedData.albums.push(exportedAlbum);
				}
			}

			// Process selected tracks
			for (const track of selectedTracks) {
				if (this.aborted) break;
				const exportedTrack = await this.exportTrack(track);
				if (exportedTrack) {
					exportedData.tracks.push(exportedTrack);
				}
			}

			// Process selected artists
			for (const artist of selectedArtists) {
				if (this.aborted) break;
				const exportedArtist = await this.exportArtist(artist);
				if (exportedArtist) {
					exportedData.artists.push(exportedArtist);
				}
			}

			if (!this.aborted) {
				const jsonOutput = JSON.stringify(exportedData, null, 2);
				this.store.update((s) => ({
					...s,
					phase: 'complete',
					currentPlaylist: null,
					exportedData,
					jsonOutput
				}));
			}
		} catch (error) {
			console.error('Export error:', error);
			this.store.update((s) => ({
				...s,
				phase: 'error',
				error: error instanceof Error ? error.message : 'Unknown error'
			}));
		}
	}

	private async exportPlaylist(playlist: SpotifyPlaylistInfo): Promise<ExportedPlaylist | null> {
		// Initialize playlist progress
		this.store.update((s) => ({
			...s,
			currentPlaylist: {
				playlistId: playlist.id,
				playlistName: playlist.name,
				totalTracks: playlist.trackCount,
				processedTracks: 0
			}
		}));

		const exportedPlaylist: ExportedPlaylist = {
			spotify_id: playlist.id,
			name: playlist.name,
			description: playlist.description,
			cover_image_url: playlist.coverImage,
			tracks: []
		};

		// Fetch and process tracks
		let offset = 0;
		const limit = 50;

		while (true) {
			if (this.aborted) return null;

			const result = await spotifyService.getPlaylistTracks(playlist.id, limit, offset);
			if (!result || result.items.length === 0) break;

			// Get track IDs to fetch full details with ISRCs
			const trackIds = result.items
				.filter((item) => item.track && item.track.id)
				.map((item) => item.track.id);

			// Fetch full track data with ISRCs
			const fullTracks = await spotifyService.getTracks(trackIds);

			// Process each track
			for (const track of fullTracks) {
				if (this.aborted) return null;
				if (!track) continue;

				const exportedTrack: ExportedTrack = {
					spotify_id: track.id,
					name: track.name,
					artist: track.artists.map((a) => a.name).join(', '),
					album: track.album.name,
					album_id: track.album.id,
					track_number: track.track_number,
					disc_number: track.disc_number,
					duration_ms: track.duration_ms,
					isrc: track.external_ids?.isrc || null,
					cover_image_url: track.album.images?.[0]?.url || null,
					spotify_uri: track.uri
				};

				exportedPlaylist.tracks.push(exportedTrack);

				// Update progress
				const currentPlaylist = get(this.store).currentPlaylist;
				if (currentPlaylist) {
					this.store.update((s) => ({
						...s,
						currentPlaylist: {
							...currentPlaylist,
							processedTracks: currentPlaylist.processedTracks + 1
						},
						totalStats: {
							...s.totalStats,
							tracksProcessed: s.totalStats.tracksProcessed + 1
						}
					}));
				}
			}

			if (result.items.length < limit) break;
			offset += limit;
		}

		return exportedPlaylist;
	}

	private async exportAlbum(album: SpotifyAlbumInfo): Promise<ExportedAlbum | null> {
		// Fetch full album details
		const fullAlbum = await spotifyService.getAlbum(album.id);
		if (!fullAlbum) return null;

		// Fetch all tracks from album
		const albumTracks = await spotifyService.getAlbumTracks(album.id);

		const exportedAlbum: ExportedAlbum = {
			spotify_id: fullAlbum.id,
			name: fullAlbum.name,
			artist: fullAlbum.artists.map((a) => a.name).join(', '),
			release_date: fullAlbum.release_date,
			album_type: fullAlbum.album_type,
			total_tracks: fullAlbum.total_tracks,
			upc: fullAlbum.external_ids?.upc || null,
			cover_image_url: fullAlbum.images?.[0]?.url || null,
			tracks: []
		};

		for (const track of albumTracks) {
			if (!track) continue;

			exportedAlbum.tracks.push({
				spotify_id: track.id,
				name: track.name,
				artist: track.artists.map((a) => a.name).join(', '),
				album: fullAlbum.name,
				album_id: fullAlbum.id,
				track_number: track.track_number,
				disc_number: track.disc_number,
				duration_ms: track.duration_ms,
				isrc: track.external_ids?.isrc || null,
				cover_image_url: fullAlbum.images?.[0]?.url || null,
				spotify_uri: track.uri
			});

			this.store.update((s) => ({
				...s,
				totalStats: {
					...s.totalStats,
					tracksProcessed: s.totalStats.tracksProcessed + 1
				}
			}));
		}

		this.store.update((s) => ({
			...s,
			totalStats: {
				...s.totalStats,
				albumsProcessed: s.totalStats.albumsProcessed + 1
			}
		}));

		return exportedAlbum;
	}

	private async exportTrack(track: SpotifyTrackInfo): Promise<ExportedTrack | null> {
		// Get full track details with ISRC
		const fullTracks = await spotifyService.getTracks([track.id]);
		if (!fullTracks || fullTracks.length === 0) return null;

		const spotifyTrack = fullTracks[0];
		if (!spotifyTrack) return null;

		this.store.update((s) => ({
			...s,
			totalStats: {
				...s.totalStats,
				tracksProcessed: s.totalStats.tracksProcessed + 1
			}
		}));

		return {
			spotify_id: spotifyTrack.id,
			name: spotifyTrack.name,
			artist: spotifyTrack.artists.map((a) => a.name).join(', '),
			album: spotifyTrack.album.name,
			album_id: spotifyTrack.album.id,
			track_number: spotifyTrack.track_number,
			disc_number: spotifyTrack.disc_number,
			duration_ms: spotifyTrack.duration_ms,
			isrc: spotifyTrack.external_ids?.isrc || null,
			cover_image_url: spotifyTrack.album.images?.[0]?.url || null,
			spotify_uri: spotifyTrack.uri
		};
	}

	private async exportArtist(artist: SpotifyArtistInfo): Promise<ExportedArtist | null> {
		// Fetch top tracks for this artist
		const topTracks = await spotifyService.getArtistTopTracks(artist.id);

		const exportedArtist: ExportedArtist = {
			spotify_id: artist.id,
			name: artist.name,
			genres: artist.genres,
			cover_image_url: artist.coverImage,
			top_tracks: []
		};

		for (const track of topTracks) {
			if (!track) continue;

			exportedArtist.top_tracks.push({
				spotify_id: track.id,
				name: track.name,
				artist: track.artists.map((a) => a.name).join(', '),
				album: track.album.name,
				album_id: track.album.id,
				track_number: track.track_number,
				disc_number: track.disc_number,
				duration_ms: track.duration_ms,
				isrc: track.external_ids?.isrc || null,
				cover_image_url: track.album.images?.[0]?.url || null,
				spotify_uri: track.uri
			});

			this.store.update((s) => ({
				...s,
				totalStats: {
					...s.totalStats,
					tracksProcessed: s.totalStats.tracksProcessed + 1
				}
			}));
		}

		this.store.update((s) => ({
			...s,
			totalStats: {
				...s.totalStats,
				artistsProcessed: s.totalStats.artistsProcessed + 1
			}
		}));

		return exportedArtist;
	}

	stop(): void {
		this.aborted = true;
		this.store.update((s) => ({ ...s, phase: 'selecting' }));
	}

	reset(): void {
		this.aborted = false;
		this.store.set({ ...initialState });
		this.clearCache();
	}

	backToSelection(): void {
		this.store.update((s) => ({
			...s,
			phase: 'selecting',
			currentPlaylist: null,
			error: null
		}));
	}
}

export const spotifyExportService = new SpotifyExportService();
