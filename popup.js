document.addEventListener('DOMContentLoaded', function() {
  const fetchButton = document.getElementById('fetchButton');
  const clearButton = document.getElementById('clearButton');
  const copyIcon = document.getElementById('copyIcon');
  const ignoredListDiv = document.getElementById('ignoredList');
  const emptyMessage = document.getElementById('emptyMessage');
  const ignoredListContainer = document.getElementById('ignoredListContainer');
  const wordInput = document.getElementById('wordInput');
  const addWordButton = document.getElementById('addWordButton');
  const ignoredWordsListDiv = document.getElementById('ignoredWordsList');
  const wordsEmptyMessage = document.getElementById('wordsEmptyMessage');
  const ignoredWordsListContainer = document.getElementById('ignoredWordsListContainer');
  const clearWordsButton = document.getElementById('clearWordsButton');
  const tabIgnoredUsers = document.getElementById('tabIgnoredUsers');
  const tabIgnoredWords = document.getElementById('tabIgnoredWords');
  const ignoredUsersTab = document.getElementById('ignoredUsersTab');
  const ignoredWordsTab = document.getElementById('ignoredWordsTab');

  tabIgnoredUsers.addEventListener('click', function(event) {
    openTab(event, 'ignoredUsersTab');
    fetchIgnoredUsers(); // Actualizar la lista de usuarios ignorados solo al abrir la pestaña
  });

  tabIgnoredWords.addEventListener('click', function(event) {
    openTab(event, 'ignoredWordsTab');
  });

  function updateIgnoredList(userNames) {
    ignoredListDiv.innerHTML = ''; // Limpiar la lista antes de añadir nuevos elementos
    if (userNames.length === 0) {
      emptyMessage.classList.remove('hidden');
      ignoredListContainer.classList.add('hidden');
    } else {
      emptyMessage.classList.add('hidden');
      ignoredListContainer.classList.remove('hidden');
      userNames.forEach(userName => {
        const userDiv = document.createElement('div');
        userDiv.classList.add('ignored-user');
        userDiv.textContent = userName;
        ignoredListDiv.appendChild(userDiv);
      });
    }
  }

  function updateIgnoredWordsList(words) {
    ignoredWordsListDiv.innerHTML = ''; // Limpiar la lista antes de añadir nuevos elementos
    if (words.length === 0) {
      wordsEmptyMessage.classList.remove('hidden');
      ignoredWordsListContainer.classList.add('hidden');
    } else {
      wordsEmptyMessage.classList.add('hidden');
      ignoredWordsListContainer.classList.remove('hidden');
      words.forEach(word => {
        const wordDiv = document.createElement('div');
        wordDiv.classList.add('ignored-word');
        
        const wordSpan = document.createElement('span');
        wordSpan.textContent = word;

        const removeButton = document.createElement('button');
        removeButton.innerHTML = '<span class="material-symbols-outlined">close</span>';
        removeButton.addEventListener('click', function() {
          removeWordFromIgnoredList(word);
        });

        wordDiv.appendChild(wordSpan);
        wordDiv.appendChild(removeButton);
        ignoredWordsListDiv.appendChild(wordDiv);
      });
    }
  }

  function fetchIgnoredUsers() {
    fetch('https://forocoches.com/foro/profile.php?do=ignorelist', {
      credentials: 'include' // Incluye cookies y credenciales de sesión
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.text();
    })
    .then(data => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(data, 'text/html');
      const userListItems = doc.querySelectorAll('#ignorelist li a');
      const userNames = [];

      userListItems.forEach(item => {
        userNames.push(item.textContent.trim());
      });

      // Actualizar la lista de ignorados en el popup
      updateIgnoredList(userNames);

      // Almacenar los nombres de usuario en chrome.storage
      chrome.storage.local.set({ ignoredUsers: userNames }, function() {
        console.log('Ignored users saved:', userNames);
      });
    })
    .catch(error => {
      console.error('Fetch error:', error);
    });
  }

  function addWordToIgnoredList() {
    const newWord = wordInput.value.trim();
    if (newWord === '') return;

    chrome.storage.local.get('ignoredWords', function(data) {
      const ignoredWords = data.ignoredWords || [];
      ignoredWords.push(newWord);
      chrome.storage.local.set({ ignoredWords }, function() {
        updateIgnoredWordsList(ignoredWords);
        wordInput.value = '';
        refreshPage();
      });
    });
  }

  function removeWordFromIgnoredList(word) {
    chrome.storage.local.get('ignoredWords', function(data) {
      const ignoredWords = data.ignoredWords || [];
      const updatedWords = ignoredWords.filter(w => w !== word);
      chrome.storage.local.set({ ignoredWords: updatedWords }, function() {
        updateIgnoredWordsList(updatedWords);
        refreshPage();
      });
    });
  }

  fetchButton.addEventListener('click', fetchIgnoredUsers);

  clearButton.addEventListener('click', function() {
    // Limpiar la lista de usuarios ignorados en chrome.storage
    chrome.storage.local.remove('ignoredUsers', function() {
      console.log('Ignored users list cleared');
      // Actualizar la lista de ignorados en el popup
      updateIgnoredList([]);
    });
  });

  copyIcon.addEventListener('click', function() {
    // Copiar la lista de usuarios ignorados al portapapeles
    chrome.storage.local.get('ignoredUsers', function(data) {
      if (data.ignoredUsers) {
        const userNames = data.ignoredUsers.join('\n');
        navigator.clipboard.writeText(userNames).then(() => {
          console.log('Ignored users list copied to clipboard');
        });
      }
    });
  });

  addWordButton.addEventListener('click', addWordToIgnoredList);

  wordInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
      addWordToIgnoredList();
    }
  });

  clearWordsButton.addEventListener('click', function() {
    // Limpiar la lista de palabras ignoradas en chrome.storage
    chrome.storage.local.remove('ignoredWords', function() {
      console.log('Ignored words list cleared');
      // Actualizar la lista de palabras ignoradas en el popup
      updateIgnoredWordsList([]);
      refreshPage();
    });
  });

  // Cargar la lista de ignorados y palabras almacenadas al abrir el popup
  chrome.storage.local.get(['ignoredUsers', 'ignoredWords'], function(data) {
    const userNames = data.ignoredUsers || [];
    const words = data.ignoredWords || [];
    updateIgnoredList(userNames);
    updateIgnoredWordsList(words);
  });

  // Mostrar la pestaña de palabras ignoradas por defecto
  tabIgnoredWords.click();

  function refreshPage() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const activeTab = tabs[0];
      if (activeTab && activeTab.url.includes('forocoches.com/foro/')) {
        chrome.tabs.reload(activeTab.id);
      }
    });
  }
  
  function openTab(event, tabName) {
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.classList.add('hidden'));

    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => button.classList.remove('active'));

    document.getElementById(tabName).classList.remove('hidden');
    event.currentTarget.classList.add('active');
  }

});
