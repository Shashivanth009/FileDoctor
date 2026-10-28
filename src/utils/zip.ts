import { zipSync, strToU8 } from 'fflate';

export type ZipEntry = {
  fileName: string;
  data: Uint8Array | Blob;
};

/**
 * Create a ZIP archive from an array of entries.
 * Returns a Blob of the ZIP file.
 */
export async function createZip(entries: ZipEntry[]): Promise<Blob> {
  const files: Record<string, Uint8Array> = {};

  for (const entry of entries) {
    let data: Uint8Array;
    if (entry.data instanceof Blob) {
      const ab = await entry.data.arrayBuffer();
      data = new Uint8Array(ab);
    } else {
      data = entry.data;
    }
    files[entry.fileName] = data;
  }

  const zipped = zipSync(files, { level: 6 });
  return new Blob([zipped], { type: 'application/zip' });
}

export { strToU8 };
