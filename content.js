const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;
let lastUrl = location.href;

history.pushState = function() {
    originalPushState.apply(this, arguments);
    handleUrlChange();
};

history.replaceState = function() {
    originalReplaceState.apply(this, arguments);
    handleUrlChange();
};

window.addEventListener('popstate', handleUrlChange);

function handleUrlChange() {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        removeIcon();
        setTimeout(() => {
            checkAndAddIcon();
        }, 500);
    }
}

function init() {
    removeIcon();
    checkAndAddIcon();

    document.addEventListener('click', (e) => {
        const anyLink = e.target.closest('a');
        if (anyLink) {
            removeIcon();
            setTimeout(() => {
                const newUrl = location.href;
                if (newUrl !== lastUrl) {
                    lastUrl = newUrl;
                    checkAndAddIcon();
                }
            }, 100);
        }
    });

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.addedNodes.length) {
                const userHeader = document.querySelector('[data-testid="UserName"], [data-testid="UserCell"]');
                const currentIcon = document.getElementById('blockMementoIcon');
                if (userHeader && !currentIcon) {
                    checkAndAddIcon();
                    break;
                }
                else if (!userHeader && currentIcon) {
                    removeIcon();
                    break;
                }
            }
        }
    });

    const mainContent = document.querySelector('main');
    if (mainContent) {
        observer.observe(mainContent, {
            childList: true,
            subtree: true
        });
    } else {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}

function removeIcon() {
    const existingIcon = document.getElementById('blockMementoIcon');
    if (existingIcon) {
        existingIcon.remove();
    }
}

function checkAndAddIcon() {
    const username = extractUsername(window.location.href);
    if (!username) {
        removeIcon();
        return;
    }

    if (['home', 'explore', 'notifications', 'messages', 'i', 'settings'].includes(username)) {
        removeIcon();
        return;
    }

    try {
        chrome.storage.local.get([username], function(result) {
            if (!result || !result[username] || result[username].trim() === '') {
                removeIcon();
                return;
            }
            addNoteIcon(result[username]);
        });
    } catch {
        removeIcon();
    }
}

function extractUsername(url) {
    const specialPaths = ['home', 'explore', 'notifications', 'messages', 'i', 'settings'];
    const urlPath = new URL(url).pathname.substring(1);
    
    if (specialPaths.includes(urlPath) || urlPath === '') {
        return null;
    }

    const twitterMatch = url.match(/twitter\.com\/([^\/\?]+)/);
    const xMatch = url.match(/x\.com\/([^\/\?]+)/);
    
    if (twitterMatch) return twitterMatch[1];
    if (xMatch) return xMatch[1];
    return null;
}

function showNotePopup(note) {
    const existingPopup = document.getElementById('blockMementoPopup');
    if (existingPopup) {
        existingPopup.remove();
        return;
    }

    const popup = document.createElement('div');
    popup.id = 'blockMementoPopup';
    popup.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: white;
        padding: 16px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        z-index: 9998;
        max-width: 300px;
        animation: fadeInPopup 0.3s ease-out;
        border: 1px solid rgba(0,0,0,0.1);
    `;

    const title = document.createElement('div');
    title.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
    `;

    const emoji = document.createElement('span');
    emoji.textContent = '📝';
    emoji.style.fontSize = '18px';

    const titleText = document.createElement('h3');
    titleText.textContent = 'Block Reason';
    titleText.style.cssText = `
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #0f1419;
    `;

    title.appendChild(emoji);
    title.appendChild(titleText);

    const content = document.createElement('p');
    content.textContent = note;
    content.style.cssText = `
        margin: 0;
        font-size: 14px;
        line-height: 1.5;
        color: #536471;
    `;

    popup.appendChild(title);
    popup.appendChild(content);
    document.body.appendChild(popup);

    document.addEventListener('click', function closePopup(e) {
        if (!popup.contains(e.target) && e.target.id !== 'blockMementoIcon') {
            popup.remove();
            document.removeEventListener('click', closePopup);
        }
    });
}

function addNoteIcon(note) {
    const existingIcon = document.getElementById('blockMementoIcon');
    if (existingIcon) {
        existingIcon.remove();
    }

    const iconContainer = document.createElement('div');
    iconContainer.id = 'blockMementoIcon';
    iconContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        cursor: pointer;
        transition: transform 0.2s;
        background: white;
        padding: 8px;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    `;

    const icon = document.createElement('img');
    icon.src = chrome.runtime.getURL('images/icon48.png');
    icon.style.cssText = `
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: block;
    `;

    iconContainer.addEventListener('mouseover', () => {
        iconContainer.style.transform = 'scale(1.1)';
    });
    iconContainer.addEventListener('mouseout', () => {
        iconContainer.style.transform = 'scale(1)';
    });

    iconContainer.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: "openPopup" });
    });

    iconContainer.appendChild(icon);
    document.body.appendChild(iconContainer);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInPopup {
        from { 
            opacity: 0; 
            transform: translateY(-10px); 
        }
        to { 
            opacity: 1; 
            transform: translateY(0); 
        }
    }
`;
document.head.appendChild(style);

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        const currentUsername = extractUsername(window.location.href);
        if (currentUsername && changes[currentUsername]) {
            checkAndAddIcon();
        }
    }
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}