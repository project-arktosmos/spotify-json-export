<script lang="ts">
	import { spotifyExportService } from '$services/spotify-export.service';
	import Button from '$components/core/Button.svelte';
	import { ThemeColors, ThemeSizes } from '$types/core.type';

	const state = spotifyExportService.store;

	$: phase = $state.phase;
	$: isComplete = phase === 'complete';
	$: selectedPlaylists = $state.playlists.filter((p) => p.selected);
	$: selectedAlbums = $state.albums.filter((a) => a.selected);
	$: selectedTracks = $state.tracks.filter((t) => t.selected);
	$: selectedArtists = $state.artists.filter((a) => a.selected);
	$: totalPlaylistTracks = selectedPlaylists.reduce((sum, p) => sum + p.trackCount, 0);
	$: totalAlbumTracks = selectedAlbums.reduce((sum, a) => sum + a.trackCount, 0);
	$: totalSelected =
		selectedPlaylists.length +
		selectedAlbums.length +
		selectedTracks.length +
		selectedArtists.length;
	$: isLoading =
		$state.loadingPlaylists ||
		$state.loadingAlbums ||
		$state.loadingTracks ||
		$state.loadingArtists;

	function removePlaylist(id: string) {
		spotifyExportService.togglePlaylist(id);
	}

	function removeAlbum(id: string) {
		spotifyExportService.toggleAlbum(id);
	}

	function removeTrack(id: string) {
		spotifyExportService.toggleTrack(id);
	}

	function removeArtist(id: string) {
		spotifyExportService.toggleArtist(id);
	}

	function clearAllPlaylists() {
		spotifyExportService.deselectAll();
	}

	function clearAllAlbums() {
		spotifyExportService.deselectAllAlbums();
	}

	function clearAllTracks() {
		spotifyExportService.deselectAllTracks();
	}

	function clearAllArtists() {
		spotifyExportService.deselectAllArtists();
	}

	function reset() {
		spotifyExportService.reset();
	}

	function startExport() {
		spotifyExportService.startExport();
	}

	function backToSelection() {
		spotifyExportService.backToSelection();
	}

	function copyToClipboard() {
		navigator.clipboard.writeText($state.jsonOutput);
	}

	function downloadJson() {
		const blob = new Blob([$state.jsonOutput], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `spotify-export-${new Date().toISOString().split('T')[0]}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}
</script>

<div class="flex h-full flex-col gap-4 overflow-hidden">
	<div class="flex flex-shrink-0 items-center justify-between">
		<h2 class="text-xl font-bold">{isComplete ? 'Export Result' : 'Selected for Export'}</h2>
	</div>

	{#if isComplete}
		<!-- JSON Output View -->
		<div class="flex min-h-0 flex-1 flex-col overflow-hidden">
			<textarea
				class="textarea-bordered textarea min-h-0 w-full flex-1 font-mono text-xs"
				readonly
				value={$state.jsonOutput}
			></textarea>
		</div>

		<!-- Action buttons -->
		<div class="flex flex-shrink-0 flex-col gap-2">
			<div class="flex gap-2">
				<Button
					label="Copy"
					color={ThemeColors.Info}
					size={ThemeSizes.Small}
					on:click={copyToClipboard}
					classes="flex-1"
				/>
				<Button
					label="Download"
					color={ThemeColors.Success}
					size={ThemeSizes.Small}
					on:click={downloadJson}
					classes="flex-1"
				/>
			</div>
			<div class="flex gap-2">
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
	{:else}
		<div class="flex flex-1 flex-col gap-4 overflow-y-auto">
			<!-- Selected Playlists Section -->
			<div class="overflow-hidden rounded-lg border border-base-300">
				<div class="flex items-center justify-between bg-base-200 p-3">
					<div>
						<span class="text-sm font-semibold">Playlists</span>
						<span class="ml-2 text-xs text-base-content/60">
							{selectedPlaylists.length} selected ({totalPlaylistTracks} tracks)
						</span>
					</div>
					{#if selectedPlaylists.length > 0}
						<button class="btn text-error btn-ghost btn-xs" on:click={clearAllPlaylists}>
							Clear
						</button>
					{/if}
				</div>
				<div class="max-h-48 overflow-y-auto">
					{#if selectedPlaylists.length === 0}
						<div class="p-4 text-center text-sm text-base-content/50">No playlists selected</div>
					{:else}
						{#each selectedPlaylists as playlist (playlist.id)}
							<div
								class="flex items-center gap-2 border-b border-base-300 p-2 last:border-b-0 hover:bg-base-100"
							>
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
								<button
									class="btn btn-circle text-error btn-ghost btn-xs"
									on:click={() => removePlaylist(playlist.id)}
								>
									x
								</button>
							</div>
						{/each}
					{/if}
				</div>
			</div>

			<!-- Selected Albums Section -->
			<div class="overflow-hidden rounded-lg border border-base-300">
				<div class="flex items-center justify-between bg-base-200 p-3">
					<div>
						<span class="text-sm font-semibold">Albums</span>
						<span class="ml-2 text-xs text-base-content/60">
							{selectedAlbums.length} selected ({totalAlbumTracks} tracks)
						</span>
					</div>
					{#if selectedAlbums.length > 0}
						<button class="btn text-error btn-ghost btn-xs" on:click={clearAllAlbums}>
							Clear
						</button>
					{/if}
				</div>
				<div class="max-h-48 overflow-y-auto">
					{#if selectedAlbums.length === 0}
						<div class="p-4 text-center text-sm text-base-content/50">No albums selected</div>
					{:else}
						{#each selectedAlbums as album (album.id)}
							<div
								class="flex items-center gap-2 border-b border-base-300 p-2 last:border-b-0 hover:bg-base-100"
							>
								{#if album.coverImage}
									<img
										src={album.coverImage}
										alt={album.name}
										class="h-8 w-8 flex-shrink-0 rounded object-cover"
									/>
								{:else}
									<div class="h-8 w-8 flex-shrink-0 rounded bg-base-300"></div>
								{/if}
								<div class="min-w-0 flex-1">
									<p class="truncate text-xs font-medium">{album.name}</p>
									<p class="text-xs text-base-content/50">{album.artist}</p>
								</div>
								<button
									class="btn btn-circle text-error btn-ghost btn-xs"
									on:click={() => removeAlbum(album.id)}
								>
									x
								</button>
							</div>
						{/each}
					{/if}
				</div>
			</div>

			<!-- Selected Tracks Section -->
			<div class="overflow-hidden rounded-lg border border-base-300">
				<div class="flex items-center justify-between bg-base-200 p-3">
					<div>
						<span class="text-sm font-semibold">Tracks</span>
						<span class="ml-2 text-xs text-base-content/60">
							{selectedTracks.length} selected
						</span>
					</div>
					{#if selectedTracks.length > 0}
						<button class="btn text-error btn-ghost btn-xs" on:click={clearAllTracks}>
							Clear
						</button>
					{/if}
				</div>
				<div class="max-h-48 overflow-y-auto">
					{#if selectedTracks.length === 0}
						<div class="p-4 text-center text-sm text-base-content/50">No tracks selected</div>
					{:else}
						{#each selectedTracks as track (track.id)}
							<div
								class="flex items-center gap-2 border-b border-base-300 p-2 last:border-b-0 hover:bg-base-100"
							>
								{#if track.coverImage}
									<img
										src={track.coverImage}
										alt={track.name}
										class="h-8 w-8 flex-shrink-0 rounded object-cover"
									/>
								{:else}
									<div class="h-8 w-8 flex-shrink-0 rounded bg-base-300"></div>
								{/if}
								<div class="min-w-0 flex-1">
									<p class="truncate text-xs font-medium">{track.name}</p>
									<p class="text-xs text-base-content/50">{track.artist}</p>
								</div>
								<button
									class="btn btn-circle text-error btn-ghost btn-xs"
									on:click={() => removeTrack(track.id)}
								>
									x
								</button>
							</div>
						{/each}
					{/if}
				</div>
			</div>

			<!-- Selected Artists Section -->
			<div class="overflow-hidden rounded-lg border border-base-300">
				<div class="flex items-center justify-between bg-base-200 p-3">
					<div>
						<span class="text-sm font-semibold">Artists</span>
						<span class="ml-2 text-xs text-base-content/60">
							{selectedArtists.length} selected
						</span>
					</div>
					{#if selectedArtists.length > 0}
						<button class="btn text-error btn-ghost btn-xs" on:click={clearAllArtists}>
							Clear
						</button>
					{/if}
				</div>
				<div class="max-h-48 overflow-y-auto">
					{#if selectedArtists.length === 0}
						<div class="p-4 text-center text-sm text-base-content/50">No artists selected</div>
					{:else}
						{#each selectedArtists as artist (artist.id)}
							<div
								class="flex items-center gap-2 border-b border-base-300 p-2 last:border-b-0 hover:bg-base-100"
							>
								{#if artist.coverImage}
									<img
										src={artist.coverImage}
										alt={artist.name}
										class="h-8 w-8 flex-shrink-0 rounded object-cover"
									/>
								{:else}
									<div class="h-8 w-8 flex-shrink-0 rounded bg-base-300"></div>
								{/if}
								<div class="min-w-0 flex-1">
									<p class="truncate text-xs font-medium">{artist.name}</p>
									<p class="text-xs text-base-content/50">
										{artist.genres.slice(0, 2).join(', ') || 'Artist'}
									</p>
								</div>
								<button
									class="btn btn-circle text-error btn-ghost btn-xs"
									on:click={() => removeArtist(artist.id)}
								>
									x
								</button>
							</div>
						{/each}
					{/if}
				</div>
			</div>
		</div>

		<!-- Summary -->
		<div class="flex-shrink-0 rounded-lg bg-base-200 p-3">
			<div class="mb-2 text-sm font-semibold">Export Summary</div>
			<div class="grid grid-cols-2 gap-2 text-xs">
				<div class="text-base-content/70">Playlists:</div>
				<div>{selectedPlaylists.length}</div>
				<div class="text-base-content/70">Albums:</div>
				<div>{selectedAlbums.length}</div>
				<div class="text-base-content/70">Tracks:</div>
				<div>{selectedTracks.length}</div>
				<div class="text-base-content/70">Artists:</div>
				<div>{selectedArtists.length}</div>
				<div class="text-base-content/70">Est. tracks:</div>
				<div class="font-semibold">
					{totalPlaylistTracks + totalAlbumTracks + selectedTracks.length}
				</div>
			</div>
		</div>

		<!-- Action buttons -->
		<div class="flex flex-shrink-0 gap-2">
			<Button
				label="Cancel"
				color={ThemeColors.Neutral}
				size={ThemeSizes.Small}
				outline
				on:click={reset}
				classes="flex-1"
			/>
			<Button
				label={isLoading ? 'Loading...' : 'Start Export'}
				color={ThemeColors.Primary}
				size={ThemeSizes.Small}
				disabled={totalSelected === 0 || isLoading}
				on:click={startExport}
				classes="flex-1"
			/>
		</div>
	{/if}
</div>
