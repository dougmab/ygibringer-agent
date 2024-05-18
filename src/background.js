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
        // console.log("settings", data.settings)
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

const getCurrentAccount = (settings, callback) => {
    // chrome.storage.local.get(["user", "login", "password"], data => {
    //     const currentAccount = { ...data };
    //     callback(currentAccount);
    // });

    fetch(`${settings.serverUrl}/account/get?user=${settings.username}`)
    .then(response => {
        if (response.status == 403) {
            throw new Error("Nenhuma conta associada a este usuário")
        }
        return response.json()
    })
    .then(data => callback(data))
    .catch(error => callback({ success: false , error}))
}

const getNextAccount = (settings) => {
    console.log("Getting next account")
    return fetch(`${settings.serverUrl}/account/next?user=${settings.username}`)
        .then(response => {
            if (response.status === 204) {
                // chrome.storage.local.remove(["user", "login", "password"], () => {});
                // return ({ success: false, error: { type: "end_of_list", message: "List has reached it's end"} });
                throw new Error("Fim da lista");
            }
            if (response.status === 403) throw new Error("Usuário está ocupado");
            return response.json()
        })
        .then(response => {
            return response;
        })
        .catch(error => ({ success: false, error }))
}

const getAccountRequest = (message, sender, sendResponse, settings) => {
    getCurrentAccount(settings, response => {
        console.log(response)
        if (response.success) {
            console.log("CONTA EXISTE")
            sendResponse({ ...response });
            return;
        }
        console.log("CONTA NÃO EXISTE AQUI")
        getNextAccount(settings)
            .then(response => sendResponse({ ...response }));
    })
}

const nextAccountRequest = (message, sender, sendResponse, settings) => {
    getNextAccount(settings)
            .then(response => sendResponse({ ...response }))
            .catch(error => sendResponse({ success: false, error }));
}

const updateAccountRequest = (message, sender, sendResponse, settings) => {
    getCurrentAccount(settings, response => {
        let url;
        if (!response.success) {
            sendResponse({ ...response });
            return;
        }

        const { user } = response.data;
        if (message.isSuspended) url = `${settings.serverUrl}/account/suspended?user=${user}&message=${message.statusMessage}`;
        else url = `${settings.serverUrl}/account/update?user=${user}&status=${message.status}`;

        fetch(url, { method: "PUT"})
        .then(response => {
            if (response.status == 403) {
                throw new Error("Nenhuma conta associada a este usuário")
            }
            return response.json()
        })
        .then(data => {
            getNextAccount(settings)
                .then(response => sendResponse({ ...response }));

            // Remove cookie sessionid do site
            console.log("OLHA O COOKIE")
            chrome.cookies.getAll({ domain: "instagram.com"}, cookies => {
                console.log(cookies)
                if (cookies[0]) {
                    for (const cookie of cookies) {
                        chrome.cookies.remove({url: "https://instagram.com/" + cookie.path, name: cookie.name}, (removedCookie) => {
                            if (removedCookie) {
                                console.log("Cookie removido", removedCookie)
                            }
                        })
                    }
                        // Atualiza a tab para a página de login
                        chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
                            if (tabs.length > 0) {
                                // console.log(tabs[0].id, "TabID");
                                chrome.tabs.update(tabs[0].id, { url: "https://www.instagram.com/" });
                                if (message.isSuspended) {
                                    chrome.tabs.sendMessage(tabs[0].id, { action: "get_account" })
                                }
                            }
                        });
                }
            });
        })
        .catch(err => {
            console.log("Apaguei tudo")
            chrome.tabs.sendMessage(tabs[0].id, { action: "get_account" })
            sendResponse({ success: false, error: { type: "no_account_associated"} })
        });
    });
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
