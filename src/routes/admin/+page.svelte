<script lang="ts">
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<svelte:head>
	<title>File Drop Admin</title>
	<meta name="description" content="Generate pairing codes for File Drop." />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,650&family=Source+Sans+3:wght@400;500;600&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<main
	class="relative min-h-svh overflow-hidden bg-gradient-to-br from-amber-50 via-white to-emerald-50 text-slate-900"
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
		class="relative mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-10 sm:px-10"
		style="font-family: 'Source Sans 3', sans-serif;"
	>
		<header>
			<p class="text-sm font-semibold tracking-[0.2em] text-emerald-600 uppercase">Mac admin</p>
			<h1
				class="mt-3 text-4xl leading-tight text-slate-900 sm:text-5xl"
				style="font-family: 'Fraunces', serif;"
			>
				File Drop Admin
			</h1>
			<p class="mt-3 max-w-2xl text-base leading-7 text-slate-600">
				Create a one-time pairing code for your Android device before receiving uploads.
			</p>
		</header>

		<div
			class="w-full rounded-3xl border border-white/70 bg-white/80 p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur"
		>
			<div class="space-y-6">
				<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p class="text-sm font-semibold text-slate-500">Pair a device</p>
						<p class="mt-2 text-base text-slate-700">
							Generate a one-time code for your Android phone.
						</p>
					</div>
					<form method="POST" action="?/generate">
						<button
							class="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-400"
						>
							Generate pairing code
						</button>
					</form>
				</div>

				<div class="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>

				{#if form?.pairingCode}
					<div class="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5">
						<p class="text-sm font-semibold text-emerald-600">Pairing code</p>
						<p class="mt-3 text-4xl font-semibold tracking-[0.18em] text-emerald-900">
							{form.pairingCode}
						</p>
						<p class="mt-3 text-sm text-emerald-700">
							Expires at {new Date(form.expiresAt).toLocaleTimeString()}
						</p>
					</div>
				{:else}
					<div class="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-5">
						<p class="text-sm text-slate-500">No active pairing code.</p>
						<p class="mt-2 text-sm text-slate-500">
							Generate one when you are ready to connect your phone.
						</p>
					</div>
				{/if}
			</div>
		</div>
	</section>
</main>
