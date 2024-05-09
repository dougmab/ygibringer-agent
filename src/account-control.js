const sendBtn = document.querySelector("#success-btn");
const userInput = document.querySelector("#login");
const passInput = document.querySelector("#password")

const showBtn = document.querySelector(".show-icon");
let isPasswordShowing = false;
const passwordCensor = "********";

const setProfile = () => {
    console.log("Setting profile");

    chrome.runtime.sendMessage({ action: "get_account" }, (response) => {
        const userInput = document.querySelector("#login");
        const passInput = document.querySelector("#password")

        console.log(response, "popup");

        const { login, password } = response.account;

        console.log(login);

        userInput.textContent = login;
        passInput.textContent = passwordCensor;
        passInput.setAttribute('data-password', password);
    })
}

const togglePasswordCensor = () => {
    const onImgSrc = "/assets/img/visibility.svg";
    const offImgSrc = "/assets/img/visibility_off.svg";

    if (isPasswordShowing) {
        showBtn.src = onImgSrc;
        passInput.textContent = passwordCensor;
        isPasswordShowing = false;
        return;
    }

    showBtn.src = offImgSrc;
    passInput.textContent = passInput.dataset.password;
    isPasswordShowing = true;
}

const sendAccountWithOkStatus = () => {
    chrome.runtime.sendMessage({ action: "send_account", status: "OK" }, (message) => {
        console.log(message)
        if (message.status != "ok") {} // TODO: Mensagem de erro no popup
        
        // TODO: Mensagem de operação bem-sucedida
        chrome.runtime.sendMessage({ action: "next_account" }, (message) => {
            if (message.status == "ok") setProfile();
        })
    })
}

sendBtn.addEventListener("click", sendAccountWithOkStatus)
showBtn.addEventListener("click", togglePasswordCensor)

setProfile();
