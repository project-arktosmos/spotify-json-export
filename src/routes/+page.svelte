<script lang="ts">
	import { onMount } from 'svelte';
	import { spotifyService } from '$services/spotify.service';
	import { spotifyExportService } from '$services/spotify-export.service';
	import SpotifyMigrationPanel from '$components/spotify/SpotifyMigrationPanel.svelte';
	import SpotifyAlbumsPanel from '$components/spotify/SpotifyAlbumsPanel.svelte';
	import SpotifyTracksPanel from '$components/spotify/SpotifyTracksPanel.svelte';
	import SpotifyArtistsPanel from '$components/spotify/SpotifyArtistsPanel.svelte';
	import SpotifyProgressPanel from '$components/spotify/SpotifyProgressPanel.svelte';
	import Button from '$components/core/Button.svelte';
	import { ThemeColors, ThemeSizes } from '$types/core.type';

	const authStore = spotifyService.store;
	const exportState = spotifyExportService.store;

	$: auth = $authStore;
	$: phase = $exportState.phase;
	$: isSelecting = phase === 'selecting' || phase === 'loading-playlists';
	$: isExporting = phase === 'exporting';
	$: isComplete = phase === 'complete';
	$: isAuthenticated = auth.accessToken && auth.expiresAt && Date.now() < auth.expiresAt;

	// Selection counts
	$: selectedPlaylists = $exportState.playlists.filter((p) => p.selected).length;
	$: selectedAlbums = $exportState.albums.filter((a) => a.selected).length;
	$: selectedTracks = $exportState.tracks.filter((t) => t.selected).length;
	$: selectedArtists = $exportState.artists.filter((a) => a.selected).length;
	$: hasSelection = selectedPlaylists > 0 || selectedAlbums > 0 || selectedTracks > 0 || selectedArtists > 0;

	function handleExport() {
		spotifyExportService.startExport();
	}

	let hasLoadedData = false;

	function handleLogin() {
		spotifyService.login();
	}

	function handleLogout() {
		spotifyService.logout();
		spotifyExportService.reset();
		hasLoadedData = false;
	}

	async function loadAllData() {
		if (hasLoadedData) return;
		hasLoadedData = true;

		// Clear any stale cache and load fresh data from API
		spotifyExportService.clearCache();

		// Load first page of each category in parallel
		await Promise.all([
			spotifyExportService.loadPlaylists(),
			spotifyExportService.loadAlbums(),
			spotifyExportService.loadTracks(),
			spotifyExportService.loadArtists()
		]);

		// Then load all remaining pages in parallel
		await Promise.all([
			spotifyExportService.loadAllPlaylists(),
			spotifyExportService.loadAllAlbums(),
			spotifyExportService.loadAllTracks(),
			spotifyExportService.loadAllArtists()
		]);
	}

	onMount(() => {
		if (isAuthenticated) {
			loadAllData();
		}
	});

	// Watch for authentication changes (e.g., after OAuth callback)
	$: if (isAuthenticated) {
		loadAllData();
	}
</script>

<div class="flex flex-col h-screen p-6">
	<div class="flex items-center justify-between mb-6">
		<h1 class="text-3xl font-bold">Spotify Export</h1>
		{#if isAuthenticated}
			<Button
				label="Logout"
				color={ThemeColors.Neutral}
				size={ThemeSizes.Small}
				outline
				on:click={handleLogout}
			/>
		{/if}
	</div>

	{#if isAuthenticated}
		<!-- Selection View -->
		<div class="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 overflow-hidden min-h-0">
			<SpotifyMigrationPanel />
			<SpotifyAlbumsPanel />
			<SpotifyTracksPanel />
			<SpotifyArtistsPanel />
		</div>

		<!-- Bottom action bar -->
		{#if isSelecting && !isComplete}
			<div class="flex-shrink-0 mt-4 flex items-center justify-between bg-base-200 rounded-lg p-4">
				<div class="flex gap-4 text-sm text-base-content/70">
					<span>{selectedPlaylists} playlists</span>
					<span>{selectedAlbums} albums</span>
					<span>{selectedTracks} tracks</span>
					<span>{selectedArtists} artists</span>
				</div>
				<Button
					label="Export to JSON"
					color={ThemeColors.Primary}
					size={ThemeSizes.Medium}
					disabled={!hasSelection}
					on:click={handleExport}
				/>
			</div>
		{/if}

		<!-- Progress row during export -->
		{#if isExporting}
			<div class="flex-shrink-0 mt-4">
				<SpotifyProgressPanel />
			</div>
		{/if}
	{:else}
		<div class="flex flex-col items-center justify-center flex-1 gap-6">
			<div class="text-center">
				<h2 class="text-2xl font-semibold mb-2">Connect to Spotify</h2>
				<p class="text-base-content/70 max-w-md">
					Export your Spotify playlists, albums, and tracks to JSON format.
					Track data includes ISRC codes for cross-platform matching.
				</p>
			</div>
			<Button
				label="Connect with Spotify"
				color={ThemeColors.Success}
				size={ThemeSizes.Large}
				on:click={handleLogin}
			/>
		</div>
	{/if}
</div>
