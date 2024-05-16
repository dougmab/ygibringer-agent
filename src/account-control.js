const sendBtn = document.querySelector("#success-btn");
const userInput = document.querySelector("#login");
const passInput = document.querySelector("#password");

const statusGroup = document.querySelector(".status-group");

const showBtn = document.querySelector(".show-icon");
let isPasswordShowing = false;
const passwordCensor = "********";

const setProfile = () => {
    console.log("Setting profile");

    chrome.runtime.sendMessage({ action: "get_account" }, (response) => {
        const userInput = document.querySelector("#login");
        const passInput = document.querySelector("#password");

        console.log(response, "popup");

        const { login, password } = response.data;

        console.log(login);

        userInput.textContent = login;
        passInput.textContent = passwordCensor;
        passInput.setAttribute('data-password', password);
    })
}

const getCustomStatus = () => {
    chrome.runtime.sendMessage({ action: "get_status" }, (message) => {

        if (!message.success) return;

        for (const i in message.data) {
            const status = message.data[i]; 
            console.log(status);

            const btn = document.createElement("button");
            btn.className = `status-btn clr-${status.type == "SUCCESS" ? "gr" : "rd"}`;
            btn.setAttribute("data-index", i);
            btn.textContent = status.title;

            btn.addEventListener("click", updateAccount);

            statusGroup.querySelector("." + status.type.toLowerCase()).appendChild(btn);
        }
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

const updateAccount = (event) => {
    console.log(event.target.dataset.index);
    chrome.runtime.sendMessage({ action: "update_account", status: event.target.dataset.index }, (message) => {
        console.log(message);
        if (!message.success) {} // TODO: Mensagem de erro no popup

        if (isPasswordShowing) togglePasswordCensor();

        // TODO: Mensagem de operação bem-sucedida
        // chrome.runtime.sendMessage({ action: "next_account" }, (message) => {
        //     if (message.success) setProfile();
        // })
        // update_account agora pega a próxima conta
    })
}

// sendBtn.addEventListener("click", sendAccountWithOkStatus)
showBtn.addEventListener("click", togglePasswordCensor)

setProfile();
getCustomStatus();
