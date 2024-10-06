import { serveFile } from "https://deno.land/std@0.212.0/http/file_server.ts";
import { serve } from "https://deno.land/std@0.212.0/http/server.ts";
import { exists } from "https://deno.land/std@0.146.0/fs/mod.ts";
import { getModHTML } from "./card.ts"
import { createPrismInstance } from "./create.ts";

// Function to read a file and inject custom HTML
async function injectHtmlIntoFile(filePath: string, htmlToInsert: string): Promise<string> {
    const fileContent = await Deno.readTextFile(filePath); // Using Deno.readTextFile directly
    return injectHtml(fileContent, htmlToInsert);
}

// Function to inject HTML into the content at a specific placeholder
function injectHtml(content: string, htmlToInsert: string): string {
    // Replace the <!--INSERT HERE--> placeholder with the custom HTML
    return content.replace("<!--INSERT HERE-->", htmlToInsert);
}

async function handler(req: Request): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === "/") {
        // Custom HTML to insert
        const htmlToInsert = getModHTML();
        const modifiedHtml = await injectHtmlIntoFile("./public/index.html", htmlToInsert);
        // Return the modified HTML response
        return new Response(modifiedHtml, {
            headers: { "content-type": "text/html" },
        });
    } else if (url.pathname.endsWith(".png")) {
        return await serveFile(req, "./public/img" + url.pathname);
    } else if (url.pathname === "/style.css") {
        return await serveFile(req, "./public/style.css");
    } else if (url.pathname === "/share.css") {
        return await serveFile(req, "./public/share.css");
    } else if (url.pathname === "/download" && req.method === "POST") {
        // Parse the JSON body from the request
        const { mods, icon, instanceName } = await req.json();

        // Log the received data to the server console
        // console.log("Instance Name:", instanceName);
        // console.log("Selected Icon Number:", icon);
        // console.log("Selected Mods:", mods);

        let a = await createPrismInstance(mods, icon, instanceName);
        // Return the generated URL in the response
        return new Response(JSON.stringify({ message: a }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        });
    } else if (url.pathname.startsWith("/share/")) {
        const u = new URL(req.url);

        if (url.pathname.endsWith(".zip")) {
            let localPath = url.pathname.replace("/share", "./instances");
            localPath = replaceAll(localPath, "%20", " ");
            console.log(localPath);
            return await serveFile(req, localPath);
        }

        let ending = u.pathname.split('/').pop();
        if (ending) {
            const folderPath = `./instances/${ending}`;

            // Check if the folder exists
            const folderExists = await exists(folderPath);

            // If the folder doesn't exist, return 404
            if (!folderExists) {
                return new Response("404 Not Found", { status: 404 });
            }
            else {
                return await serveFile(req, "./public/share.html");
            }
        }
        return new Response("404 Not Found", { status: 404 });
    } else if (url.pathname === "/video.mp4") {
        const filePath = "./public/video.mp4";
        const fileResponse = await serveFile(req, filePath);

        const headers = new Headers(fileResponse.headers);
        headers.set("Cache-Control", "public, max-age=2628000"); // Cache for 1 month

        return new Response(fileResponse.body, {
            status: fileResponse.status,
            statusText: fileResponse.statusText,
            headers,
        });
    } else if (url.pathname === "/getName") {
        const { id } = await req.json();
        let path = await findFirstZipFileInFolder("./instances/" + id);
        if (path) {
            return new Response(JSON.stringify({ message: path.split('/').pop() }), {
                headers: { "Content-Type": "application/json" },
                status: 200,
            });
        } else {
            return new Response(JSON.stringify({ message: "undefined" }), {
                headers: { "Content-Type": "application/json" },
                status: 404,
            });
        }
    } else if (url.pathname === "/favicon.ico") {
        return await serveFile(req, "./public/favicon.ico");
    } else {
        return new Response("404 Not Found", { status: 404 });
    }
}

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
}

async function findFirstZipFileInFolder(folder: string): Promise<string | null> {
    for await (const dirEntry of Deno.readDir(folder)) {
        if (dirEntry.isFile && dirEntry.name.endsWith(".zip")) {
            console.log(folder + "/" + dirEntry.name);
            return folder + "/" + dirEntry.name;
        }
    }
    return null; // Return null if no .zip file is found
}

const port = 8080;
console.log(`Server running on http://localhost:${port}`);
await serve(handler, { port });
