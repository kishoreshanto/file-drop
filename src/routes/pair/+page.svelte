<script lang="ts">
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<svelte:head>
	<title>Pair Device | File Drop</title>
	<meta name="description" content="Pair your Android device to File Drop." />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,650&family=Source+Sans+3:wght@400;500;600&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<main
	class="relative min-h-svh overflow-hidden bg-linear-to-br from-amber-50 via-white to-emerald-50 text-slate-900"
>
	<div
		class="pointer-events-none absolute top-0 -left-24 h-64 w-64 rounded-full bg-emerald-100/70 blur-3xl"
		aria-hidden="true"
	></div>
	<div
		class="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-sky-100/80 blur-3xl"
		aria-hidden="true"
	></div>

	<section
		class="relative mx-auto flex w-full max-w-md flex-col gap-8 px-6 py-10 sm:px-10"
		style="font-family: 'Source Sans 3', sans-serif;"
	>
		<header>
			<p class="text-sm font-semibold tracking-[0.2em] text-emerald-600 uppercase">File Drop</p>
			<h1
				class="mt-3 text-4xl leading-tight text-slate-900"
				style="font-family: 'Fraunces', serif;"
			>
				Pair this device
			</h1>
			<p class="mt-3 text-base leading-7 text-slate-600">
				Enter the pairing code shown on your Mac and confirm how this device should appear.
			</p>
		</header>

		<form
			method="POST"
			class="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur"
		>
			<div class="space-y-5">
				{#if form?.message}
					<p class="rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-700">
						{form.message}
					</p>
				{/if}

				<label class="block">
					<span class="text-sm font-semibold text-slate-600">Device name</span>
					<input
						name="deviceName"
						value={form?.deviceName ?? 'Android Phone'}
						class="mt-2 w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-base text-slate-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
						autocomplete="off"
						required
					/>
				</label>

				<label class="block">
					<span class="text-sm font-semibold text-slate-600">Pairing code</span>
					<input
						name="pairingCode"
						class="mt-2 w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-lg tracking-[0.18em] text-slate-900 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
						inputmode="numeric"
						autocomplete="one-time-code"
						placeholder="583 291"
						required
					/>
				</label>

				<div class="flex flex-col gap-3">
					<button
						class="w-full rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-400"
					>
						Pair device
					</button>
					<p class="text-xs text-slate-500">
						Codes expire quickly for security. If it fails, request a new one on your Mac.
					</p>
				</div>
			</div>
		</form>
	</section>
</main>
