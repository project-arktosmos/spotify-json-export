<script lang="ts">
	import { spotifyExportService } from '$services/spotify-export.service';
	import SpotifySelectionList from '$components/spotify/SpotifySelectionList.svelte';

	const state = spotifyExportService.store;

	// Convert tracks to SelectableItem format
	$: trackItems = $state.tracks.map((t) => ({
		id: t.id,
		name: t.name,
		coverImage: t.coverImage,
		subtitle: t.artist,
		selected: t.selected
	}));

	function toggleTrack(trackId: string) {
		spotifyExportService.toggleTrack(trackId);
	}

	function selectAll() {
		spotifyExportService.selectAllTracks();
	}

	function deselectAll() {
		spotifyExportService.deselectAllTracks();
	}
</script>

<div class="flex flex-col gap-4 overflow-hidden h-full min-h-0">
	<div class="flex items-center justify-between flex-shrink-0">
		<h2 class="text-xl font-bold">Your Tracks</h2>
	</div>

	<SpotifySelectionList
		items={trackItems}
		loading={$state.loadingTracks}
		loadingText="Loading tracks..."
		totalItems={$state.tracksPagination.totalItems}
		loadingAll={$state.tracksPagination.loadingAll}
		onToggle={toggleTrack}
		onSelectAll={selectAll}
		onDeselectAll={deselectAll}
	/>
</div>
