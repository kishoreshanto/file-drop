<svelte:head>
	<title>File Drop</title>
	<meta
		name="description"
		content="Local Android-to-Mac file transfer running on your private network."
	/>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<link
		href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,650&family=Source+Sans+3:wght@400;500;600&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<main
	class="relative min-h-svh overflow-hidden bg-gradient-to-br from-amber-50 via-white to-emerald-50 text-slate-900"
>
	<div
		class="pointer-events-none absolute -left-24 top-0 h-64 w-64 rounded-full bg-emerald-100/70 blur-3xl"
		aria-hidden="true"
	></div>
	<div
		class="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-sky-100/80 blur-3xl"
		aria-hidden="true"
	></div>

	<section
		class="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10 sm:px-10 lg:flex-row lg:items-center lg:justify-between lg:gap-16"
		style="font-family: 'Source Sans 3', sans-serif;"
	>
		<div class="flex flex-col gap-6 lg:max-w-xl">
			<div class="flex items-center gap-3">
				<div
					class="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-100 bg-white/80 text-base font-semibold text-emerald-700 shadow-sm"
					aria-hidden="true"
				>
					FD
				</div>
				<p class="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
					Local transfer
				</p>
			</div>

			<div class="space-y-4">
				<h1
					class="text-4xl leading-tight text-slate-900 sm:text-6xl"
					style="font-family: 'Fraunces', serif;"
				>
					File Drop
				</h1>
				<p class="text-lg leading-8 text-slate-600 sm:text-xl">
					Local Android-to-Mac file transfer that stays on your private network.
				</p>
			</div>

			<p class="text-base leading-7 text-slate-500">
				Server is running. Keep this Mac online, then open the local address from your
				Android phone when pairing and uploads are enabled.
			</p>

			<div class="flex flex-wrap gap-3">
				<span
					class="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1 text-sm font-semibold text-emerald-700"
				>
					Server ready
				</span>
				<span
					class="rounded-full border border-slate-200 bg-white/70 px-4 py-1 text-sm font-semibold text-slate-600"
				>
					Local Wi-Fi only
				</span>
			</div>
		</div>

		<div
			class="w-full max-w-md rounded-3xl border border-white/70 bg-white/80 p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur"
		>
			<div class="space-y-5">
				<div class="flex items-center justify-between">
					<p class="text-sm font-semibold text-slate-500">Connection</p>
					<p class="text-sm font-semibold text-emerald-700">Online</p>
				</div>
				<div class="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
				<div class="space-y-4">
					<div class="flex items-start justify-between gap-6">
						<div>
							<p class="text-sm text-slate-500">Runtime</p>
							<p class="mt-2 text-base font-semibold text-slate-900">SvelteKit Node</p>
						</div>
						<div class="text-right">
							<p class="text-sm text-slate-500">Mode</p>
							<p class="mt-2 text-base font-semibold text-slate-900">Receiver</p>
						</div>
					</div>
					<div class="flex items-start justify-between gap-6">
						<div>
							<p class="text-sm text-slate-500">Network</p>
							<p class="mt-2 text-base font-semibold text-slate-900">Local Wi-Fi only</p>
						</div>
						<div class="text-right">
							<p class="text-sm text-slate-500">Status</p>
							<p class="mt-2 text-base font-semibold text-emerald-700">Server is running</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
</main>
