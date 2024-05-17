// Función para eliminar filas de la tabla que contengan usuarios ignorados
function removeIgnoredUsersFromForumDisplay(ignoredUsers) {
  const rows = document.querySelectorAll('tbody[id^="threadbits_forum_"] tr');
  
  rows.forEach(row => {
    const userSpan = row.querySelector('.smallfont span[onclick^="window.open(\'member.php?u="]');
    if (userSpan && ignoredUsers.includes(userSpan.textContent.trim())) {
      row.remove();
    }
  });
}

// Función para eliminar posts de los usuarios ignorados en showthread.php
function removeIgnoredUsersFromShowThread(ignoredUsers) {
  const posts = document.querySelectorAll('table[id^="post"]');
  
  posts.forEach(post => {
    const userStrong = post.querySelector('.smallfont strong');
    if (userStrong && ignoredUsers.includes(userStrong.textContent.trim())) {
      post.closest('table').remove(); // Elimina el post completo
    }
  });
}

// Función para eliminar hilos que contengan palabras no deseadas en forumdisplay.php
function removeThreadsByWords(words) {
  const rows = document.querySelectorAll('tbody[id^="threadbits_forum_"] tr');
  
  rows.forEach(row => {
    const threadTitle = row.querySelector('a[id^="thread_title_"]');
    if (threadTitle) {
      const titleText = threadTitle.textContent.trim();
      for (const word of words) {
        const regex = new RegExp(word, 'i');
        if (regex.test(titleText)) {
          row.remove();
          break;
        }
      }
    }
  });
}

// Obtener la lista de usuarios ignorados y palabras de chrome.storage
function updateIgnoredUsersAndWords() {
  chrome.storage.local.get(['ignoredUsers', 'ignoredWords'], function(data) {
    const ignoredUsers = data.ignoredUsers || [];
    const ignoredWords = data.ignoredWords || [];
    
    if (window.location.href.includes('forumdisplay.php')) {
      removeIgnoredUsersFromForumDisplay(ignoredUsers);
      removeThreadsByWords(ignoredWords);
    } else if (window.location.href.includes('showthread.php')) {
      removeIgnoredUsersFromShowThread(ignoredUsers);
    }
  });
}

// Función para obtener la lista de usuarios ignorados
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

    // Almacenar los nombres de usuario en chrome.storage
    chrome.storage.local.set({ ignoredUsers: userNames }, function() {
      console.log('Ignored users saved:', userNames);
      // Actualizar la lista de usuarios ignorados en la página actual
      updateIgnoredUsersAndWords();
    });
  })
  .catch(error => {
    console.error('Fetch error:', error);
  });
}

// Escuchar actualizaciones en las URLs específicas y actualizar la lista directamente
if (window.location.href.includes('https://forocoches.com/foro/profile.php?do=doaddlist') ||
    window.location.href.includes('https://forocoches.com/foro/profile.php?do=doremovelist')) {
  fetchIgnoredUsers();
}

// Escuchar mensajes para actualizar la lista de ignorados y palabras
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'fetchIgnoredUsers') {
    fetchIgnoredUsers();
  } else if (request.action === 'updateIgnoredList') {
    updateIgnoredUsersAndWords();
  }
});

updateIgnoredUsersAndWords();
