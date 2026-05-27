<script lang="ts">
	type UploadAccepted = {
		originalName: string;
		storedPath: string;
		mimeType: string;
		sizeBytes: number;
	};

	type UploadRejected = {
		originalName: string;
		error: string;
	};

	type Props = {
		accepted: UploadAccepted[];
		rejected: UploadRejected[];
	};

	let { accepted, rejected }: Props = $props();
</script>

{#if accepted.length > 0 || rejected.length > 0}
	<div class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
		<p class="text-sm font-semibold text-slate-700">Upload results</p>

		{#if accepted.length > 0}
			<div class="mt-4">
				<p class="text-sm font-semibold text-emerald-700">Accepted</p>
				<ul class="mt-2 divide-y divide-emerald-100">
					{#each accepted as file (file.storedPath)}
						<li class="py-2">
							<p class="text-sm font-medium text-slate-800">{file.originalName}</p>
							<p class="mt-1 text-xs text-slate-500">{file.storedPath}</p>
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		{#if rejected.length > 0}
			<div class="mt-4">
				<p class="text-sm font-semibold text-red-700">Rejected</p>
				<ul class="mt-2 divide-y divide-red-100">
					{#each rejected as file (`${file.originalName}-${file.error}`)}
						<li class="py-2">
							<p class="text-sm font-medium text-slate-800">{file.originalName}</p>
							<p class="mt-1 text-xs text-red-700">{file.error}</p>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
{/if}
