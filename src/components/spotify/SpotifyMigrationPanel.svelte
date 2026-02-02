<script lang="ts">
	import { spotifyExportService } from '$services/spotify-export.service';
	import Button from '$components/core/Button.svelte';
	import SpotifySelectionList from '$components/spotify/SpotifySelectionList.svelte';
	import { ThemeColors, ThemeSizes } from '$types/core.type';

	const state = spotifyExportService.store;

	$: phase = $state.phase;
	$: isIdle = phase === 'idle';
	$: isLoadingPlaylists = phase === 'loading-playlists';
	$: isSelecting = phase === 'selecting';
	$: isExporting = phase === 'exporting';
	$: isComplete = phase === 'complete';
	$: isError = phase === 'error';

	$: selectedCount = $state.playlists.filter((p) => p.selected).length;
	$: totalTracks = $state.playlists
		.filter((p) => p.selected)
		.reduce((sum, p) => sum + p.trackCount, 0);

	// Convert playlists to SelectableItem format
	$: playlistItems = $state.playlists.map((p) => ({
		id: p.id,
		name: p.name,
		coverImage: p.coverImage,
		subtitle: `${p.trackCount} tracks`,
		selected: p.selected
	}));

	function loadPlaylists() {
		spotifyExportService.loadPlaylists();
	}

	function startExport() {
		spotifyExportService.startExport();
	}

	function reset() {
		spotifyExportService.reset();
	}

	function backToSelection() {
		spotifyExportService.backToSelection();
	}

	function togglePlaylist(playlistId: string) {
		spotifyExportService.togglePlaylist(playlistId);
	}

	function selectAll() {
		spotifyExportService.selectAll();
	}

	function deselectAll() {
		spotifyExportService.deselectAll();
	}
</script>

<div class="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
	<div class="flex flex-shrink-0 items-center justify-between">
		<h2 class="text-xl font-bold">Your Playlists</h2>
	</div>

	{#if isIdle}
		<!-- Idle state - Start button -->
		<div class="flex flex-1 flex-col items-center justify-center py-12 text-center">
			<p class="mb-4 text-base-content/70">
				Export your Spotify playlists, albums, and tracks to JSON.
			</p>
			<p class="mb-6 text-sm text-base-content/50">
				Track data includes ISRC codes for cross-platform matching.
			</p>
			<Button
				label="Load Playlists"
				color={ThemeColors.Primary}
				size={ThemeSizes.Medium}
				on:click={loadPlaylists}
			/>
		</div>
	{:else if isLoadingPlaylists || isSelecting}
		<!-- Playlist selection -->
		<SpotifySelectionList
			items={playlistItems}
			loading={$state.loadingPlaylists}
			loadingText="Loading playlists..."
			totalItems={$state.playlistsPagination.totalItems}
			loadingAll={$state.playlistsPagination.loadingAll}
			onToggle={togglePlaylist}
			onSelectAll={selectAll}
			onDeselectAll={deselectAll}
		/>
	{:else if isExporting}
		<!-- Export in progress - show selected playlists -->
		<div class="flex flex-1 flex-col gap-4 overflow-y-auto">
			<div class="flex items-center gap-2">
				<span class="loading loading-sm loading-spinner"></span>
				<span class="text-sm text-base-content/70">Exporting playlists...</span>
			</div>

			<div class="flex-1 overflow-y-auto">
				{#each $state.playlists.filter((p) => p.selected) as playlist (playlist.id)}
					<div class="flex items-center gap-2 border-b border-base-300 p-2 last:border-b-0">
						{#if playlist.coverImage}
							<img
								src={playlist.coverImage}
								alt={playlist.name}
								class="h-8 w-8 flex-shrink-0 rounded object-cover"
							/>
						{:else}
							<div class="h-8 w-8 flex-shrink-0 rounded bg-base-300"></div>
						{/if}
						<div class="min-w-0 flex-1">
							<p class="truncate text-xs font-medium">{playlist.name}</p>
							<p class="text-xs text-base-content/50">{playlist.trackCount} tracks</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{:else if isComplete}
		<!-- Complete -->
		<div class="flex flex-1 flex-col gap-4">
			<div class="alert alert-success">
				<span>Export complete!</span>
			</div>

			<div class="card bg-base-200 p-4">
				<h3 class="mb-3 text-sm font-semibold">Summary</h3>
				<div class="space-y-2 text-sm">
					<div class="flex justify-between">
						<span class="text-base-content/70">Playlists exported:</span>
						<span>{$state.playlistsExported}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-base-content/70">Tracks processed:</span>
						<span>{$state.totalStats.tracksProcessed}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-base-content/70">Albums processed:</span>
						<span>{$state.totalStats.albumsProcessed}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-base-content/70">Artists processed:</span>
						<span>{$state.totalStats.artistsProcessed}</span>
					</div>
				</div>
			</div>

			<div class="flex flex-shrink-0 gap-2">
				<Button
					label="Export More"
					color={ThemeColors.Neutral}
					size={ThemeSizes.Small}
					outline
					on:click={backToSelection}
					classes="flex-1"
				/>
				<Button
					label="Done"
					color={ThemeColors.Primary}
					size={ThemeSizes.Small}
					on:click={reset}
					classes="flex-1"
				/>
			</div>
		</div>
	{:else if isError}
		<!-- Error state -->
		<div class="flex flex-1 flex-col gap-4">
			<div class="alert alert-error">
				<span>Error: {$state.error}</span>
			</div>
			<div class="flex gap-2">
				<Button
					label="Back"
					color={ThemeColors.Neutral}
					size={ThemeSizes.Small}
					outline
					on:click={backToSelection}
					classes="flex-1"
				/>
				<Button
					label="Reset"
					color={ThemeColors.Primary}
					size={ThemeSizes.Small}
					on:click={reset}
					classes="flex-1"
				/>
			</div>
		</div>
	{/if}
</div>
