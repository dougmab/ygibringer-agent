const tryAgainBtn = document.querySelector("#try-again-btn")
const failContent = document.querySelector(".fail-message")
const loadingIcon = document.querySelector(".loading-icon");

const checkServer = () => {
    loadingIcon.classList.remove("hidden");
    failContent.classList.add("hidden")

    chrome.runtime.sendMessage({ action: "check_server"}, (response) => {
        console.log('iniciou')
        console.log(response);

        if (response.success) {
            window.location.href = "view/account.html";
            return;
        };

        loadingIcon.classList.add("hidden");
        failContent.classList.remove("hidden");
        console.log("falhou")
    })
    
}

checkServer();
tryAgainBtn.addEventListener("click", checkServer);
