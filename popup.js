document.addEventListener('DOMContentLoaded', function() {
  const fetchButton = document.getElementById('fetchButton');
  const clearButton = document.getElementById('clearButton');
  const copyIcon = document.getElementById('copyIcon');
  const ignoredListDiv = document.getElementById('ignoredList');
  const emptyMessage = document.getElementById('emptyMessage');
  const ignoredListContainer = document.getElementById('ignoredListContainer');

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

  // Cargar la lista de ignorados almacenada al abrir el popup
  chrome.storage.local.get('ignoredUsers', function(data) {
    const userNames = data.ignoredUsers || [];
    updateIgnoredList(userNames);
  });

  // Actualizar automáticamente la lista de ignorados al abrir el popup por primera vez
  fetchIgnoredUsers();
});
