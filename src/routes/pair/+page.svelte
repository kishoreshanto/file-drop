<script lang="ts">
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<svelte:head>
	<title>Pair Device | File Drop</title>
</svelte:head>

<main class="min-h-svh bg-stone-50 px-5 py-8 text-slate-950">
	<section class="mx-auto flex w-full max-w-md flex-col gap-6">
		<header>
			<p class="text-sm font-semibold tracking-[0.2em] text-emerald-700 uppercase">File Drop</p>
			<h1 class="mt-3 text-4xl font-semibold">Pair this device</h1>
		</header>

		<form method="POST" class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
			{#if form?.message}
				<p class="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
					{form.message}
				</p>
			{/if}

			<label class="block">
				<span class="text-sm font-semibold text-slate-700">Device name</span>
				<input
					name="deviceName"
					value={form?.deviceName ?? 'Android Phone'}
					class="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
					autocomplete="off"
					required
				/>
			</label>

			<label class="mt-4 block">
				<span class="text-sm font-semibold text-slate-700">Pairing code</span>
				<input
					name="pairingCode"
					class="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-lg tracking-[0.18em]"
					inputmode="numeric"
					autocomplete="one-time-code"
					placeholder="583 291"
					required
				/>
			</label>

			<button
				class="mt-5 w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500"
			>
				Pair device
			</button>
		</form>
	</section>
</main>
