chrome.runtime.onInstalled.addListener(function() {
  console.log("Web Annotator extension installed.");
});

function highlightSelectedText() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: highlightText
    });
  });
}

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

function saveAnnotation(url, highlight, note) {
  const date = new Date().toISOString();
  chrome.storage.sync.get([url], function (result) {
    const annotations = result[url] || [];
    annotations.push({ highlight, note, date });
    chrome.storage.sync.set({ [url]: annotations });
  });
}

chrome.commands.onCommand.addListener(function(command) {
  if (command === "highlight-text") {
    highlightSelectedText();
  } else if (command === "search-annotations") {
    searchAnnotations();
  }
});

function searchAnnotations() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: promptSearchAnnotations
    });
  });
}

function promptSearchAnnotations() {
  const query = prompt('Enter the text to search in annotations:');
  if (query !== null) {
    chrome.runtime.sendMessage({ action: 'searchAnnotations', query: query });
  }
}
