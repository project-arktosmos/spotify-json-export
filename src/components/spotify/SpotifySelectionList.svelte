<script lang="ts">
	export interface SelectableItem {
		id: string;
		name: string;
		coverImage: string | null;
		subtitle: string;
		selected: boolean;
	}

	export let items: SelectableItem[] = [];
	export let loading: boolean = false;
	export let loadingText: string = 'Loading...';
	export let totalItems: number = 0;
	export let loadingAll: boolean = false;

	export let onToggle: (id: string) => void = () => {};
	export let onSelectAll: () => void = () => {};
	export let onDeselectAll: () => void = () => {};

	$: selectedCount = items.filter((i) => i.selected).length;
	$: isFullyLoaded = items.length >= totalItems && totalItems > 0;
</script>

<div class="flex flex-col gap-3 flex-1 overflow-hidden min-h-0">
	<!-- Loading progress bar -->
	{#if loading || loadingAll || !isFullyLoaded}
		<div class="flex-shrink-0">
			<div class="flex items-center justify-between text-xs text-base-content/70 mb-1">
				<span class="flex items-center gap-1">
					{#if loading || loadingAll}
						<span class="loading loading-spinner loading-xs"></span>
						<span>Loading...</span>
					{:else}
						<span>Loaded</span>
					{/if}
				</span>
				<span>{items.length} / {totalItems}</span>
			</div>
			<progress
				class="progress progress-primary w-full h-2"
				value={items.length}
				max={totalItems || 1}
			></progress>
		</div>
	{/if}

	<!-- Selection controls -->
	<div class="flex items-center justify-between flex-shrink-0">
		<div class="text-sm text-base-content/70">
			{selectedCount} of {items.length} selected
		</div>
		<div class="flex gap-2">
			<button class="btn btn-xs btn-ghost" on:click={onSelectAll}>Select All</button>
			<button class="btn btn-xs btn-ghost" on:click={onDeselectAll}>Deselect All</button>
		</div>
	</div>

	<!-- Item list with checkboxes -->
	<div class="flex-1 overflow-y-auto border border-base-300 rounded-lg min-h-0">
		{#each items as item (item.id)}
			<label
				class="flex items-center gap-3 p-3 hover:bg-base-200 cursor-pointer border-b border-base-300 last:border-b-0"
			>
				<input
					type="checkbox"
					class="checkbox checkbox-sm checkbox-primary"
					checked={item.selected}
					on:change={() => onToggle(item.id)}
				/>
				{#if item.coverImage}
					<img
						src={item.coverImage}
						alt={item.name}
						class="w-10 h-10 rounded flex-shrink-0 object-cover"
					/>
				{:else}
					<div
						class="w-10 h-10 rounded flex-shrink-0 bg-base-300 flex items-center justify-center"
					>
						<span class="text-xs text-base-content/50">?</span>
					</div>
				{/if}
				<div class="flex-1 min-w-0">
					<p class="font-medium text-sm truncate">{item.name}</p>
					<p class="text-xs text-base-content/60">{item.subtitle}</p>
				</div>
			</label>
		{/each}
		{#if loading || loadingAll}
			<div class="flex items-center justify-center gap-2 p-3 text-base-content/60">
				<span class="loading loading-spinner loading-sm"></span>
				<span class="text-sm">{loadingText}</span>
			</div>
		{/if}
		{#if !loading && !loadingAll && items.length === 0}
			<div class="flex items-center justify-center p-6 text-base-content/50 text-sm">
				No items found
			</div>
		{/if}
	</div>
</div>
