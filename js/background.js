import jenkinsapi from 'jenkins-api';
const jenkins = jenkinsapi.init("http://devx-webide-jenkins.mo.sap.corp:8080", {strictSSL: false});

chrome.alarms.create('Check code freeze', {
    when: Date.now() + 10000,
    periodInMinutes: 0.2
});

chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === 'Check code freeze') {
        loop();
    }
});

function loop() {
    try {
        jenkins.last_build_info('greenCI_master', function (err, data) {
            if (!err) {
                let buildStatus = data.actions[6].text;
                let isCodeFreeze = localStorage.getItem("isCodeFreeze");
                switch (buildStatus) {
                    case 'Green':
                        chrome.browserAction.setBadgeText({text: 'Green'});
                        chrome.browserAction.setBadgeBackgroundColor({color: '#5cb85c'});
                        break;
                    case 'Fixed':
                        if (!isCodeFreeze || isCodeFreeze !== "false") {
                            localStorage.setItem("isCodeFreeze", "false");
                            chrome.notifications.create("fixedNotification", {
                                type: "basic",
                                iconUrl: "images/freezeDone.png",
                                title: "Code freeze fixed!",
                                message: "Push your code while you still can..."
                            });
                            chrome.notifications.clear("fixedNotification");
                        }
                        chrome.browserAction.setBadgeText({text: 'Green'});
                        chrome.browserAction.setBadgeBackgroundColor({color: '#5cb85c'});
                        break;
                    case 'Still Broken':
                        chrome.browserAction.setBadgeText({text: 'Freeze'});
                        chrome.browserAction.setBadgeBackgroundColor({color: '#c9302c'});
                        break;
                    case 'Freeze!':
                        if (!isCodeFreeze || isCodeFreeze !== "true") {
                            localStorage.setItem("isCodeFreeze", "true");
                            chrome.notifications.create("freezeNotification", {
                                type: "basic",
                                iconUrl: "images/freezeNotification.jpg",
                                title: "Code freeze is on!!",
                                message: "Please refer to the aggregator and see what is failing."
                            });
                            chrome.notifications.clear("freezeNotification");
                        }
                        chrome.browserAction.setBadgeText({text: 'Freeze'});
                        chrome.browserAction.setBadgeBackgroundColor({color: '#c9302c'});
                        break;
                }
            }
        });
    }
    catch(err) {
        console.log(err);
    }
}