<script lang="ts">
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<svelte:head>
	<title>File Drop Admin</title>
</svelte:head>

<main class="min-h-svh bg-slate-950 px-5 py-8 text-slate-50">
	<section class="mx-auto flex w-full max-w-3xl flex-col gap-8">
		<header>
			<p class="text-sm font-semibold tracking-[0.2em] text-emerald-300 uppercase">Mac admin</p>
			<h1 class="mt-3 text-4xl font-semibold">File Drop Admin</h1>
		</header>

		<div class="rounded-lg border border-slate-800 bg-slate-900 p-5">
			<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p class="text-sm text-slate-400">Pair a device</p>
					<p class="mt-1 text-base text-slate-200">
						Generate a one-time code for your Android phone.
					</p>
				</div>
				<form method="POST" action="?/generate">
					<button
						class="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-300"
					>
						Generate pairing code
					</button>
				</form>
			</div>

			{#if form?.pairingCode}
				<div class="mt-6 rounded-lg border border-emerald-800 bg-emerald-950/50 p-5">
					<p class="text-sm text-emerald-200">Pairing code</p>
					<p class="mt-2 text-4xl font-semibold tracking-[0.18em] text-white">
						{form.pairingCode}
					</p>
					<p class="mt-3 text-sm text-emerald-100">
						Expires at {new Date(form.expiresAt).toLocaleTimeString()}
					</p>
				</div>
			{/if}
		</div>
	</section>
</main>
