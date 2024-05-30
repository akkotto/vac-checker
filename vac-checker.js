const axios = require('axios');
const fs = require('fs-extra');
const readline = require('readline');

const rl = readline.createInterface({input: process.stdin, output: process.stdout});

(async function()
{
    try
    {
        const data = await fs.readFile('config.json', 'utf8');
        const config = JSON.parse(data);
        const maFileFolderPath = await new Promise((resolve, _) => {
            rl.question('\x1b[33mПуть до папки с maFiles: \x1b[0m', answer => {
                resolve(answer);
            })
        });
        let steam64Ids = [];
        const maFileFolderFiles = await fs.readdir(maFileFolderPath);
        for (const file of maFileFolderFiles) {
            if (file.indexOf('maFile') !== -1) {
                const parsedMaFile = String((await fs.readFile(`${maFileFolderPath}\\${file}`))).match(/76561[0-9]{12}/);
                if (parsedMaFile.length === 1) {
                    steam64Ids.push(parsedMaFile[0]);
                } else {
                    console.log(`Не смог спарсить файл ${file}`);
                }
            }
        }
        if (!config.apiKey || config.apiKey.trim() === '')
        {
            console.log('APIKEY не найден.');
            return;
        }
		let countAll = steam64Ids.length;
		let countBanned = 0;
        for (let id of steam64Ids)
        {
            const linkPlayerBans = `http://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?key=${config.apiKey}&steamids=${id}`;

            try
            {
                const resBans = await axios.get(linkPlayerBans);
                const playerBans = resBans.data.players[0];

                if (!playerBans)
                {
                    console.log(`Error fetching ban data for player: ${id}`);
                    continue;
                }

                if (playerBans.VACBanned || playerBans.CommunityBanned || playerBans.NumberOfGameBans != 0)
                {
                    console.log(`\x1b[31mPlayer: ${id} | ✖\x1b[0m`);
					countBanned++;
                }
                else
                {
                    console.log(`\x1b[32mPlayer: ${id} | ✔\x1b[0m`);
                }
            }
            catch(error)
            {
                console.log(`Error fetching data for player: ${id}`);
            }
        }
		console.log(`Stats: ${countBanned} из ${countAll} забанено`);
    }
    catch(error)
    {
        console.log(error);
        console.log('The config.json file does not exist.');
        return;
    }
    finally
    {
        rl.close();

        console.log('Press any key to exit...');
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.on('data', process.exit.bind(process, 0));
    }
})();