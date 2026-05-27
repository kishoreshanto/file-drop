<script lang="ts">
	type Props = {
		progress: number;
		status: string;
		uploading: boolean;
	};

	let { progress, status, uploading }: Props = $props();
</script>

<div class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
	<div class="flex items-center justify-between">
		<p class="text-sm font-semibold text-slate-700">Transfer</p>
		<p class="text-sm text-slate-500">{Math.round(progress)}%</p>
	</div>
	<div class="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
		<div
			class="h-full rounded-full bg-emerald-600 transition-[width]"
			style={`width: ${Math.max(0, Math.min(100, progress))}%`}
		></div>
	</div>
	<p class="mt-3 text-sm text-slate-500">{status || (uploading ? 'Uploading' : 'Ready')}</p>
</div>
