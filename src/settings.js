// opções
const serverUrl = document.querySelector("#server-url");
const autoLogin = document.querySelector("#auto-login");
const autoSuccess = document.querySelector("#auto-success");
const autoWrongPassword = document.querySelector("#auto-wrong-password");
const redirectCreator = document.querySelector("#redirect-creator");
const username = document.querySelector("#username");

const notification = document.querySelector(".notification");

const saveBtn = document.querySelector("#save-btn");

chrome.runtime.sendMessage({ action: "get_settings" }, (settings) => {
    console.log("Settings", settings)
    if (settings.username) username.value = settings.username;
    if (settings.serverUrl) serverUrl.value = settings.serverUrl;
    if (settings.autoLogin) autoLogin.checked = settings.autoLogin;
    if (settings.autoSuccess) autoSuccess.checked = settings.autoSuccess;
    if (settings.redirectCreator) redirectCreator.checked = settings.redirectCreator;
    if (settings.autoWrongPassword) autoWrongPassword.checked = settings.autoWrongPassword;
})

saveBtn.addEventListener("click", () => {
    const settings = {
        username: username.value,
        serverUrl: serverUrl.value,
        autoLogin: autoLogin.checked,
        autoWrongPassword: autoWrongPassword.checked,
        redirectCreator: redirectCreator.checked,
        autoSuccess: autoSuccess.checked
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
