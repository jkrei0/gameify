
const docsIFrame = document.querySelector('#docs-iframe');

const docsHistory = [];
let docsHistoryPosition = -1;

let modHist = true; // flag if next load should modify history

document.querySelector('#docs-nav-back').onclick = () => {
    docsHistoryPosition -= 1;
    if (docsHistoryPosition >= 0) {
        docsIFrame.contentWindow.location = docsHistory[docsHistoryPosition];
        modHist = false;

    } else docsHistoryPosition = 0;
};
document.querySelector('#docs-nav-forward').onclick = () => {
    docsHistoryPosition += 1;
    if (docsHistoryPosition < docsHistory.length) {
        docsIFrame.contentWindow.location = docsHistory[docsHistoryPosition];
        modHist = false;

    } else docsHistoryPosition = docsHistory.length - 1;
};
document.querySelector('#docs-new-tab').onclick = () => {
    window.open('/out/' + docsIFrame.contentWindow.location.toString().split('/out/')[1], '_blank');
}

document.querySelector('#docs-nav-url').onfocus = () => {
    document.querySelector('#docs-nav-url').select();
}

document.querySelector('#docs-nav-search').onclick = () => {
    docsIFrame.contentWindow.document.querySelector('.icon-button.search-button').click();
}

document.querySelector('#docs-nav-url').onchange = () => {
    const val = document.querySelector('#docs-nav-url').value;
    console.log(val, val.split('/out/'));
    let split = val.split('/out/')[1] || val;
    if (split == undefined) {
        split = '';
    }
    let url = '/out/' + split;
    if (!url.endsWith('.html')) {
        docsIFrame.contentWindow.document.querySelector('.icon-button.search-button').click();
        setTimeout(() => {
            console.log(docsIFrame.contentWindow.document.querySelector('.search-box-c'));
            docsIFrame.contentWindow.document.querySelector('.search-box-c input').value = val
        });
    
    } else {
        docsIFrame.contentWindow.location = url;
    }
}


docsIFrame.onload = () => {
    if ( // stay w/in /out/ directory
        !docsIFrame.contentWindow.location.toString().includes('/out/')
    ) {
        docsIFrame.contentWindow.location = '/out/tutorial-engine_home.html';
    }

    if (modHist) {
        docsHistoryPosition += 1;
        docsHistory.splice(docsHistoryPosition, 0, docsIFrame.contentWindow.location.toString());
    }
    console.log(docsHistory, docsHistoryPosition, modHist);
    modHist = true;

    const path = '/out/' + docsIFrame.contentWindow.location.toString().split('/out/')[1];
    document.querySelector('#docs-nav-url').value = path;
}