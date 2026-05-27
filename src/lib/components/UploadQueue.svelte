<script lang="ts">
	type Props = {
		files: File[];
	};

	let { files }: Props = $props();

	function formatBytes(bytes: number) {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
	}
</script>

<div class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
	<div class="flex items-center justify-between gap-4">
		<p class="text-sm font-semibold text-slate-700">Upload queue</p>
		<p class="text-sm text-slate-500">{files.length} selected</p>
	</div>

	{#if files.length === 0}
		<p class="mt-4 text-sm text-slate-500">No files selected.</p>
	{:else}
		<ul class="mt-4 divide-y divide-slate-100">
			{#each files as file (`${file.name}-${file.size}-${file.lastModified}`)}
				<li class="flex items-center justify-between gap-4 py-3">
					<p class="min-w-0 truncate text-sm font-medium text-slate-800">{file.name}</p>
					<p class="shrink-0 text-sm text-slate-500">{formatBytes(file.size)}</p>
				</li>
			{/each}
		</ul>
	{/if}
</div>
