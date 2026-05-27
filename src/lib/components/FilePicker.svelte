<script lang="ts">
	type Props = {
		disabled?: boolean;
		errors?: string[];
		onFilesChange: (files: File[]) => void;
	};

	let { disabled = false, errors = [], onFilesChange }: Props = $props();

	function handleChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		onFilesChange(Array.from(input.files ?? []));
	}
</script>

<div class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
	<label class="block">
		<span class="text-sm font-semibold text-slate-700">Choose photos or files</span>
		<input
			class="mt-3 block w-full rounded-lg border border-slate-300 text-sm file:mr-4 file:border-0 file:bg-emerald-600 file:px-4 file:py-3 file:text-sm file:font-semibold file:text-white"
			type="file"
			name="files"
			accept="image/*,.pdf,.txt,.docx,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
			multiple
			{disabled}
			onchange={handleChange}
		/>
	</label>

	{#if errors.length > 0}
		<div class="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
			{#each errors as error (error)}
				<p class="text-sm text-red-700">{error}</p>
			{/each}
		</div>
	{/if}
</div>
