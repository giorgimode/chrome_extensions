const CognitoDefaults = {username: "test_user", password: "test_password", cognitoClientId: "test_cognito_client"}
const environments = ["dev", "qa", "prod"]
for (const env of environments) {
    let usernameKey = "username_" + env;
    let passwordKey = "password_" + env;
    let cognitoClientIdKey = "cognitoClientId_" + env;
    let tokenKey = "token_" + env;

    chrome.storage.sync.get([usernameKey, passwordKey, cognitoClientIdKey], function (obj) {
        if (!obj.username) {
            chrome.storage.sync.set({[usernameKey]: CognitoDefaults.username});
        }
        if (!obj.password) {
            chrome.storage.sync.set({[passwordKey]: CognitoDefaults.password});
        }
        if (!obj.cognitoClientId) {
            chrome.storage.sync.set({[cognitoClientIdKey]: CognitoDefaults.cognitoClientId});
        }
    });

    const ConfigurationButton = document.getElementById('configure_' + env);
    ConfigurationButton.addEventListener('click', async () =>
        chrome.storage.sync.get([usernameKey, passwordKey, cognitoClientIdKey], obj => configureCognito(obj)))

    const CopyButton = document.getElementById('copy_' + env);
    CopyButton.addEventListener('click', async () => {
        chrome.storage.sync.get([tokenKey], function (obj) {
            var token = obj[tokenKey];
            if (token) {
                navigator.clipboard.writeText(token);
                CopyButton.innerHTML = "Copied";
            } else {
                CopyButton.innerHTML = "No token";
            }
        });
    })

    const UpdateTokenButton = document.getElementById("update_" + env);
    UpdateTokenButton.addEventListener("click", async () => {
        refreshToken();
    });

    function configureCognito(obj) {
        var configurationElement = document.getElementById("configuration_" + env);
        if (configurationElement.style.display === "none") {
            configurationElement.style.display = "block";
            ConfigurationButton.innerHTML = "Save";
            if (obj[usernameKey]) {
                document.getElementById(usernameKey).value = obj[usernameKey]
            }
            if (obj[passwordKey]) {
                document.getElementById(passwordKey).value = obj[passwordKey]
            }
            if (obj[cognitoClientIdKey]) {
                document.getElementById(cognitoClientIdKey).value = obj[cognitoClientIdKey]
            }
        } else {
            configurationElement.style.display = "none";
            ConfigurationButton.innerHTML = "Configure";
            let updatedUsername = document.getElementById(usernameKey).value.trim();
            if (updatedUsername) {
                chrome.storage.sync.set({[usernameKey]: updatedUsername});
            }
            let updatedPassword = document.getElementById(passwordKey).value.trim();
            if (updatedPassword) {
                chrome.storage.sync.set({[passwordKey]: updatedPassword});
            }
            let updatedClientId = document.getElementById(cognitoClientIdKey).value.trim();
            if (updatedClientId) {
                chrome.storage.sync.set({[cognitoClientIdKey]: updatedClientId});
            }
        }
    }

    function refreshToken() {
        chrome.storage.sync.get([usernameKey, passwordKey, cognitoClientIdKey], function (obj) {
            fetch("https://cognito-idp.eu-central-1.amazonaws.com/", {
                method: "POST",
                body: JSON.stringify({
                    ClientId: obj[cognitoClientIdKey],
                    AuthFlow: "USER_PASSWORD_AUTH",
                    AuthParameters: {
                        USERNAME: obj[usernameKey],
                        PASSWORD: obj[passwordKey]
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
            }).then(response => chrome.storage.sync.set({[tokenKey]: response.AuthenticationResult.AccessToken},
                () => {
                    navigator.clipboard.writeText(response.AuthenticationResult.AccessToken)
                    UpdateTokenButton.innerHTML = "Refreshed";
                }))
            .catch((error) => {
                UpdateTokenButton.innerHTML = "Failed";
            });
        });
    }
}





