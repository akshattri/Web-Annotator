// Listens for commands defined in the manifest (like keyboard shortcuts)
chrome.commands.onCommand.addListener(function (command) {
  if (command === 'highlight') {
    highlightSelectedText();
  }
});

// Function to highlight selected text by injecting a content script into the active tab
function highlightSelectedText() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: highlightText
    });
  });
}

// The function to be injected into the content script to highlight selected text
function highlightText() {
  const selectedText = window.getSelection().toString();
  if (selectedText.length > 0) {
    chrome.storage.sync.get('highlightColor', function (data) {
      const highlightColor = data.highlightColor || 'yellow';
      const span = document.createElement('span');
      span.style.backgroundColor = highlightColor;
      span.textContent = selectedText;
      const range = window.getSelection().getRangeAt(0);
      range.deleteContents();
      range.insertNode(span);
      saveAnnotation(window.location.href, span.outerHTML, '');
    });
  }
}

// Function to save the annotation (can be reused in content script as well)
function saveAnnotation(url, highlight, note) {
  const date = new Date().toISOString();
  chrome.storage.sync.get([url], function (result) {
    const annotations = result[url] || [];
    annotations.push({ highlight, note, date });
    chrome.storage.sync.set({ [url]: annotations });
  });
}
