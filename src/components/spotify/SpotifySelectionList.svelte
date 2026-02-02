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

<div class="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
	<!-- Loading progress bar -->
	{#if loading || loadingAll || !isFullyLoaded}
		<div class="flex-shrink-0">
			<div class="mb-1 flex items-center justify-between text-xs text-base-content/70">
				<span class="flex items-center gap-1">
					{#if loading || loadingAll}
						<span class="loading loading-xs loading-spinner"></span>
						<span>Loading...</span>
					{:else}
						<span>Loaded</span>
					{/if}
				</span>
				<span>{items.length} / {totalItems}</span>
			</div>
			<progress
				class="progress h-2 w-full progress-primary"
				value={items.length}
				max={totalItems || 1}
			></progress>
		</div>
	{/if}

	<!-- Selection controls -->
	<div class="flex flex-shrink-0 items-center justify-between">
		<div class="text-sm text-base-content/70">
			{selectedCount} of {items.length} selected
		</div>
		<div class="flex gap-2">
			<button class="btn btn-ghost btn-xs" on:click={onSelectAll}>Select All</button>
			<button class="btn btn-ghost btn-xs" on:click={onDeselectAll}>Deselect All</button>
		</div>
	</div>

	<!-- Item list with checkboxes -->
	<div class="min-h-0 flex-1 overflow-y-auto rounded-lg border border-base-300">
		{#each items as item (item.id)}
			<label
				class="flex cursor-pointer items-center gap-3 border-b border-base-300 p-3 last:border-b-0 hover:bg-base-200"
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
						class="h-10 w-10 flex-shrink-0 rounded object-cover"
					/>
				{:else}
					<div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded bg-base-300">
						<span class="text-xs text-base-content/50">?</span>
					</div>
				{/if}
				<div class="min-w-0 flex-1">
					<p class="truncate text-sm font-medium">{item.name}</p>
					<p class="text-xs text-base-content/60">{item.subtitle}</p>
				</div>
			</label>
		{/each}
		{#if loading || loadingAll}
			<div class="flex items-center justify-center gap-2 p-3 text-base-content/60">
				<span class="loading loading-sm loading-spinner"></span>
				<span class="text-sm">{loadingText}</span>
			</div>
		{/if}
		{#if !loading && !loadingAll && items.length === 0}
			<div class="flex items-center justify-center p-6 text-sm text-base-content/50">
				No items found
			</div>
		{/if}
	</div>
</div>
