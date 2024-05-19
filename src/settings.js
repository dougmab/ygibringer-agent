// opções
const serverUrl = document.querySelector("#server-url");
const autoLogin = document.querySelector("#auto-login");
const redirectCreator = document.querySelector("#redirect-creator");
const username = document.querySelector("#username");

const notification = document.querySelector(".notification");

const saveBtn = document.querySelector("#save-btn");

chrome.runtime.sendMessage({ action: "get_settings" }, (settings) => {
    console.log("Settings", settings)
    if (settings.username) username.value = settings.username;
    if (settings.serverUrl) serverUrl.value = settings.serverUrl;
    if (settings.autoLogin) autoLogin.checked = settings.autoLogin;
    if (settings.redirectCreator) redirectCreator.checked = settings.redirectCreator;
})

saveBtn.addEventListener("click", () => {
    const settings = {
        username: username.value,
        serverUrl: serverUrl.value,
        autoLogin: autoLogin.checked,
        redirectCreator: redirectCreator.checked
    };

    chrome.runtime.sendMessage({ action: "save_settings", settings }, () => {
        console.log("Saved", settings);
    })

    displayNotification("Configurações salvas")
})

const displayNotification = (message) => {
    notification.innerText = message;
    notification.style.animation = "fade-out 5s alternate"
    setTimeout(() => {
        notification.innerText = "";
        notification.style.animation = 'none';
    }, 5000)
}
