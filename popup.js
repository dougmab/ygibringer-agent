chrome.runtime.sendMessage({ action: "check_server"}, (response) => {
    if (response.status == "ok") setProfile();
})

const setProfile = () => {
    console.log("Chegou aqui")
    chrome.runtime.sendMessage({ action: "get_account" }, (response) => {
        const userInput = document.querySelector("#login");
        const passInput = document.querySelector("#password");

        console.log(account, "popup")

        const { login, password } = response.account;

        console.log(login)

        userInput.textContent = login;
        passInput.textContent = password;
    })
}
