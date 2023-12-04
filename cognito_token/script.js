const CognitoDefaults = {username: "test_user", password: "test_password", cognitoClientId: "test_cognito_client"}
chrome.storage.sync.get(["username", "password", "cognitoClientId"], function (obj) {
    if (!obj.username) {
        chrome.storage.sync.set({"username": CognitoDefaults.username});
    }
    if (!obj.password) {
        chrome.storage.sync.set({"password": CognitoDefaults.password});
    }
    if (!obj.cognitoClientId) {
        chrome.storage.sync.set({"cognitoClientId": CognitoDefaults.cognitoClientId});
    }
});

const ConfigurationButton = document.getElementById('configure');
ConfigurationButton.addEventListener('click', async () =>
    chrome.storage.sync.get(["username", "password", "cognitoClientId"], obj => configureCognito(obj)))

const CopyButton = document.getElementById('copy');
CopyButton.addEventListener('click', async () => {
    chrome.storage.sync.get(["token"], function (obj) {
        var token = obj.token;
        if (token) {
            navigator.clipboard.writeText(token);
            CopyButton.innerHTML = "Copied";
        } else {
            CopyButton.innerHTML = "No token";
        }
    });
})

const UpdateTokenButton = document.getElementById("update");
UpdateTokenButton.addEventListener("click", async () => {
    refreshToken();
});

function configureCognito(obj) {
    var configurationElement = document.getElementById("configuration");
    if (configurationElement.style.display === "none") {
        configurationElement.style.display = "block";
        ConfigurationButton.innerHTML = "Save";
        if (obj.username) {
            document.getElementById("username").value = obj.username
        }
        if (obj.password) {
            document.getElementById("password").value = obj.password
        }
        if (obj.cognitoClientId) {
            document.getElementById("cognitoClientId").value = obj.cognitoClientId
        }
    } else {
        configurationElement.style.display = "none";
        ConfigurationButton.innerHTML = "Configure";
        let updatedUsername = document.getElementById("username").value.trim();
        if (updatedUsername) {
            chrome.storage.sync.set({"username": updatedUsername});
        }
        let updatedPassword = document.getElementById("password").value.trim();
        if (updatedPassword) {
            chrome.storage.sync.set({"password": updatedPassword});
        }
        let updatedClientId = document.getElementById("cognitoClientId").value.trim();
        if (updatedClientId) {
            chrome.storage.sync.set({"cognitoClientId": updatedClientId});
        }
    }
}

function refreshToken() {
    chrome.storage.sync.get(["username", "password", "cognitoClientId"], function (obj) {
        fetch("https://cognito-idp.eu-central-1.amazonaws.com/", {
            method: "POST",
            body: JSON.stringify({
                ClientId: obj.cognitoClientId,
                AuthFlow: "USER_PASSWORD_AUTH",
                AuthParameters: {
                    USERNAME: obj.username,
                    PASSWORD: obj.password
                }
            }),
            headers: {
                "Content-type": "application/x-amz-json-1.1",
                "X-Amz-Target": "AWSCognitoIdentityProviderService.InitiateAuth"
            }
        }).then(response => {
            if (response.ok) {
                return response.json()
            }
            return Promise.reject(response)
        }).then(response => chrome.storage.sync.set({"token": response.AuthenticationResult.AccessToken},
            () => {
                navigator.clipboard.writeText(response.AuthenticationResult.AccessToken)
                UpdateTokenButton.innerHTML = "Refreshed";
            }))
        .catch((error) => {
            UpdateTokenButton.innerHTML = "Failed";
        });
    });
}

