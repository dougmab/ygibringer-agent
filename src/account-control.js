const sendBtn = document.querySelector("#send-btn");
const userInput = document.querySelector("#login");
const passInput = document.querySelector("#password");

const statusSelect = document.querySelector("#status-select");

const showBtn = document.querySelector(".show-icon");
let isPasswordShowing = false;
const passwordCensor = "•••••••••";

chrome.runtime.onMessage.addListener((message, sender, response) => {
    const { action } = message;
    if (action == "get_account") setProfile();
})

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

        let isFirstOptAppended = false;
        for (const i in message.data) {
            const status = message.data[i]; 
            console.log(status);

            const option = document.createElement("option");
            option.className = `clr-${status.type == "SUCCESS" ? "gr" : "rd"}`;
            option.setAttribute("data-index", i);
            option.setAttribute("data-type", status.type);
            option.textContent = status.title;
            option.value = status.value;

            // option.addEventListener("click", updateAccount);

            if (!isFirstOptAppended) {
                statusSelect.className = `select-${status.type.toLowerCase()}-opt`;
                isFirstOptAppended = true;
            }

            statusSelect.appendChild(option);

        }

        statusSelect.addEventListener('change', (e) => {
            const select = e.target;
            const option = select.options[select.selectedIndex];
            console.log(option);

            select.className = `select-${option.dataset.type.toLowerCase()}-opt`;
          });
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
    chrome.runtime.sendMessage({ action: "update_account", status: statusSelect.options[statusSelect.selectedIndex].dataset.index }, (message) => {
        console.log(message);
        if (!message.success) {} // TODO: Mensagem de erro no popup

        if (isPasswordShowing) togglePasswordCensor();
        
        // console.log(message, "Account updated popup")
        setProfile();

        // TODO: Mensagem de operação bem-sucedida
        // chrome.runtime.sendMessage({ action: "next_account" }, (message) => {
        // })
        // update_account agora pega a próxima conta
    })
}

sendBtn.addEventListener("click", updateAccount)
showBtn.addEventListener("click", togglePasswordCensor)

setProfile();
getCustomStatus();
