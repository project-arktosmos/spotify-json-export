<script lang="ts">
	import { spotifyExportService } from '$services/spotify-export.service';
	import SpotifySelectionList from '$components/spotify/SpotifySelectionList.svelte';

	const state = spotifyExportService.store;

	// Convert artists to SelectableItem format
	$: artistItems = $state.artists.map((a) => ({
		id: a.id,
		name: a.name,
		coverImage: a.coverImage,
		subtitle: a.genres.slice(0, 2).join(', ') || 'Artist',
		selected: a.selected
	}));

	function toggleArtist(artistId: string) {
		spotifyExportService.toggleArtist(artistId);
	}

	function selectAll() {
		spotifyExportService.selectAllArtists();
	}

	function deselectAll() {
		spotifyExportService.deselectAllArtists();
	}
</script>

<div class="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
	<div class="flex flex-shrink-0 items-center justify-between">
		<h2 class="text-xl font-bold">Your Artists</h2>
	</div>

	<SpotifySelectionList
		items={artistItems}
		loading={$state.loadingArtists}
		loadingText="Loading artists..."
		totalItems={$state.artistsPagination.totalItems}
		loadingAll={$state.artistsPagination.loadingAll}
		onToggle={toggleArtist}
		onSelectAll={selectAll}
		onDeselectAll={deselectAll}
	/>
</div>
