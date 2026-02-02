<script lang="ts">
	import { spotifyExportService } from '$services/spotify-export.service';
	import Button from '$components/core/Button.svelte';
	import { ThemeColors, ThemeSizes } from '$types/core.type';

	const state = spotifyExportService.store;

	function stopExport() {
		spotifyExportService.stop();
	}
</script>

<div class="flex w-full flex-wrap items-center gap-6">
	<!-- Overall progress -->
	<div class="min-w-48 flex-1">
		<div class="mb-2 flex items-center justify-between">
			<h3 class="text-sm font-semibold">Overall Progress</h3>
			<span class="text-sm text-base-content/70">
				{$state.playlistsExported} / {$state.totalPlaylistsToExport} playlists
			</span>
		</div>
		<progress
			class="progress w-full progress-primary"
			value={$state.playlistsExported}
			max={$state.totalPlaylistsToExport}
		></progress>
	</div>

	<!-- Current playlist -->
	{#if $state.currentPlaylist}
		<div class="min-w-48 flex-1">
			<div class="mb-2 flex items-center gap-2">
				<span class="loading loading-sm loading-spinner"></span>
				<h3 class="truncate text-sm font-semibold">{$state.currentPlaylist.playlistName}</h3>
			</div>
			<div>
				<div class="mb-1 flex justify-between text-xs text-base-content/70">
					<span
						>Tracks: {$state.currentPlaylist.processedTracks} / {$state.currentPlaylist
							.totalTracks}</span
					>
				</div>
				<progress
					class="progress w-full progress-secondary"
					value={$state.currentPlaylist.processedTracks}
					max={$state.currentPlaylist.totalTracks || 1}
				></progress>
			</div>
		</div>
	{/if}

	<!-- Stats -->
	<div class="flex items-center gap-4">
		<div class="text-center">
			<div class="text-xs text-base-content/60">Tracks</div>
			<div class="font-semibold text-success">{$state.totalStats.tracksProcessed}</div>
		</div>
		<div class="text-center">
			<div class="text-xs text-base-content/60">Albums</div>
			<div class="font-semibold text-success">{$state.totalStats.albumsProcessed}</div>
		</div>
		<div class="text-center">
			<div class="text-xs text-base-content/60">Artists</div>
			<div class="font-semibold text-success">{$state.totalStats.artistsProcessed}</div>
		</div>
	</div>

	<!-- Stop button -->
	<Button
		label="Stop Export"
		color={ThemeColors.Warning}
		size={ThemeSizes.Small}
		on:click={stopExport}
	/>
</div>
