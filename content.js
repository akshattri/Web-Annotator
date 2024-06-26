document.addEventListener('DOMContentLoaded', function() {
  initAnnotations();
});

function initAnnotations() {
  const url = window.location.href;
  chrome.storage.sync.get([url], function(result) {
    if (chrome.runtime.lastError) {
      console.error('Error retrieving annotations:', chrome.runtime.lastError);
      return;
    }
    const annotations = result[url] || [];
    console.log('Annotations loaded:', annotations);
    displayAnnotations(annotations, annotations);
  });
}

document.addEventListener('mouseup', function() {
  const selectedText = window.getSelection().toString();
  if (selectedText.length > 0) {
    const note = prompt('Add a note to this highlight:');
    if (note !== null) {
      chrome.storage.sync.get('highlightColor', function(data) {
        const highlightColor = data.highlightColor || 'yellow';
        const span = document.createElement('span');
        span.style.backgroundColor = highlightColor;
        span.className = 'highlighted-text';
        span.title = note;
        span.textContent = selectedText;
        const range = window.getSelection().getRangeAt(0);
        range.deleteContents();
        range.insertNode(span);
        saveAnnotation(window.location.href, span.outerHTML, note);
      });
    }
  }
});

function saveAnnotation(url, highlight, note) {
  const date = new Date().toISOString();
  chrome.storage.sync.get([url], function(result) {
    if (chrome.runtime.lastError) {
      console.error('Error retrieving annotations:', chrome.runtime.lastError);
      return;
    }
    const annotations = result[url] || [];
    annotations.push({ highlight, note, date });
    chrome.storage.sync.set({ [url]: annotations }, function() {
      if (chrome.runtime.lastError) {
        console.error('Error saving annotation:', chrome.runtime.lastError);
      } else {
        console.log('Annotation saved:', { highlight, note, date });
      }
    });
  });
}

function displayAnnotations(annotations, allAnnotations) {
  console.log('Displaying annotations:', annotations);

  document.querySelectorAll('.highlighted-text').forEach(node => {
    node.classList.remove('blink');
  });

  annotations.forEach(annotation => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = annotation.highlight;
    const span = tempDiv.firstChild;

    if (span) {
      const originalSpan = Array.from(document.querySelectorAll('.highlighted-text')).find(node => node.outerHTML === span.outerHTML);

      if (originalSpan) {
        originalSpan.classList.add('blink');
        originalSpan.addEventListener('click', function() {
          showNotePopup(annotation.note, originalSpan);
        });
      }
    } else {
      console.error('Failed to create annotation element from:', annotation.highlight);
    }
  });

  setTimeout(() => {
    document.querySelectorAll('.highlighted-text').forEach(node => {
      node.classList.remove('blink');
    });
  }, 3000);

  generateAnnotationList(allAnnotations);
}

function showNotePopup(note, element) {
  let popup = document.createElement('div');
  popup.className = 'note-popup';
  popup.innerText = note;
  document.body.appendChild(popup);

  const rect = element.getBoundingClientRect();
  popup.style.top = `${rect.top + window.scrollY + element.offsetHeight}px`;
  popup.style.left = `${rect.left + window.scrollX}px`;

  setTimeout(() => {
    document.body.removeChild(popup);
  }, 3000);
}

function updateHighlightColor(color) {
  chrome.storage.sync.set({ highlightColor: color }, function() {
    console.log('Highlight color updated:', color);
  });
}

function generateAnnotationList(annotations) {
  const existingList = document.getElementById('annotation-list');
  if (existingList) existingList.remove();

  const annotationList = document.createElement('div');
  annotationList.id = 'annotation-list';
  annotationList.style.borderTop = '1px solid #000';
  annotationList.style.padding = '10px';
  annotationList.style.marginTop = '20px';

  const title = document.createElement('h2');
  title.textContent = 'Annotations';
  annotationList.appendChild(title);

  annotations.forEach(annotation => {
    const item = document.createElement('p');
    item.innerHTML = `<strong>Highlighted:</strong> ${annotation.highlight} <br> <strong>Note:</strong> ${annotation.note}`;
    annotationList.appendChild(item);
  });

  document.body.appendChild(annotationList);
}

