document.addEventListener('DOMContentLoaded', function() {
  chrome.storage.sync.get('highlightColor', function(data) {
    const colorInput = document.getElementById('color');
    colorInput.value = data.highlightColor || '#ffff00'; // Default to yellow if no color is set
  });

  document.getElementById('save').addEventListener('click', function() {
    const color = document.getElementById('color').value;
    chrome.storage.sync.set({ highlightColor: color }, function() {
      console.log('Highlight color saved:', color);
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'updateHighlightColor', color: color });
      });
    });
  });

  document.getElementById('exportJson').addEventListener('click', function() {
    chrome.storage.sync.get(null, function(result) {
      const data = JSON.stringify(result, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'annotations.json';
      a.click();
    });
  });

  document.getElementById('search').addEventListener('click', function() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'searchAnnotations', query: query });
    });
  });

  document.getElementById('filterByDate').addEventListener('click', function() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'filterByDate', startDate: startDate, endDate: endDate });
    });
  });

  document.getElementById('exportPdf').addEventListener('click', function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'generatePrintView' });
    });
  });
});
