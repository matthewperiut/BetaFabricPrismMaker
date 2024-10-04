import { downloadLatestBabric, downloadLatestJar, downloadLatestModrinthJar } from "./download.ts";
import { ModInfo, mods } from "./card.ts";
import { ensureDir, exists } from "https://deno.land/std@0.110.0/fs/mod.ts";
import { copy, move } from "https://deno.land/std@0.110.0/fs/mod.ts";
import { join } from "https://deno.land/std@0.110.0/path/mod.ts";
import { expandGlob } from "https://deno.land/std@0.110.0/fs/mod.ts"; // To find all .jar files in a directory

// Utility function to generate a random 6-character alphanumeric string
function generateRandomString(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

// Create Prism Instance
export async function createPrismInstance(mod_ids: string[], icon_id: Number, instance_name: string): Promise<string> {
    // Ensure ./instance folder exists
    await ensureDir('./instances');

    if (instance_name == "") {
        instance_name = "Modded b1.7.3"
    }

    // Generate a random 6-character string
    const randomStr = generateRandomString(6);
    const instancePath = `./instances/${randomStr}`;

    // Check if instancePath exists, if not, proceed with generating files
    if (!(await exists(instancePath))) {
        // Start the async generation of files in the background without blocking the return
        generateFiles(mod_ids, icon_id, instance_name, randomStr)
            .catch(error => console.error("Error in generateFiles:", error));
    } else {
        return createPrismInstance(mod_ids, icon_id, instance_name);
    }

    await ensureDir(instancePath);

    // Return the path (this happens immediately, without waiting for generateFiles to finish)
    return randomStr;
}

function getInstanceCfg(icon_number: Number): string {
    return "InstanceType=OneSix\n" +
    "name=babric b1.7.3\n" +
    "iconKey=betaicon_" + icon_number + "\n";
}

function getModsAndDependencies(mod_ids: string[]): ModInfo[] {
    const result: ModInfo[] = [];
    const processedModIds = new Set<string>(); // Keep track of processed mod IDs to avoid duplicates or cycles

    function processMod(mod_id: string) {
        // If this mod has already been processed, skip it
        if (processedModIds.has(mod_id)) {
            return;
        }

        // Find the mod in the global `mods` array
        const mod = mods.find(m => m.id === mod_id);
        if (!mod) {
            console.warn(`Mod with ID "${mod_id}" not found in the mods collection.`);
            return; // If mod not found, skip it
        }

        // Mark this mod as processed to avoid re-processing it in the future
        processedModIds.add(mod_id);

        // Add the mod to the result array before processing its dependencies
        result.push(mod);

        // Recursively process dependencies if they exist
        if (mod.dependencies) {
            Object.keys(mod.dependencies).forEach(dependency_id => processMod(dependency_id));
        }
    }

    // Start the recursive process for each mod_id provided
    mod_ids.forEach(mod_id => processMod(mod_id));

    return result;
}

async function generateFiles(mod_ids: string[], icon_id: Number, instance_name: string, location: string) {
    // Create a new ModInfo[] by matching mod_ids to ModInfo.id in the array mods
    mod_ids.push("stationapi");
    mod_ids.push("gcapi3");
    mod_ids.push("gambac");
    mod_ids.push("mojangfixstationapi");
    mod_ids.push("stapi-fast-intro");
    mod_ids.push("unitweaks");
    mod_ids.push("glassnetworking")
    const selectedMods: ModInfo[] = getModsAndDependencies(mod_ids);

    // stored as ./temp/prism/babric-b1.7.3.zip
    await downloadLatestBabric("Glass-Series/babric-prism-instance", "prism");

    // Create folder if it doesn't exist, "./instances"
    await ensureDir('./instances');

    // Create folder "./instances/${location}"
    await ensureDir(`./instances/${location}`);

    // Copy ./temp/prism/babric-b1.7.3.zip to ./instances/${location}/${instance_name}.zip
    const zipSrcPath = './temp/prism/babric-b1.7.3.zip';
    const zipDestPath = `./instances/${location}/${instance_name}.zip`;
    await copy(zipSrcPath, zipDestPath);

    // Unzip the downloaded prism instance
    const zipExtractedPath = `./instances/${location}/${instance_name}`;
    await Deno.run({
        cmd: ["unzip", zipDestPath, "-d", zipExtractedPath]
    }).status();

    // Copy ./public/img/${icon_id}.png to ./instances/${location}/${instance_name}/${icon_id}.png
    const iconSrcPath = `./public/img/betaicon_${icon_id}.png`;
    const iconDestPath = `${zipExtractedPath}/betaicon_${icon_id}.png`;
    await copy(iconSrcPath, iconDestPath);

    // Create a text file, the contents given by getInstanceCfg(icon_id)
    const instanceCfgContent = getInstanceCfg(icon_id);
    const instanceCfgPath = `${zipExtractedPath}/instance.cfg`;
    await Deno.writeTextFile(instanceCfgPath, instanceCfgContent);

    // Ensure the .minecraft/mods folder exists
    const modsDir = `${zipExtractedPath}/.minecraft/mods`;
    await ensureDir(modsDir);

    // gcapi2, TO BE DEPRECATED
    await copy("./adjustments/GlassConfigAPI-2.0.2.jar", `${modsDir}/GlassConfigAPI-2.0.2.jar`);
    // end gcapi2

    // Keep minecraft as vanilla-looking as possible, disable intrusive mod customizations
    await copy("./adjustments/config", `${zipExtractedPath}/.minecraft/config`);
    // end

    for (let i = 0; i < selectedMods.length; i++) {
        let m = selectedMods[i];
        if (m.modrinth_id != undefined) {
            await downloadLatestModrinthJar(m.id, m.modrinth_id);
        } else {
            await downloadLatestJar(m.id, m.repo);
        }
        const modPath = `./temp/${m.id}/`;
        for await (const file of expandGlob(`${modPath}/*.jar`)) {
            const modJarDestPath = `${modsDir}/${file.name}`;
            await copy(file.path, modJarDestPath);
        }
    }

    // Zip everything back into the destination zip file
    await Deno.run({
        cmd: ["zip", "-r", `../${instance_name}.zip`, "."],
        cwd: zipExtractedPath
    }).status();

    // Clean up the extracted folder
    await Deno.remove(zipExtractedPath, { recursive: true });
}

