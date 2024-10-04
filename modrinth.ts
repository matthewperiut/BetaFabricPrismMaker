export const downloadModrinth = async (modrinth_id: string) => {
    const gameVersion = "b1.7.3";
    const loader = "fabric";
  
      try {
        const response = await fetch(`https://api.modrinth.com/v2/project/${modrinth_id}/version?game_versions=["${gameVersion}"]&loaders=["${loader}"]`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const fileData = data[0].files[0];
        console.log(fileData.url)
      }
      catch (err) {
        console.log(`${modrinth_id} -> Not Available (or Unknown error)`);
        // console.error(err); // Uncomment for debugging purposes
      }
  };
  
await downloadModrinth("accessory-api");