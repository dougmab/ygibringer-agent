let isLoading = false;
const loadingIcon = document.querySelector(".loading-icon");
const statusList = document.querySelector(".status-list");

const toggleLoadingStatus = (callback) => {
    if (isLoading) {
        loadingIcon.classList.add("hidden")
        statusList.classList.remove("hidden")
        isLoading = false;
        return
    }

    loadingIcon.classList.remove("hidden")
        statusList.classList.add("hidden")
        isLoading = true;

}

const getStatusbtns = () => {
    document.querySelectorAll(".status-btn").forEach((btn) => {
        btn.addEventListener("click", sendStatus)
    });
};

getStatusbtns();

function sendStatus(event) {
    console.log(event.target)
    toggleLoadingStatus();
    chrome.runtime.sendMessage({ action: "send_account", status: event.target.textContent }, (message) => {
        if (message.status == "ok") {
            chrome.runtime.sendMessage({ action: "next_account" }, (response) => {
                if (message.status == "ok") window.location.href = "account.html"
                if (message.status == "error") console.log(message)
            })
        }
        if (message.status == "error") console.log(message)
        toggleLoadingStatus();
    })
}

