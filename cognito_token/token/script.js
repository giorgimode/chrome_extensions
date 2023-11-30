const DisplayButton = document.getElementById('display');
DisplayButton.addEventListener('click', async () => {
    chrome.storage.sync.get(["token"], function (obj) {
        var token = obj.token;
        var tokenElement = document.getElementById("token");
        if (token && (tokenElement.style.display === "none" || tokenElement.style.display === '')) {
            tokenElement.style.display = "block";
            tokenElement.innerHTML = token;
            this.innerHTML = "Hide Token";
        } else {
            tokenElement.style.display = "none";
            this.innerHTML = "Show Token";
        }
    });
})

const CopyButton = document.getElementById('copy');
CopyButton.addEventListener('click', async () => {
    chrome.storage.sync.get(["token"], function (obj) {
        var token = obj.token;
        if (token) {
            navigator.clipboard.writeText(token);
            CopyButton.innerHTML = "Token copied";
        } else CopyButton.innerHTML = "Token not found";
    });
})

let UpdateTokenButton = document.getElementById("update");
UpdateTokenButton.addEventListener("click", async () => {
    let [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    chrome.scripting.executeScript({
        target: {tabId: tab.id},
        function: storeToken,
    });
});

function storeToken() {
    for (const key of Object.keys(window.localStorage)) {
        if (key.startsWith("CognitoIdentityServiceProvider") && key.endsWith("accessToken")) {
            chrome.storage.sync.set({"token": localStorage.getItem(key)},
                () => chrome.runtime.sendMessage({type: "UPDATE_SUCCESSFUL"}));
            return;
        }
    }
    chrome.storage.sync.remove("token");
    chrome.runtime.sendMessage({type: "UPDATE_FAILED"});
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.type === "UPDATE_SUCCESSFUL") UpdateTokenButton.innerHTML = "Token updated";
        else if (request.type === "UPDATE_FAILED") UpdateTokenButton.innerHTML = "Token not found";
    });


