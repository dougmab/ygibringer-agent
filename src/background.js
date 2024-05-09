chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status == "complete") {
        if (tab.url && tab.url.includes("instagram.com/accounts/login/")) {
            console.log("login page")
    
            chrome.tabs.sendMessage(tabId, {
                action: "add_button"
            });
        }
    }
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(sender)


    if (message.action == "get_account") {
        getCurrentAccount(currentAccount => {
            if (currentAccount) {
                sendResponse({ status: "ok", account: currentAccount });
                return;
            }
            getNextAccount();
            getCurrentAccount(this);
        })
    }
        
    if (message.action == "next_account") {
        getNextAccount()
            .then(account => sendResponse({ status: "ok", account }))
            .catch(err = sendResponse({ status: "err", message: err.message}));
    }

    if (message.action == "check_server") {
        fetch("http://127.0.0.1:8080/")
            .then(response => response.json())
            .then(data => sendResponse({ status: "ok", ...data }))
            .catch(err => sendResponse({ status: "offline" }));
    }

    return true;
})

const getCurrentAccount = callback => {
    chrome.storage.local.get(['id', 'login', 'password'], data => {
        const currentAccount = { ...data };
        callback(currentAccount);
    })
}

const getNextAccount = () => {
    return fetch('http://127.0.0.1:8080/next')
        .then(response => response.json())
        .then(account => {
            chrome.storage.local.set(account);
            return account
        })
        .catch(e => ({ status: "error", message: e.message }))
}
