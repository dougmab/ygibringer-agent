// opções
const serverUrl = document.querySelector("#server-url");
const autoLogin = document.querySelector("#auto-login");
const redirectCreator = document.querySelector("#redirect-creator");

const saveBtn = document.querySelector("#save-btn");

chrome.runtime.sendMessage({ action: "get_settings" }, (settings) => {
    console.log("Settings", settings)
    if (settings.serverUrl) serverUrl.value = settings.serverUrl;
    if (settings.autoLogin) autoLogin.checked = settings.autoLogin;
    if (settings.redirectCreator) redirectCreator.checked = settings.redirectCreator;
})

saveBtn.addEventListener("click", () => {
    const settings = {
        serverUrl: serverUrl.value,
        autoLogin: autoLogin.checked,
        redirectCreator: redirectCreator.checked
    };

    chrome.runtime.sendMessage({ action: "save_settings", settings }, () => {
        console.log("Saved", settings);
    })
})
