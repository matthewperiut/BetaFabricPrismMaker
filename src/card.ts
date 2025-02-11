export interface ModInfo {
    id: string;
    title?: string;
    description: string;
    icon: string;
    repo: string;
    dependencies?: Record<string, string>;
    api?: boolean
    branch: string;
    modrinth_id?: string;
    hide?: boolean;
}

interface ModEntry {
    repo: string;
    branch: string;
    modrinth_id?: string;
    hide?: boolean;
}

const mod_entries: ModEntry[] = [
    { repo: "calmilamsy/ModMenu", branch: "b1.7.3", modrinth_id: "modmenu-beta" },
    { repo: "matthewperiut/accessory-api", branch: "master", modrinth_id: "accessory-api" },
    { repo: "matthewperiut/aether-fabric-b1.7.3", branch: "master", modrinth_id: "aether-stapi" },
    // needs updating to stapi alpha 3
    // { repo: "DanyGames2014/Tropicraft", branch: "master", modrinth_id: "tropicraft-stationapi" },
    // SERVER LOGIN COMPAT, ACCESSES SCREEN { repo: "kozibrodka/MoCreatures", branch: "master" },
    { repo: "matthewperiut/retrocommands", branch: "master", modrinth_id: "retrocommands" },
    { repo: "paulevsGitch/BHCreative", branch: "stapi-2.0", modrinth_id: "bh-creative" },
    { repo: "paulevsGitch/BetterWeather", branch: "main", modrinth_id: "betterweather" },
    { repo: "matthewperiut/babric-sprint", branch: "master" },
    { repo: "telvarost/UniTweaksTelsAddons-StationAPI", branch: "main", modrinth_id: "unitweakstelsaddons-stationapi"},
    { repo: "telvarost/MiscTweaks-StationAPI", branch: "main", modrinth_id: "misctweaks-stationapi"},
    { repo: "telvarost/MojangFix-StationAPI", branch: "stationapi-config", modrinth_id: "mojangfix-stationapi-edition", hide: true },
    { repo: "matthewperiut/retroauth", branch: "master", hide: true },
    { repo: "telvarost/InventoryTweaks-StationAPI", branch: "main", modrinth_id: "inventorytweaks" },
    { repo: "Glass-Series/Always-More-Items", branch: "master", modrinth_id: "always-more-items" },
    { repo: "calmilamsy/HowManyItems-Fabric-Unofficial", branch: "master", modrinth_id: "howmanyitems-fabric" },
    { repo: "DanyGames2014/spawneggs", branch: "master", modrinth_id: "spawn-eggs" },
    { repo: "telvarost/TelsDrinks-StationAPI", branch: "main" },
    { repo: "Atilist/SpookySquashLands", branch: "master" },
    // needs updating to stapi alpha 3
    // { repo: "paulevsGitch/PumpkinMoon", branch: "main" },
    // needs updating to stapi alpha 3 and accessory api 0.7.1
    // { repo: "KydZombie/crimson-forest", branch: "master" },
    { repo: "matthewperiut/thirdpersonfix-fabric-b1.7.3", branch: "master", modrinth_id: "thirdpersonfix-babric" },
    { repo: "matthewperiut/midastouch-fabric-b1.7.3", branch: "master" },
    { repo: "ModificationStation/StationAPI", branch: "master", modrinth_id: "stationapi", hide: true },
    { repo: "Glass-Series/glass-config-api", branch: "master", modrinth_id: "glass-config-api" },
    { repo: "DanyGames2014/gambac", branch: "master", modrinth_id: "gambac", hide: true },
    { repo: "viciscat/stapi-fast-intro", branch: "master", modrinth_id: "fast-stapi-intro", hide: true },
    { repo: "DanyGames2014/UniTweaks", branch: "master", modrinth_id: "unitweaks", hide: true },
    { repo: "matthewperiut/elementalcreepers-fabric-b1.7.3", branch: "master" },
    { repo: "matthewperiut/claysoldiers-fabric-b1.7.3", branch: "master" },
    // SERVER COMPAT NEEDED { repo: "kozibrodka/BetterThanWolves", branch: "master", modrinth_id: "better-than-wolves-legacy-unofficial" },
    { repo: "telvarost/SameOldSpells-StationAPI", branch: "main", modrinth_id: "sameoldspells-stationapi" },
    { repo: "ralf2oo2/netherstorage-stapi", branch: "2.0.0", modrinth_id: "nether-storage-stationapi" },
    // SERVER COMPAT NEEDED { repo: "telvarost/WhatAreYouScoring-StationAPI", branch: "main", modrinth_id: "whatareyouscoring-stationapi" },
    { repo: "telvarost/CreativeEditorWands-StationAPI", branch:"main",modrinth_id:"creativeeditorwands-stationapi"},
    // needs updating to stapi alpha 3
    // { repo: "Zekromaster/IronChests-StationAPI", branch:"trunk"},
    // needs updating to stapi alpha 3
    // { repo: "matthewperiut/crates-fabric-b1.7.3", branch:"master", modrinth_id:"crate"},
    { repo: "calmilamsy/Glass-Networking", branch:"master", modrinth_id:"glass-networking", hide: true},
    { repo: "KydZombie/voxel-shapes", branch: "master", hide: true},
    { repo: "matthewperiut/fixhandshakepacket", branch: "master", hide: true },
    { repo: "FabricMC/fabric-language-kotlin", branch: "master", hide: true },
    //{repo:"",branch:"",modrinth_id:""}
];

