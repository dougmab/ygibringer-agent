chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status == "complete") {
        if (tab.url && (tab.url.includes("instagram.com/accounts/login/") || tab.url.endsWith("instagram.com/"))) {
            console.log("login page")
    
            chrome.tabs.sendMessage(tabId, {
                action: "add_button"
            });
        }
    }
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(sender, message.action)
    
    if (message.action == "get_account") getAccountRequest(message, sender, sendResponse);
        
    if (message.action == "next_account") nextAccountRequest(message, sender, sendResponse);

    if (message.action == "send_account") sendAccountRequest(message, sender, sendResponse);

    if (message.action == "check_server") checkServerRequest(message, sender, sendResponse);

    return true;
})

const getCurrentAccount = callback => {
    chrome.storage.local.get(['id', 'login', 'password'], data => {
        const currentAccount = { ...data };
        callback(currentAccount);
    })
}

const getNextAccount = () => {
    console.log("Getting next account")
    return fetch('http://127.0.0.1:8080/next')
        .then(response => response.json())
        .then(account => {
            chrome.storage.local.set(account);
            return account
        })
        .catch(err => ({ status: "error", error: err }))
}

const getAccountRequest = (message, sender, sendResponse) => {
    getCurrentAccount(currentAccount => {
        console.log(currentAccount)
        if (currentAccount) {
            sendResponse({ status: "ok", account: currentAccount });
            return;
        }
        getNextAccount();
        getCurrentAccount(this);
    })
}

const nextAccountRequest = (message, sender, sendResponse) => {
    getNextAccount()
            .then(account => sendResponse({ status: "ok", account }))
            .catch(err => sendResponse({ status: "error", error: err }));
}

const sendAccountRequest = (message, sender, sendResponse) => {
    getCurrentAccount(currentAccount => {
        fetch(`http://127.0.0.1:8080/done?id=${currentAccount.id}${message.status ? "&status=" + message.status : ""}${message.type ? "&type=" + message.type : ""}`)
            .then(response => response.json())
            .then(account => sendResponse({ status: "ok", account }))
            .catch(err => sendResponse({ status: "error", error: err }));
    })
}

const checkServerRequest = (message, sender, sendResponse) => {
    fetch("http://127.0.0.1:8080/")
            .then(response => response.json())
            .then(data => sendResponse({ status: "ok", ...data }))
            .catch(err => sendResponse({ status: "offline" }));
}
