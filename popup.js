document.addEventListener('DOMContentLoaded', function() {
    const noteInput = document.getElementById('noteInput');
    const saveButton = document.getElementById('saveNote');
    const deleteButton = document.getElementById('deleteNote');
    const currentNote = document.getElementById('currentNote');
    const noteContent = document.getElementById('noteContent');
    const invalidPage = document.getElementById('invalidPage');
    const mainContent = document.getElementById('mainContent');

    noteContent.textContent = '';
    currentNote.classList.add('d-none');
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const url = tabs[0].url;
        const username = extractUsername(url);
        
        if (username && isValidTwitterPage(url)) {
            document.body.style.minWidth = '800px';
            invalidPage.classList.add('d-none');
            mainContent.classList.remove('d-none');
            
            chrome.storage.local.get([username], function(result) {
                if (result[username]) {
                    noteContent.textContent = result[username];
                    currentNote.classList.remove('d-none');
                    deleteButton.disabled = false;
                    deleteButton.style.opacity = 1;
                } else {
                    noteContent.textContent = '';
                    currentNote.classList.add('d-none');
                    deleteButton.disabled = true;
                    deleteButton.style.opacity = 0.5;
                }
            });

            saveButton.addEventListener('click', function() {
                const note = noteInput.value.trim();
                if (note) {
                    chrome.storage.local.set({[username]: note}, function() {
                        noteContent.textContent = note;
                        currentNote.classList.remove('d-none');
                        noteInput.value = '';
                        deleteButton.disabled = false;
                        deleteButton.style.opacity = 1;
                    });
                }
            });

            deleteButton.addEventListener('click', function() {
                chrome.storage.local.remove([username], function() {
                    noteContent.textContent = '';
                    currentNote.classList.add('d-none');
                    deleteButton.disabled = true;
                    deleteButton.style.opacity = 0.5;
                });
            });
        } else {
            document.body.style.minWidth = '400px';
            invalidPage.classList.remove('d-none');
            mainContent.classList.add('d-none');
        }
    });
});

function extractUsername(url) {
    if (!url) return null;
    
    const twitterMatch = url.match(/(?:twitter|x)\.com\/([^\/\?]+)/);
    const mobileMatch = url.match(/mobile\.(?:twitter|x)\.com\/([^\/\?]+)/);
    
    const match = twitterMatch || mobileMatch;
    if (!match) return null;
    
    const username = match[1];
    if (['home', 'explore', 'notifications', 'messages', 'i', 'settings'].includes(username)) {
        return null;
    }
    
    return username;
}

function isValidTwitterPage(url) {
    if (!url) return false;
    
    const validDomains = [
        'twitter.com',
        'x.com',
        'mobile.twitter.com',
        'mobile.x.com'
    ];
    
    return validDomains.some(domain => url.includes(domain));
} 