export const mods: ModInfo[] = []; // Define the type of the mods array

const fetchModInfo = async (entry: ModEntry): Promise<ModInfo> => {
    const modJsonUrl = `https://raw.githubusercontent.com/${entry.repo}/${entry.branch}/src/main/resources/fabric.mod.json`;
    try {
        const response = await fetch(modJsonUrl);
        if (response.ok) {
            const data = await response.json();
            const iconUrl = `https://raw.githubusercontent.com/${entry.repo}/${entry.branch}/src/main/resources/${data.icon}`;
            
            const result: ModInfo = {
                id: data.id,
                title: data.name,
                description: data.description.length > 150 ? data.description.slice(0,147) + "..." : data.description,
                icon: iconUrl,
                repo: entry.repo,
                dependencies: Object.prototype.hasOwnProperty.call(data, "depends") ? data.depends : {},
                api: data.custom ? Object.prototype.hasOwnProperty.call(data.custom, "modmenu:api") : false,
                branch: entry.branch,
                modrinth_id: entry.modrinth_id,
                hide: entry.hide
            };

            const keysToDelete = ["stationapi", "minecraft", "fabricloader"];
            keysToDelete.forEach((key) => {
                delete result.dependencies?.[key]; // Deletes the key from the object if it exists
            });

            return result;
        } else {
            console.log(response);
        }
        throw new Error(`Failed to fetch from ${entry.repo}`);
    } catch (error) {
        console.error(error);
        return { branch: entry.branch, id: "nomodid", title: "Unknown", description: "Failed to load description", icon: "", repo: entry.repo };
    }
};

const fetchAllMods = async () => {
    const promises = mod_entries.map(entry => fetchModInfo(entry));
    const results = await Promise.all(promises);
    mods.push(...results);
};

await fetchAllMods();

let cached_result = "";
export function getModHTML(): string {
    if (cached_result === "") {
        let result = "";

        /*
        result += result += '<div class="repo-card">' +
        '<img src="' + element.icon + '" class="repo-icon" alt="' + adjusted_title + ' icon">' +
        '<div class="repo-info">' +
        '<h2 class="repo-name">' + adjusted_title + '</h2>' +
        '<p class="repo-description">' + element.description + '</p>' +
        '</div>' +
        '<button class="add-button" onclick="toggleButton(this, \'' + element.id + '\')">+</button>' +
        '</div>';*/

        mods.forEach(element => {
            if (!element.api && element.hide == undefined && element.title != undefined) {
                const adjusted_title = element.title.replace(/(?<!^)([A-Z](?![A-Z\s]))/g, ' $1');
                    result += '<div class="repo-card">';
                    result += '<img src="' + element.icon + '" class="repo-icon" alt="' + adjusted_title + ' icon">' +
                    '<div class="repo-info">' +
                    '<h2 class="repo-name">' + adjusted_title + '</h2>' +
                    '<p class="repo-description">' + element.description + '</p>' +
                    '</div>' +
                    '<button class="add-button" onclick="toggleButton(this, \'' + element.id + '\')">+</button>' +
                    '</div>';
            }
    
        });
    
        cached_result = result;
        return result;
    } else {
        return cached_result;
    }
}