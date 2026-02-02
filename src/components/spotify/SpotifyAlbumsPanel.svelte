<script lang="ts">
	import { spotifyExportService } from '$services/spotify-export.service';
	import SpotifySelectionList from '$components/spotify/SpotifySelectionList.svelte';

	const state = spotifyExportService.store;

	// Convert albums to SelectableItem format
	$: albumItems = $state.albums.map((a) => ({
		id: a.id,
		name: a.name,
		coverImage: a.coverImage,
		subtitle: a.artist,
		selected: a.selected
	}));

	function toggleAlbum(albumId: string) {
		spotifyExportService.toggleAlbum(albumId);
	}

	function selectAll() {
		spotifyExportService.selectAllAlbums();
	}

	function deselectAll() {
		spotifyExportService.deselectAllAlbums();
	}
</script>

<div class="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
	<div class="flex flex-shrink-0 items-center justify-between">
		<h2 class="text-xl font-bold">Your Albums</h2>
	</div>

	<SpotifySelectionList
		items={albumItems}
		loading={$state.loadingAlbums}
		loadingText="Loading albums..."
		totalItems={$state.albumsPagination.totalItems}
		loadingAll={$state.albumsPagination.loadingAll}
		onToggle={toggleAlbum}
		onSelectAll={selectAll}
		onDeselectAll={deselectAll}
	/>
</div>
