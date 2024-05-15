(() => {
    let submit;
    chrome.runtime.onMessage.addListener((message, sender, response) => {
        const { action } = message;
        if (action == "add_button") {
            console.log("YgiBringer login added")
            insertLoginButton();
        }
    });

    const insertLoginButton = () => {
        setTimeout(() => {
            const loginBtnExists = document.querySelector(".login-ab-btn");

            if (loginBtnExists) return;
            
            submit = document.querySelector("button");
            const submitParent = submit.parentElement;
            
            const loginBtn = document.createElement("button");
            loginBtn.textContent = "Entrar com YgiBringer";
            loginBtn.className = "login-ab-btn";

            loginBtn.addEventListener("click", getCurrentAccount);

            submitParent.appendChild(loginBtn);  
        }, 1000)      
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
        }); 
    }

    const writeToInput = (input, content, append) => {
        if (!append) input.value = ""
        input.focus();
        document.execCommand('insertText', false, content);
    }
})()