function generatePrintView() {
  const url = window.location.href;
  chrome.storage.sync.get([url], function(result) {
    if (chrome.runtime.lastError) {
      console.error('Error retrieving annotations:', chrome.runtime.lastError);
      return;
    }
    const annotations = result[url] || [];
    const annotationList = document.createElement('div');
    annotationList.id = 'annotationList';
    annotationList.style.marginTop = '50px';
    annotationList.style.borderTop = '1px solid #ccc';
    annotationList.style.paddingTop = '20px';
    annotationList.innerHTML = '<h2>Annotations</h2>';
    annotations.forEach((annotation, index) => {
      const item = document.createElement('div');
      item.style.marginBottom = '10px';
      item.innerHTML = `<strong>${index + 1}. Note:</strong> ${annotation.note} <br> <strong>Highlight:</strong> ${annotation.highlight}`;
      annotationList.appendChild(item);
    });
    document.body.appendChild(annotationList);

    const printStyle = document.createElement('style');
    printStyle.id = 'printStyle';
    printStyle.textContent = `
      @media print {
        .highlighted-text {
          -webkit-print-color-adjust: exact;
        }
        #annotationList {
          display: block;
          page-break-before: always;
        }
      }
    `;
    document.head.appendChild(printStyle);

    window.print();

    document.body.removeChild(annotationList);
    document.head.removeChild(printStyle);
  });
}

const style = document.createElement('style');
style.textContent = `
  .note-popup {
    position: absolute;
    background-color: #fff;
    border: 1px solid #ccc;
    padding: 10px;
    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
    z-index: 1000;
  }
  .highlighted-text {
    cursor: pointer;
  }
  .blink {
    animation: blink-animation 1s steps(5, start) infinite;
    -webkit-animation: blink-animation 1s steps(5, start) infinite;
  }
  @keyframes blink-animation {
    to {
      visibility: hidden;
    }
  }
  @-webkit-keyframes blink-animation {
    to {
      visibility: hidden;
    }
  }
`;
document.head.appendChild(style);

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('Message received:', request);
  if (request.action === 'searchAnnotations') {
    handleSearchAnnotations(request.query, sendResponse);
  } else if (request.action === 'filterByDate') {
    handleFilterByDate(request.startDate, request.endDate, sendResponse);
  } else if (request.action === 'updateHighlightColor') {
    updateHighlightColor(request.color);
  } else if (request.action === 'generatePrintView') {
    generatePrintView();
  }
  return true; 
});

function handleSearchAnnotations(query, sendResponse) {
  const url = window.location.href;
  chrome.storage.sync.get([url], function(result) {
    if (chrome.runtime.lastError) {
      console.error('Error retrieving annotations:', chrome.runtime.lastError);
      sendResponse({ success: false, error: chrome.runtime.lastError });
      return;
    }
    const annotations = result[url] || [];
    const filtered = query.trim() === '' ? annotations : annotations.filter(annotation => {
      const lowerQuery = query.toLowerCase();
      return annotation.note.toLowerCase().includes(lowerQuery) || annotation.highlight.toLowerCase().includes(lowerQuery);
    });

    if (filtered.length === 0) {
      alert('No annotations found for the given search query. There might be a spelling error, please recheck.');
    }

    displayAnnotations(filtered, annotations);
    sendResponse({ success: true, annotations: filtered });
  });
}

function handleFilterByDate(startDate, endDate, sendResponse) {
  const url = window.location.href;
  chrome.storage.sync.get([url], function(result) {
    if (chrome.runtime.lastError) {
      console.error('Error retrieving annotations:', chrome.runtime.lastError);
      sendResponse({ success: false, error: chrome.runtime.lastError });
      return;
    }
    const annotations = result[url] || [];
    console.log(`Filtering annotations between ${startDate} and ${endDate}`);
    
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    const filtered = (!startDate && !endDate) ? annotations : annotations.filter(annotation => {
      const annotationDate = new Date(annotation.date);
      console.log(`Annotation date: ${annotationDate}, Start date: ${start}, End date: ${end}`);
      return annotationDate >= start && annotationDate <= end;
    });
    
    if (filtered.length === 0) {
      alert('No annotations found within the specified date range.');
    }

    displayAnnotations(filtered, annotations);
    sendResponse({ success: true, annotations: filtered });
  });
}
