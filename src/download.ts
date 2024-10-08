import { ensureDir, exists } from "https://deno.land/std@0.224.0/fs/mod.ts";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export async function downloadLatestBabric(repo: string, folder_name: string): Promise<void> {
  const url = `https://api.github.com/repos/${repo}/releases/latest`;
  const downloadFolder = `./temp/${folder_name}`;
  
  if (await isRecentDownload(downloadFolder)) {
    console.log(`Recent download exists for ${folder_name}, skipping download.`);
    return;
  }
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch latest release from ${repo}`);
  }
  
  const releaseData = await response.json();
  const asset = releaseData.assets.find((asset: any) => asset.name === "babric-b1.7.3.zip");
  
  if (!asset) {
    throw new Error(`Could not find 'babric-b1.7.3.zip' in latest release assets.`);
  }

  await ensureDir(downloadFolder);
  const downloadPath = `${downloadFolder}/babric-b1.7.3.zip`;

  await downloadFile(asset.browser_download_url, downloadPath);
  await writeTimestamp(downloadFolder);
  
  console.log(`Downloaded 'babric-b1.7.3.zip' to ${downloadPath}`);
}

export async function downloadLatestJar(modid: string, repo: string): Promise<void> {
  const url = `https://api.github.com/repos/${repo}/releases/latest`;
  const downloadFolder = `./temp/${modid}`;
  
  if (await isRecentDownload(downloadFolder)) {
    console.log(`Recent download exists for ${modid}, skipping download.`);
    return;
  }
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch latest release from ${repo}`);
  }
  
  const releaseData = await response.json();
  const jarAsset = releaseData.assets.find((asset: any) => asset.name.endsWith(".jar"));
  
  if (!jarAsset) {
    throw new Error(`Could not find any '.jar' file in latest release assets.`);
  }

  await ensureDir(downloadFolder);
  const downloadPath = `${downloadFolder}/${jarAsset.name}`;

  await downloadFile(jarAsset.browser_download_url, downloadPath);
  await writeTimestamp(downloadFolder);
  
  console.log(`Downloaded '${jarAsset.name}' to ${downloadPath}`);
}

export async function downloadLatestModrinthJar(modid: string, modrinth_id: string): Promise<void> {
  const downloadFolder = `./temp/${modid}`;
  
  if (await isRecentDownload(downloadFolder)) {
    console.log(`Recent download exists for ${modid}, skipping download.`);
    return;
  }

  try {
    const gameVersion = "b1.7.3";
    const loader = "fabric";
    const response = await fetch(`https://api.modrinth.com/v2/project/${modrinth_id}/version?game_versions=["${gameVersion}"]&loaders=["${loader}"]`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Modrinth project: ${modrinth_id}`);
    }

    const data = await response.json();
    const fileData = data[0].files[0]; // Assuming the first file is the one to download
    const downloadUrl = fileData.url;
    const fileName = fileData.filename || "modrinth-mod.jar";

    await ensureDir(downloadFolder);
    const downloadPath = `${downloadFolder}/${fileName}`;

    await downloadFile(downloadUrl, downloadPath);
    await writeTimestamp(downloadFolder);

    console.log(`Downloaded '${fileName}' to ${downloadPath}`);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(`Error downloading from Modrinth (${modrinth_id}): ${err.message}`);
    }
  }
}

async function downloadFile(url: string, dest: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download file from ${url}`);
  }
  
  const file = await Deno.open(dest, { write: true, create: true });
  await response.body?.pipeTo(file.writable);
  console.log(`File saved to ${dest}`);
}

async function writeTimestamp(folder: string): Promise<void> {
  const timestampPath = `${folder}/timestamp.txt`;
  const currentTimestamp = Date.now().toString();
  await Deno.writeTextFile(timestampPath, currentTimestamp);
}

async function isRecentDownload(folder: string): Promise<boolean> {
  const timestampPath = `${folder}/timestamp.txt`;
  
  if (await exists(timestampPath)) {
    const timestamp = await Deno.readTextFile(timestampPath);
    const timestampDate = new Date(parseInt(timestamp, 10));
    const now = new Date();
    
    return (now.getTime() - timestampDate.getTime()) < ONE_DAY_MS;
  }
  
  return false;
}