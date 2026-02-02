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
	$: totalSelected = selectedPlaylists.length + selectedAlbums.length + selectedTracks.length + selectedArtists.length;
	$: isLoading = $state.loadingPlaylists || $state.loadingAlbums || $state.loadingTracks || $state.loadingArtists;

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

<div class="flex flex-col gap-4 overflow-hidden h-full">
	<div class="flex items-center justify-between flex-shrink-0">
		<h2 class="text-xl font-bold">{isComplete ? 'Export Result' : 'Selected for Export'}</h2>
	</div>

	{#if isComplete}
		<!-- JSON Output View -->
		<div class="flex-1 flex flex-col overflow-hidden min-h-0">
			<textarea
				class="textarea textarea-bordered flex-1 font-mono text-xs w-full min-h-0"
				readonly
				value={$state.jsonOutput}
			></textarea>
		</div>

		<!-- Action buttons -->
		<div class="flex flex-col gap-2 flex-shrink-0">
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
		<div class="flex-1 overflow-y-auto flex flex-col gap-4">
		<!-- Selected Playlists Section -->
		<div class="border border-base-300 rounded-lg overflow-hidden">
			<div class="flex items-center justify-between bg-base-200 p-3">
				<div>
					<span class="font-semibold text-sm">Playlists</span>
					<span class="text-xs text-base-content/60 ml-2">
						{selectedPlaylists.length} selected ({totalPlaylistTracks} tracks)
					</span>
				</div>
				{#if selectedPlaylists.length > 0}
					<button class="btn btn-xs btn-ghost text-error" on:click={clearAllPlaylists}>
						Clear
					</button>
				{/if}
			</div>
			<div class="max-h-48 overflow-y-auto">
				{#if selectedPlaylists.length === 0}
					<div class="p-4 text-center text-base-content/50 text-sm">
						No playlists selected
					</div>
				{:else}
					{#each selectedPlaylists as playlist (playlist.id)}
						<div class="flex items-center gap-2 p-2 border-b border-base-300 last:border-b-0 hover:bg-base-100">
							{#if playlist.coverImage}
								<img
									src={playlist.coverImage}
									alt={playlist.name}
									class="w-8 h-8 rounded flex-shrink-0 object-cover"
								/>
							{:else}
								<div class="w-8 h-8 rounded flex-shrink-0 bg-base-300"></div>
							{/if}
							<div class="flex-1 min-w-0">
								<p class="text-xs font-medium truncate">{playlist.name}</p>
								<p class="text-xs text-base-content/50">{playlist.trackCount} tracks</p>
							</div>
							<button
								class="btn btn-xs btn-ghost btn-circle text-error"
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
		<div class="border border-base-300 rounded-lg overflow-hidden">
			<div class="flex items-center justify-between bg-base-200 p-3">
				<div>
					<span class="font-semibold text-sm">Albums</span>
					<span class="text-xs text-base-content/60 ml-2">
						{selectedAlbums.length} selected ({totalAlbumTracks} tracks)
					</span>
				</div>
				{#if selectedAlbums.length > 0}
					<button class="btn btn-xs btn-ghost text-error" on:click={clearAllAlbums}>
						Clear
					</button>
				{/if}
			</div>
			<div class="max-h-48 overflow-y-auto">
				{#if selectedAlbums.length === 0}
					<div class="p-4 text-center text-base-content/50 text-sm">
						No albums selected
					</div>
				{:else}
					{#each selectedAlbums as album (album.id)}
						<div class="flex items-center gap-2 p-2 border-b border-base-300 last:border-b-0 hover:bg-base-100">
							{#if album.coverImage}
								<img
									src={album.coverImage}
									alt={album.name}
									class="w-8 h-8 rounded flex-shrink-0 object-cover"
								/>
							{:else}
								<div class="w-8 h-8 rounded flex-shrink-0 bg-base-300"></div>
							{/if}
							<div class="flex-1 min-w-0">
								<p class="text-xs font-medium truncate">{album.name}</p>
								<p class="text-xs text-base-content/50">{album.artist}</p>
							</div>
							<button
								class="btn btn-xs btn-ghost btn-circle text-error"
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
		<div class="border border-base-300 rounded-lg overflow-hidden">
			<div class="flex items-center justify-between bg-base-200 p-3">
				<div>
					<span class="font-semibold text-sm">Tracks</span>
					<span class="text-xs text-base-content/60 ml-2">
						{selectedTracks.length} selected
					</span>
				</div>
				{#if selectedTracks.length > 0}
					<button class="btn btn-xs btn-ghost text-error" on:click={clearAllTracks}>
						Clear
					</button>
				{/if}
			</div>
			<div class="max-h-48 overflow-y-auto">
				{#if selectedTracks.length === 0}
					<div class="p-4 text-center text-base-content/50 text-sm">
						No tracks selected
					</div>
				{:else}
					{#each selectedTracks as track (track.id)}
						<div class="flex items-center gap-2 p-2 border-b border-base-300 last:border-b-0 hover:bg-base-100">
							{#if track.coverImage}
								<img
									src={track.coverImage}
									alt={track.name}
									class="w-8 h-8 rounded flex-shrink-0 object-cover"
								/>
							{:else}
								<div class="w-8 h-8 rounded flex-shrink-0 bg-base-300"></div>
							{/if}
							<div class="flex-1 min-w-0">
								<p class="text-xs font-medium truncate">{track.name}</p>
								<p class="text-xs text-base-content/50">{track.artist}</p>
							</div>
							<button
								class="btn btn-xs btn-ghost btn-circle text-error"
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
		<div class="border border-base-300 rounded-lg overflow-hidden">
			<div class="flex items-center justify-between bg-base-200 p-3">
				<div>
					<span class="font-semibold text-sm">Artists</span>
					<span class="text-xs text-base-content/60 ml-2">
						{selectedArtists.length} selected
					</span>
				</div>
				{#if selectedArtists.length > 0}
					<button class="btn btn-xs btn-ghost text-error" on:click={clearAllArtists}>
						Clear
					</button>
				{/if}
			</div>
			<div class="max-h-48 overflow-y-auto">
				{#if selectedArtists.length === 0}
					<div class="p-4 text-center text-base-content/50 text-sm">
						No artists selected
					</div>
				{:else}
					{#each selectedArtists as artist (artist.id)}
						<div class="flex items-center gap-2 p-2 border-b border-base-300 last:border-b-0 hover:bg-base-100">
							{#if artist.coverImage}
								<img
									src={artist.coverImage}
									alt={artist.name}
									class="w-8 h-8 rounded flex-shrink-0 object-cover"
								/>
							{:else}
								<div class="w-8 h-8 rounded flex-shrink-0 bg-base-300"></div>
							{/if}
							<div class="flex-1 min-w-0">
								<p class="text-xs font-medium truncate">{artist.name}</p>
								<p class="text-xs text-base-content/50">{artist.genres.slice(0, 2).join(', ') || 'Artist'}</p>
							</div>
							<button
								class="btn btn-xs btn-ghost btn-circle text-error"
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
		<div class="bg-base-200 rounded-lg p-3 flex-shrink-0">
			<div class="text-sm font-semibold mb-2">Export Summary</div>
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
				<div class="font-semibold">{totalPlaylistTracks + totalAlbumTracks + selectedTracks.length}</div>
			</div>
		</div>

		<!-- Action buttons -->
		<div class="flex gap-2 flex-shrink-0">
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
