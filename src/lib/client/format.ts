export function formatBytes(bytes: number) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function formatDateTime(timestamp: number | null | undefined) {
	if (!timestamp) return 'Never';

	return new Date(timestamp).toLocaleString();
}

export function categoryFromStoredPath(storedPath: string) {
	return storedPath.split('/')[0] || 'other';
}
