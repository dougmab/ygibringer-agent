chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status == "complete" && tab.url) {
        console.log(tab.url)
        if (tab.url.includes("instagram.com/accounts/login/")) {
            console.log("login page")
    
            chrome.tabs.sendMessage(tabId, {
                action: "add_button"
            });
        }

        if (tab.url.endsWith("instagram.com/")) {
            checkLoginStateAndExecute(
                // If logged
                () => {
                    chrome.tabs.update(tabId, { url: "https://www.instagram.com/accounts/convert_to_professional_account/" });
                },
                // If not logged
                () => {
                    chrome.tabs.sendMessage(tabId, {
                        action: "add_button"
                    });
                })
        }

        if (tab.url.includes("instagram.com/accounts/onetap/")) {
            console.log("Onetap page")
            chrome.tabs.update(tabId, { url: "https://www.instagram.com/accounts/convert_to_professional_account/" });
        }

        if (tab.url.includes("instagram.com/accounts/suspended/")) {
            console.log("Account suspended")
            chrome.tabs.sendMessage(tabId, { action: "send_suspended_status" })
        }
    }

})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(sender, message.action)
    
    if (message.action == "get_account") getAccountRequest(message, sender, sendResponse);
        
    if (message.action == "next_account") nextAccountRequest(message, sender, sendResponse);

    if (message.action == "update_account") updateAccountRequest(message, sender, sendResponse);

    if (message.action == "get_status") getCustomStatusRequest(message, sender, sendResponse);

    if (message.action == "check_server") checkServerRequest(message, sender, sendResponse);

    if(message.action == "suspended_account") suspendedAccountRequest(message, sender, sendResponse);

    return true;
})

const getCurrentAccount = callback => {
    chrome.storage.local.get(['token', 'login', 'password'], data => {
        const currentAccount = { ...data };
        callback(currentAccount);
    })
}

const checkLoginStateAndExecute = (isLoggedCallback, isNotLoggedCallback)  => {
    chrome.cookies.getAll({ domain: "instagram.com", name: "sessionid"}, cookie => {
        if (cookie[0] && isLoggedCallback) {
            console.log("Logged in")
            isLoggedCallback();
            return;
        }
        console.log("Not logged in")
        if (isNotLoggedCallback) isNotLoggedCallback();
    })
}

const getNextAccount = () => {
    console.log("Getting next account")
    return fetch('http://127.0.0.1:8080/account/next')
        .then(response => {
            if (response.status === 204) {
                chrome.storage.local.remove(["token", "login", "password"], () => {});
                return ({ success: false, error: { type: "end_of_list", message: "List has reached it's end"} });
            }
            return response.json()
        })
        .then(response => {
            if (response.success) {
                console.log(response, "next")
                chrome.storage.local.set(response.data);
                return response
            }
        })
        .catch(err => ({ success: false, error: err }))
}

const getAccountRequest = (message, sender, sendResponse) => {
    getCurrentAccount(currentAccount => {
        console.log(currentAccount)
        if (currentAccount.token) {
            sendResponse({ success: true, data: currentAccount });
            return;
        }
        getNextAccount()
            .then(response => sendResponse(response));
    })
}

const nextAccountRequest = (message, sender, sendResponse) => {
    getNextAccount()
            .then(account => sendResponse({ success: true, data: account }))
            .catch(err => sendResponse({ success: false, error: err }));
}

const updateAccountRequest = (message, sender, sendResponse) => {
    getCurrentAccount(currentAccount => {
        let url;
        if (message.isSuspended) url = `http://127.0.0.1:8080/account/suspended?token=${currentAccount.token}&message=${message.statusMessage}`;
        else url = `http://127.0.0.1:8080/account/update?token=${currentAccount.token}&status=${message.status}`;

        fetch(url, { method: "PUT"})
            .then(response => response.json())
            .then(data => {
                // Remove cookie sessionid do site
                chrome.cookies.getAll({ domain: "instagram.com", name: "sessionid"}, cookie => {
                    if (cookie[0]) {
                        console.log(cookie[0]);
                        chrome.cookies.remove({url: "https://instagram.com/" + cookie[0].path, name: "sessionid"});
                    }
                })
                // Atualiza a tab para a página de login
                chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
                    if (tabs.length > 0) {
                        console.log(tabs[0].id, "TabID");
                        chrome.tabs.update(tabs[0].id, { url: "https://www.instagram.com/" });
                    }
                })
                getNextAccount()
                .then(data => sendResponse(data));
                // sendResponse(data);
            })
            .catch(err => sendResponse({ success: false, error: `http://127.0.0.1:8080/account/update?token=${currentAccount.token}&status=${message.status}` }));
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

const suspendedAccountRequest = (message, sender, sendResponse) => {

}
