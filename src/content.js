(() => {
    let submit;
    chrome.runtime.onMessage.addListener((message, sender, response) => {
        console.log(message)
        const { action, settings } = message;
        if (action == "add_button") {
            insertLoginButton(settings);
        }

        if (action == "send_suspended_status") sendSuspendedStatus(settings)
    });

    const insertLoginButton = (settings) => {
            submit = document.querySelector("button");

            if (!submit) {
                console.log("Page not loaded yet")
                setTimeout(() => insertLoginButton(settings), 10);
                return;
            }

            console.log("Page loaded");

            const loginBtnExists = document.querySelector(".login-ab-btn");

            if (loginBtnExists) return;
            
            const submitParent = submit.parentElement;
            
            const loginBtn = document.createElement("button");
            loginBtn.textContent = "Entrar com YgiBringer";
            loginBtn.className = "login-ab-btn";
            loginBtn.addEventListener("click", getCurrentAccount);

            submitParent.appendChild(loginBtn);

            console.log(settings)

            if (settings.autoLogin) loginBtn.click();

            console.log("YgiBringer login added");
        }

const getCurrentAccount = (e) => {
    e.preventDefault();
        chrome.runtime.sendMessage({ action: "get_account" }, (response) => {
        console.log(response)
        if (!response.success) {
            console.log(response.message);
            return;
        }

        const { login, password } = response.data;

        const userInput = document.querySelector('input[name="username"');
        const passInput = document.querySelector('input[name="password"');
        writeToInput(userInput, login);
        writeToInput(passInput, password);
        submit.click();
    }); 
}

    const writeToInput = (input, content, append) => {
        if (!append) input.value = ""
        input.focus();
        document.execCommand('insertText', false, content);
    }

    const sendSuspendedStatus = () => {
        console.log("Conta suspensa")
        const dateSpan = document.querySelector('span[style="padding: unset; line-height: 1.3; font-size: 12px; text-align: center; color: rgb(168, 168, 168); white-space: pre-wrap; overflow-wrap: break-word;"');

        if (!dateSpan) {
            setTimeout(sendSuspendedStatus, 50);
            return;
        }

        const dateMessage = dateSpan.innerText.trim();

        if (dateMessage) {
            console.log("Status enviado")
            chrome.runtime.sendMessage({ action: "update_account", isSuspended: true, statusMessage: dateMessage });
        }
    }
})()
