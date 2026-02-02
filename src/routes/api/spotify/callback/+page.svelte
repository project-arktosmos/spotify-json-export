<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { spotifyService } from '$services/spotify.service';

	let status: 'loading' | 'success' | 'error' = 'loading';
	let errorMessage = '';

	onMount(async () => {
		const params = new URLSearchParams(window.location.search);
		const code = params.get('code');
		const error = params.get('error');

		if (error) {
			status = 'error';
			errorMessage = error;
			return;
		}

		if (!code) {
			status = 'error';
			errorMessage = 'No authorization code received';
			return;
		}

		const success = await spotifyService.handleCallback(code);
		if (success) {
			status = 'success';
			setTimeout(() => goto('/'), 1500);
		} else {
			status = 'error';
			errorMessage = 'Failed to exchange authorization code';
		}
	});
</script>

<div class="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
	{#if status === 'loading'}
		<span class="loading loading-spinner loading-lg"></span>
		<p class="text-base-content/70">Connecting to Spotify...</p>
	{:else if status === 'success'}
		<p class="text-success text-lg">Successfully connected!</p>
		<p class="text-base-content/70">Redirecting...</p>
	{:else}
		<p class="text-error text-lg">Authentication Failed</p>
		<p class="text-base-content/70">{errorMessage}</p>
		<a href="/" class="btn btn-primary mt-4">Try Again</a>
	{/if}
</div>
