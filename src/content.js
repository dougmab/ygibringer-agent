(() => {
    let submit;
    chrome.runtime.onMessage.addListener((message, sender, response) => {
        console.log(message)
        const { action, settings } = message;
        if (action == "add_button") insertLoginButton(settings);
        if (action == "send_suspended_status") sendSuspendedStatus(settings);
        if (action == "send_success_status") sendSuccessStatus(settings);
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
        waitForWrongPasswordWarn();
    }); 
}

    const writeToInput = (input, content, append) => {
        if (!append) input.value = ""
        input.focus();
        document.execCommand('insertText', false, content);
    }

    const waitForWrongPasswordWarn = () => {
        const wrongPassWarn = document.querySelector("._ab2z");
        if (!wrongPassWarn) {
            setTimeout(waitForWrongPasswordWarn, 300);
            return;
        }

        console.log("Senha incorreta");

        chrome.runtime.sendMessage({ action: "get_status" }, (response) => {
            console.log(response)
            if (!response.settings.autoWrongPassword) return;

            for (const i in response.data) {
                if (response.data[i].title.toLowerCase().includes("senha")) {
                    chrome.runtime.sendMessage({ action: "update_account", status: i })
                    break;
                }
            }
        });

        // chrome.runtime.sendMessage({ action: "update_account", status: statusSelect.options[statusSelect.selectedIndex].dataset.index }, (response) => {
        //     if (!response.success) displayNotification(response.message);
        //     if (isPasswordShowing) togglePasswordCensor();
        //     setProfile();
    
        //     setTimeout(() => sendBtn.disabled = false, 1000);
        // })
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

    const sendSuccessStatus = (settings) => {
        const accountState = document.querySelector('h2[class="x1lliihq x1plvlek xryxfnj x1n2onr6 x193iq5w xeuugli x1fj9vlw x13faqbe x1vvkbs x1s928wv xhkezso x1gmr53x x1cpjm7i x1fgarty x1943h6x x1i0vuye x1ms8i2q x1xlr1w8 x5n08af x10wh9bi x1wdrske x8viiok x18hxmgj"]');
        
        if (!accountState) {
                console.log("Page not loaded yet")
                setTimeout(() => sendSuccessStatus(settings), 50);
                return;
        }

        const accountStateStr = accountState.innerText.toLowerCase();
        if ((settings.autoSuccess && accountStateStr == "empresa" || accountStateStr == "business")) {
            chrome.runtime.sendMessage({ action: "update_account", status: 0 });
        }
    }
})()
