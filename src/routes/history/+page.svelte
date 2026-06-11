<script lang="ts">
	import { categoryFromStoredPath, formatBytes, formatDateTime } from '$lib/client/format';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>History | File Drop</title>
	<meta name="description" content="View recent File Drop uploads from this device." />
</svelte:head>

<main class="min-h-svh bg-stone-50 px-5 py-8 text-slate-950">
	<section class="mx-auto flex w-full max-w-3xl flex-col gap-6">
		<header>
			<p class="text-sm font-semibold tracking-[0.2em] text-emerald-700 uppercase">
				{data.device.name}
			</p>
			<h1 class="mt-3 text-4xl font-semibold">Recent uploads</h1>
			<nav class="mt-4 flex gap-3">
				<a
					class="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
					href="/upload"
				>
					Upload
				</a>
				<a
					class="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
					href="/history"
				>
					History
				</a>
			</nav>
		</header>

		<div class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
			{#if data.uploads.length === 0}
				<p class="text-sm text-slate-500">No uploads from this device yet.</p>
			{:else}
				<ul class="divide-y divide-slate-100">
					{#each data.uploads as upload (upload.id)}
						<li class="py-4">
							<div class="flex items-start justify-between gap-4">
								<div class="min-w-0">
									<p class="truncate text-sm font-semibold text-slate-900">
										{upload.originalName}
									</p>
									<p class="mt-1 text-xs text-slate-500">
										{categoryFromStoredPath(upload.storedPath)} · {formatBytes(upload.sizeBytes)}
									</p>
								</div>
								<p
									class="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
								>
									{upload.status}
								</p>
							</div>
							<p class="mt-2 text-xs text-slate-500">{formatDateTime(upload.createdAt)}</p>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</section>
</main>
