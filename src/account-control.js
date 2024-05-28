const sendBtn = document.querySelector("#send-btn");
const userInput = document.querySelector("#login");
const passInput = document.querySelector("#password");

const notification = document.querySelector(".notification");

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

        if (!response.success) {
            displayNotification(response.message);
            return;
        }

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
    chrome.runtime.sendMessage({ action: "get_status" }, (response) => {
        if (!response.success) return;

        let isFirstOptAppended = false;
        for (const i in response.data) {
            const status = response.data[i]; 
            console.log(status);

            const option = document.createElement("option");
            option.className = `clr-${status.type == "SUCCESS" ? "gr" : "rd"}`;
            option.setAttribute("data-index", i);
            option.setAttribute("data-type", status.type);
            option.textContent = status.title;
            option.value = status.value;

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
    sendBtn.disabled = true;
    chrome.runtime.sendMessage({ action: "update_account", status: statusSelect.options[statusSelect.selectedIndex].dataset.index }, (response) => {
        if (!response.success) displayNotification(response.message);
        if (isPasswordShowing) togglePasswordCensor();
        setProfile();

        setTimeout(() => sendBtn.disabled = false, 1000);
    })
}

sendBtn.addEventListener("click", updateAccount)
showBtn.addEventListener("click", togglePasswordCensor)

const displayNotification = (message) => {
    notification.innerText = message;
    notification.style.animation = "fade-out 5s alternate"
    setTimeout(() => {
        notification.innerText = "";
        notification.style.animation = 'none';
    }, 5000)
}

setProfile();
getCustomStatus();
