chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tab.url) {

        chrome.storage.local.get(["settings"])
        .then(data => {
            const { settings } = data;

            // Não espera a página carregar pra dar redirect
            if (tab.url.includes("instagram.com/accounts/onetap/")) {
                if (settings.redirectCreator) chrome.tabs.update(tabId, { url: "https://www.instagram.com/accounts/convert_to_professional_account/" });

            }

            if (changeInfo.status == "complete") {

                if (tab.url.includes("instagram.com/accounts/login/")) {           
                    chrome.tabs.sendMessage(tabId, {
                        action: "add_button",
                        settings
                    });
                }

                if (tab.url.endsWith("instagram.com/")) {
                    checkLoginStateAndExecute(
                        // If logged
                        () => {
                            if (redirectCreator)
                                chrome.tabs.update(tabId, { url: "https://www.instagram.com/accounts/convert_to_professional_account/" });
                        },
                        // If not logged
                        () => {
                            chrome.tabs.sendMessage(tabId, {
                                action: "add_button",
                                settings
                            });
                        });
                }

                if (tab.url.includes("instagram.com/accounts/suspended/")) {
                    console.log("Account suspended");
                    chrome.tabs.sendMessage(tabId, { action: "send_suspended_status" });
                }
            }
        });
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(sender, message.action)

    chrome.storage.local.get(["settings"])
    .then(data => {
        console.log("settings", data.settings)
        const { settings } = data;
        if (message.action == "get_account") getAccountRequest(message, sender, sendResponse, settings);
            
        if (message.action == "next_account") nextAccountRequest(message, sender, sendResponse, settings);
    
        if (message.action == "update_account") updateAccountRequest(message, sender, sendResponse, settings);
    
        if (message.action == "get_status") getCustomStatusRequest(message, sender, sendResponse, settings);
    
        if (message.action == "check_server") checkServerRequest(message, sender, sendResponse, settings);
    
        if (message.action == "suspended_account") suspendedAccountRequest(message, sender, sendResponse. settings);

        if (message.action == "save_settings") chrome.storage.local.set({ settings: message.settings });

        if (message.action == "get_settings") sendResponse(data.settings)
    })

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

const getNextAccount = (url) => {
    console.log("Getting next account")
    return fetch(`${url}/account/next`)
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

const getAccountRequest = (message, sender, sendResponse, settings) => {
    getCurrentAccount(currentAccount => {
        console.log(currentAccount)
        if (currentAccount.token) {
            sendResponse({ success: true, data: currentAccount });
            return;
        }
        getNextAccount(settings.serverUrl)
            .then(response => sendResponse(response));
    })
}

const nextAccountRequest = (message, sender, sendResponse, settings) => {
    getNextAccount(settings.serverUrl)
            .then(account => sendResponse({ success: true, data: account }))
            .catch(err => sendResponse({ success: false, error: err }));
}

const updateAccountRequest = (message, sender, sendResponse, settings) => {
    getCurrentAccount(currentAccount => {
        let url;
        if (message.isSuspended) url = `${settings.serverUrl}/account/suspended?token=${currentAccount.token}&message=${message.statusMessage}`;
        else url = `${settings.serverUrl}/account/update?token=${currentAccount.token}&status=${message.status}`;

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
                getNextAccount(settings.serverUrl)
                .then(data => sendResponse(data));
                // sendResponse(data);
            })
            .catch(err => sendResponse({ success: false, error: err }));
    })
}

const checkServerRequest = (message, sender, sendResponse, settings) => {
    fetch(`${settings.serverUrl}/info/health`)
            .then(response => response.json())
            .then(data => sendResponse(data))
            .catch(err => sendResponse({ success: false }));
}

const getCustomStatusRequest = (message, sender, sendResponse, settings) => {
    fetch(`${settings.serverUrl}/status`)
            .then(response => response.json())
            .then(data => sendResponse(data))
            .catch(err => sendResponse({ success: false, error: err }));    
}
