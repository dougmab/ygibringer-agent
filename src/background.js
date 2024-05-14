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

    if (message.action == "get_status") getCustomStatusRequest(message, sender, sendMessage);

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
    return fetch('http://127.0.0.1:8080/account/next')
        .then(response => response.json())
        .then(response => {
            chrome.storage.local.set(response.data);
            return response.data
        })
        .catch(err => ({ success: false, error: err }))
}

const getAccountRequest = (message, sender, sendResponse) => {
    getCurrentAccount(currentAccount => {
        console.log(currentAccount)
        if (currentAccount) {
            sendResponse({ success: true, data: currentAccount });
            return;
        }
        getNextAccount();
        getCurrentAccount(this);
    })
}

const nextAccountRequest = (message, sender, sendResponse) => {
    getNextAccount()
            .then(account => sendResponse({ success: true, data: account }))
            .catch(err => sendResponse({ success: false, error: err }));
}

const sendAccountRequest = (message, sender, sendResponse) => {
    getCurrentAccount(currentAccount => {
        fetch(`http://127.0.0.1:8080/account/update?token=${currentAccount.token}&status=${message.status}`)
            .then(response => response.json())
            .then(data => sendResponse(data))
            .catch(err => sendResponse({ success: false, error: err }));
    })
}

const checkServerRequest = (message, sender, sendResponse) => {
    fetch("http://127.0.0.1:8080/info/health")
            .then(response => response.json())
            .then(data => sendResponse(data))
            .catch(err => sendResponse({ success: false }));
}

const getCustomStatusRequest = (message, sender, sendResponse) => {
    fetch(`http://127.0.0.1:8080/status`)
            .then(response => response.json())
            .then(data => sendResponse(data))
            .catch(err => sendResponse({ success: false, error: err }));    
}
