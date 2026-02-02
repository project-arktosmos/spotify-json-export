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
	$: hasSelection =
		selectedPlaylists > 0 || selectedAlbums > 0 || selectedTracks > 0 || selectedArtists > 0;

	// Export stats
	$: exportStats = $exportState.totalStats;
	$: exportedData = $exportState.exportedData;

	function handleExport() {
		spotifyExportService.startExport();
	}

	function handleDownload() {
		if (!exportedData) return;

		const json = JSON.stringify(exportedData, null, 2);
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `spotify-export-${new Date().toISOString().split('T')[0]}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	function handleNewExport() {
		spotifyExportService.backToSelection();
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

<div class="flex h-screen flex-col p-6">
	<div class="mb-6 flex items-center justify-between">
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
		<div class="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-hidden lg:grid-cols-4">
			<SpotifyMigrationPanel />
			<SpotifyAlbumsPanel />
			<SpotifyTracksPanel />
			<SpotifyArtistsPanel />
		</div>

		<!-- Bottom action bar -->
		<div class="mt-4 flex flex-shrink-0 items-center justify-between rounded-lg bg-base-200 p-4">
			{#if isExporting}
				<!-- Progress during export -->
				<div class="flex-1">
					<SpotifyProgressPanel />
				</div>
			{:else if isComplete}
				<!-- Post-export info -->
				<div class="flex gap-6 text-sm">
					<div class="flex items-center gap-2">
						<span class="font-semibold text-success">Export Complete</span>
					</div>
					<div class="flex gap-4 text-base-content/70">
						<span>{exportedData?.playlists.length || 0} playlists</span>
						<span>{exportedData?.albums.length || 0} albums</span>
						<span>{exportedData?.tracks.length || 0} tracks</span>
						<span>{exportedData?.artists.length || 0} artists</span>
						<span class="text-base-content/50">|</span>
						<span>{exportStats.tracksProcessed} total tracks processed</span>
					</div>
				</div>
				<div class="flex gap-2">
					<Button
						label="New Export"
						color={ThemeColors.Neutral}
						size={ThemeSizes.Medium}
						outline
						on:click={handleNewExport}
					/>
					<Button
						label="Download JSON"
						color={ThemeColors.Success}
						size={ThemeSizes.Medium}
						on:click={handleDownload}
					/>
				</div>
			{:else}
				<!-- Selection mode -->
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
			{/if}
		</div>
	{:else}
		<div class="flex flex-1 flex-col items-center justify-center gap-6">
			<div class="text-center">
				<h2 class="mb-2 text-2xl font-semibold">Connect to Spotify</h2>
				<p class="max-w-md text-base-content/70">
					Export your Spotify playlists, albums, and tracks to JSON format. Track data includes ISRC
					codes for cross-platform matching.
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
