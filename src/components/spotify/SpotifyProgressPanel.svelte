<script lang="ts">
	import { spotifyExportService } from '$services/spotify-export.service';
	import Button from '$components/core/Button.svelte';
	import { ThemeColors, ThemeSizes } from '$types/core.type';

	const state = spotifyExportService.store;

	function stopExport() {
		spotifyExportService.stop();
	}
</script>

<div class="flex flex-wrap items-center gap-6 w-full">
	<!-- Overall progress -->
	<div class="flex-1 min-w-48">
		<div class="flex items-center justify-between mb-2">
			<h3 class="font-semibold text-sm">Overall Progress</h3>
			<span class="text-sm text-base-content/70">
				{$state.playlistsExported} / {$state.totalPlaylistsToExport} playlists
			</span>
		</div>
		<progress
			class="progress progress-primary w-full"
			value={$state.playlistsExported}
			max={$state.totalPlaylistsToExport}
		></progress>
	</div>

	<!-- Current playlist -->
	{#if $state.currentPlaylist}
		<div class="flex-1 min-w-48">
			<div class="flex items-center gap-2 mb-2">
				<span class="loading loading-spinner loading-sm"></span>
				<h3 class="font-semibold text-sm truncate">{$state.currentPlaylist.playlistName}</h3>
			</div>
			<div>
				<div class="flex justify-between text-xs text-base-content/70 mb-1">
					<span>Tracks: {$state.currentPlaylist.processedTracks} / {$state.currentPlaylist.totalTracks}</span>
				</div>
				<progress
					class="progress progress-secondary w-full"
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
