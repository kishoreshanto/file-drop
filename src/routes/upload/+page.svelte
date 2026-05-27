<script lang="ts">
	import { onMount } from 'svelte';
	import FilePicker from '$lib/components/FilePicker.svelte';
	import UploadProgress from '$lib/components/UploadProgress.svelte';
	import UploadQueue from '$lib/components/UploadQueue.svelte';
	import UploadResult from '$lib/components/UploadResult.svelte';
	import type { PageProps } from './$types';

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

	let { data }: PageProps = $props();

	let files = $state<File[]>([]);
	let clientErrors = $state<string[]>([]);
	let uploading = $state(false);
	let progress = $state(0);
	let status = $state('Ready');
	let currentFileIndex = $state(0);
	let accepted = $state<UploadAccepted[]>([]);
	let rejected = $state<UploadRejected[]>([]);

	const blockedExtensions = new Set(['.app', '.dmg', '.pkg', '.sh', '.command', '.exe']);

	onMount(() => {
		function warnBeforeUnload(event: BeforeUnloadEvent) {
			if (!uploading) return;

			event.preventDefault();
			event.returnValue = '';
		}

		window.addEventListener('beforeunload', warnBeforeUnload);

		return () => {
			window.removeEventListener('beforeunload', warnBeforeUnload);
		};
	});

	function formatLimit(bytes: number) {
		return `${Math.round(bytes / 1024 / 1024)} MB`;
	}

	function getExtension(filename: string) {
		const index = filename.lastIndexOf('.');
		return index >= 0 ? filename.slice(index).toLowerCase() : '';
	}

	function hasPathLikeName(filename: string) {
		return filename.includes('/') || filename.includes('\\') || filename.split('.').includes('');
	}

	function validateSelection(nextFiles: File[]) {
		const errors: string[] = [];

		if (nextFiles.length > data.limits.maxFilesPerBatch) {
			errors.push(`Select ${data.limits.maxFilesPerBatch} files or fewer.`);
		}

		for (const file of nextFiles) {
			if (file.size > data.limits.maxFileSizeBytes) {
				errors.push(`${file.name} is larger than ${formatLimit(data.limits.maxFileSizeBytes)}.`);
			}

			if (blockedExtensions.has(getExtension(file.name))) {
				errors.push(`${file.name} has a blocked file extension.`);
			}

			if (hasPathLikeName(file.name)) {
				errors.push(`${file.name} is not a safe filename.`);
			}
		}

		return errors;
	}

	function handleFilesChange(nextFiles: File[]) {
		files = nextFiles;
		clientErrors = validateSelection(nextFiles);
		status = nextFiles.length > 0 ? 'Ready to upload' : 'Ready';
	}

	function uploadFile(file: File, index: number, total: number) {
		return new Promise<void>((resolve) => {
			const request = new XMLHttpRequest();
			const body = new FormData();

			body.append('files', file, file.name);

			currentFileIndex = index + 1;
			progress = 0;
			status = `Uploading ${index + 1} of ${total}: ${file.name}`;

			request.upload.onprogress = (event) => {
				if (event.lengthComputable) {
					progress = (event.loaded / event.total) * 100;
				}
			};

			request.onload = () => {
				progress = 100;

				try {
					const payload = JSON.parse(request.responseText) as {
						accepted?: UploadAccepted[];
						rejected?: UploadRejected[];
						message?: string;
					};

					accepted = [...accepted, ...(payload.accepted ?? [])];
					rejected = [...rejected, ...(payload.rejected ?? [])];

					if (request.status < 200 || request.status >= 300) {
						rejected = [
							...rejected,
							{
								originalName: file.name,
								error: payload.message ?? 'Upload failed.'
							}
						];
					}
				} catch {
					rejected = [
						...rejected,
						{
							originalName: file.name,
							error: 'Upload response could not be read.'
						}
					];
				}

				resolve();
			};

			request.onerror = () => {
				rejected = [
					...rejected,
					{
						originalName: file.name,
						error: 'Network error while uploading this file.'
					}
				];
				resolve();
			};

			request.onabort = () => {
				rejected = [
					...rejected,
					{
						originalName: file.name,
						error: 'Upload was interrupted.'
					}
				];
				resolve();
			};

			request.open('POST', '/api/uploads');
			request.send(body);
		});
	}

	async function uploadSelectedFiles() {
		clientErrors = validateSelection(files);

		if (uploading || files.length === 0 || clientErrors.length > 0) {
			return;
		}

		uploading = true;
		progress = 0;
		currentFileIndex = 0;
		accepted = [];
		rejected = [];

		const selectedFiles = [...files];

		for (let index = 0; index < selectedFiles.length; index += 1) {
			await uploadFile(selectedFiles[index], index, selectedFiles.length);
		}

		uploading = false;
		progress = 100;
		status =
			rejected.length === 0
				? `Upload complete: ${accepted.length} file${accepted.length === 1 ? '' : 's'} saved`
				: `Finished with ${accepted.length} saved and ${rejected.length} failed`;
	}
</script>

<svelte:head>
	<title>Upload | File Drop</title>
</svelte:head>

<main class="min-h-svh bg-stone-50 px-5 py-8 text-slate-950">
	<section class="mx-auto flex w-full max-w-2xl flex-col gap-6">
		<header>
			<p class="text-sm font-semibold tracking-[0.2em] text-emerald-700 uppercase">Connected</p>
			<h1 class="mt-3 text-4xl font-semibold">Upload</h1>
			<p class="mt-3 text-slate-600">{data.device.name} is paired and ready.</p>
		</header>

		<FilePicker disabled={uploading} errors={clientErrors} onFilesChange={handleFilesChange} />
		<UploadQueue {files} />
		<UploadProgress {progress} {status} {uploading} />
		{#if uploading}
			<p class="text-center text-sm text-slate-500">
				Uploading file {currentFileIndex} of {files.length}. Keep this page open until it finishes.
			</p>
		{/if}
		<UploadResult {accepted} {rejected} />

		<button
			class="rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
			disabled={uploading || files.length === 0 || clientErrors.length > 0}
			onclick={uploadSelectedFiles}
		>
			{uploading ? 'Uploading' : 'Upload selected files'}
		</button>
	</section>
</main>
