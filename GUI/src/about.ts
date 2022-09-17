import { shell } from "electron";

let mainwiki = document.getElementById("mainwiki");
let gsswiki = document.getElementById("gsswiki");
let github = document.getElementById("github");

mainwiki.addEventListener('click', () => {
    shell.openExternal("https://wiki.illinois.edu/wiki/display/ILSPACESOC/Illinois+Space+Society");
})

gsswiki.addEventListener('click', () => {
    shell.openExternal("https://wiki.illinois.edu/wiki/display/ILSPACESOC/Ground+Station+GUI+Software");
})

github.addEventListener('click', () => {
    shell.openExternal("https://github.com/ISSUIUC/GroundStation");
})