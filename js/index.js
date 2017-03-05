import jenkinsapi from 'jenkins-api';

function insertTextToElement(text, elementId) {
    document.getElementById(elementId).innerHTML = text;
}

function createAndAppendLink(domElementId, text, tooltip, href, type) {
    let a = document.createElement('a');
    let linkText = document.createTextNode(text);
    a.appendChild(linkText);
    a.title = tooltip;
    a.href = href;
    if (type) {
        // this is the more info link
        a.type = "button";
        a.addEventListener("click", moreInfoClick);
        document.getElementById(domElementId).appendChild(a);
    }
    else {
        // these are the job links
        a.addEventListener("click", () => {
           chrome.tabs.create({url: href});
        });
        let li = document.createElement('li');
        li.appendChild(a);
        document.getElementById(domElementId).appendChild(li);
    }
}

function createAndAppendText(domElementId, text, htmlType, id) {
    let newElement = document.createElement(htmlType);
    let textNode = document.createTextNode(text);
    newElement.appendChild(textNode);
    if (id) {
        newElement.id = id;
    }
    document.getElementById(domElementId).appendChild(newElement);
}

function loading() {
    let i = 0;
    intervalId = setInterval(function () {
        i = ++i % 4;
        document.getElementById("loading").innerHTML = "Loading" + Array(i + 1).join(".");
    }, 600);
}

let moreInfoState = "closed";
let intervalId = "";

function moreInfoClick() {
    if (moreInfoState === "closed") {
        moreInfoState = "open";
        let moreInfoButtonDiv = document.getElementById("moreInfoButtonDiv");
        moreInfoButtonDiv.children[0].innerHTML = "Less info \u25B2";
        document.getElementById("moreInfo").style.display = 'block';
        createAndAppendText("moreInfo", "", "h4", "loading");
        loading();
        let jenkins = jenkinsapi.init("http://devx-webide-jenkins.mo.sap.corp:8080", {strictSSL: false});
        jenkins.job_info('Selenium_Tests_Aggregator_master', function (err, data) {
            if (!err) {
                let loadingText = document.getElementById("loading");
                loadingText.parentNode.removeChild(loadingText);
                clearInterval(intervalId);
                document.getElementById("moreInfo").appendChild(document.createElement("hr"));
                createAndAppendText("moreInfo", "Failing jobs:", "h2");
                let builds = data.lastUnsuccessfulBuild.subBuilds;
                builds.filter(build => {
                    return build.result === 'FAILURE';
                }).map(build => {
                    let href = `http://devx-webide-jenkins.mo.sap.corp:8080/job/${build.jobName}/`;
                    createAndAppendLink("moreInfo", build.jobName, build.jobName, href);
                });
            }
        });
    }
    else {
        moreInfoState = "closed";
        let moreInfoButtonDiv = document.getElementById("moreInfoButtonDiv");
        moreInfoButtonDiv.children[0].innerHTML = "More info \u25BC";
        document.getElementById("moreInfo").innerHTML = "";
        document.getElementById("moreInfo").style.display = 'none';
    }
}

function createAndAppendImage(imageName) {
    let oImg = document.createElement("img");
    oImg.setAttribute('src', `images/${imageName}`);
    document.getElementById("imageDiv").appendChild(oImg);
}

function getTimeToDisplay(timeInMillis) {
    let hoursNotRounded = timeInMillis / (60 * 60 * 1000);
    let minutesNotRounded = (hoursNotRounded % 1) * 60;
    let secondsNotRounded = (minutesNotRounded % 1) * 60;
    let hours = Math.floor(hoursNotRounded);
    let minutes = Math.floor(minutesNotRounded);
    let seconds = Math.floor(secondsNotRounded);
    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;
    return `${hours}:${minutes}:${seconds}`;
}

let time = "";

function clock() {
    let timeSinceLastSuccess = getTimeToDisplay(new Date().getTime() - time);
    insertTextToElement(`Time passed since the last successful build: ${timeSinceLastSuccess}`, "info");
    setTimeout(clock, 500);
}

document.addEventListener('DOMContentLoaded', function () {
    let jenkins = jenkinsapi.init("http://devx-webide-jenkins.mo.sap.corp:8080", {strictSSL: false});
    jenkins.last_build_info('greenCI_master', function (err, data) {
        if (err) {
            return console.log(err);
        }
        let buildStatus = data.actions[6].text;
        switch (buildStatus) {
            case 'Green':
                insertTextToElement("No code freeze at the moment", "header");
                createAndAppendImage("green.png");
                break;
            case 'Fixed':
                insertTextToElement("Code freeze resolved", "header");
                createAndAppendImage("green.png");
                break;
            case 'Freeze!':
            case 'Still Broken':
                jenkins.job_info('greenCI_master', function (err, data) {
                    if (err) {
                        return console.log(err);
                    }
                    let lastSuccessfulBuild = data.lastStableBuild.number;
                    jenkins.build_info('greenCI_master', lastSuccessfulBuild, function (err, data) {
                        if (err) {
                            return console.log(err);
                        }
                        insertTextToElement("Code freeze is on", "header");
                        createAndAppendImage("stop.png");
                        createAndAppendLink("moreInfoButtonDiv", "More info \u25BC", "For more info click here", "#", "button");
                        time = data.timestamp;
                        clock();
                    });
                });
                break;
        }
    });
});