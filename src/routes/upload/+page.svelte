<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Upload | File Drop</title>
</svelte:head>

<main class="min-h-svh bg-stone-50 px-5 py-8 text-slate-950">
	<section class="mx-auto flex w-full max-w-md flex-col gap-6">
		<header>
			<p class="text-sm font-semibold tracking-[0.2em] text-emerald-700 uppercase">Connected</p>
			<h1 class="mt-3 text-4xl font-semibold">Upload</h1>
			<p class="mt-3 text-slate-600">{data.device.name} is paired and ready.</p>
		</header>

		<div class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
			<p class="text-sm font-semibold text-slate-700">File uploads arrive on Day 5.</p>
			<p class="mt-2 text-sm leading-6 text-slate-500">
				This page is protected now, so unpaired devices are redirected to the pairing screen.
			</p>
		</div>
	</section>
</main>
