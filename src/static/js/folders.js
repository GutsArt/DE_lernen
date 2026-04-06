async function fetchJSON(url, options = {}) {
    const response = await fetch(url, options);
    const ct = response.headers.get('Content-Type') || '';
    if (!ct.includes('application/json')) {
        const text = await response.text();
        throw new Error(
            `Сервер повернув не JSON (${response.status}): ${text.slice(0, 120)}`
        );
    }

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
    }

    return data;
}

async function getFoldersInfo() {
    try {
        const folders = await fetchJSON('/folders-info');
        const folderList = document.getElementById('folder-list');
        folderList.innerHTML = '';

        folders.forEach(folder => {
            const folderItem = document.createElement('div');
            folderItem.classList.add('folder-item');
            folderItem.style.position = 'relative';

            const deleteBtn = document.createElement('span');
            deleteBtn.textContent = '❌';
            deleteBtn.title = "Видалити книгу";
            deleteBtn.onclick = async () => {
                if (!confirm(`Ви впевнені, що хочете видалити книгу "${folder.title}"?`)) return;
                try {
                    await fetchJSON(`/delete-folder/${folder.folder_name}`, { method: 'DELETE' });
                    alert('Книгу видалено!');
                    folderItem.remove();
                } catch (error) {
                    alert('Помилка: ' + error.message);
                }
            };
            folderItem.appendChild(deleteBtn);

            // Заголовок книги (только текст, редактируемый)
            const titleElement = document.createElement('h2');
            const titleSpan = document.createElement('span');
            titleSpan.classList.add('editable');
            titleSpan.textContent = folder.title;
            titleSpan.contentEditable = "true";
            titleElement.appendChild(titleSpan);

            // Ссылка на книгу отдельным элементом
            const linkElement = document.createElement('a');
            linkElement.href = `/book/${folder.folder_name}`;
            linkElement.textContent = "📖"; // Можно заменить на иконку 📖 или кнопку
            linkElement.style.marginLeft = "10px"; // Отступ от названия
            titleElement.appendChild(linkElement);

            folderItem.appendChild(titleElement);

            // Обработчик изменения заголовка
            titleSpan.addEventListener('blur', async () => {
                const oldFolderName = folder.folder_name;
                const newTitle = titleSpan.textContent.trim();

                if (newTitle && newTitle !== oldFolderName) {
                    await updateField(oldFolderName, 'title', newTitle); // обновляем на сервере
                    folder.folder_name = newTitle; // обновляем локально
                    linkElement.href = `/book/${newTitle}`; // меняем ссылку
                }
            });

            const imgContainer = document.createElement('p');
            imgContainer.style.textAlign = 'center';
            const imgSpan = document.createElement('span');
            imgSpan.style.cursor = 'pointer';
            imgSpan.style.display = 'inline-block';

            function createImg(src) {
                const imgElement = document.createElement('img');
                imgElement.src = src;
                return imgElement;
            }

            if (folder.image) imgSpan.appendChild(createImg(folder.image));
            else imgSpan.textContent = '📷';

            imgSpan.onclick = async () => {
                const newImage = prompt("Введіть посилання на зображення:", folder.image || '');
                if (!newImage) return;
                await updateField(folder.folder_name, 'image', newImage);
                folder.image = newImage;
                imgSpan.innerHTML = '';
                imgSpan.appendChild(createImg(newImage));
            };

            imgContainer.appendChild(imgSpan);
            folderItem.appendChild(imgContainer);

            const authorP = document.createElement('p');
            authorP.innerHTML = '<strong>Автор: </strong> ';
            const authorSpan = document.createElement('span');
            authorSpan.classList.add('editable');
            authorSpan.textContent = folder.author;
            authorSpan.contentEditable = "true";
            
            // Сохраняем оригинальное значение при фокусе и сравниваем при потере фокуса
            authorSpan.addEventListener('focus', () => {authorSpan.dataset.original = authorSpan.textContent;});
            authorSpan.addEventListener('blur', () => {
                const newVal = authorSpan.textContent.trim();
                if (newVal !== authorSpan.dataset.original) {
                    updateField(folder.folder_name, 'author', newVal);
                    folder.author = newVal; // обновляем локально
                }
            });
            
            authorP.appendChild(authorSpan);
            folderItem.appendChild(authorP);

            const diffP = document.createElement('p');
            diffP.innerHTML = '<strong>Складність: </strong> ';
            const diffSpan = document.createElement('span');
            diffSpan.classList.add('editable');
            diffSpan.textContent = folder.difficulty;
            diffSpan.contentEditable = "true";
            
            diffSpan.addEventListener('focus', () => {diffSpan.dataset.original = diffSpan.textContent;});
            diffSpan.addEventListener('blur', () => {
                const newVal = diffSpan.textContent.trim();
                if (newVal !== diffSpan.dataset.original) {
                    updateField(folder.folder_name, 'difficulty', newVal);
                    folder.difficulty = newVal;
                }   
            });

            diffP.appendChild(diffSpan);
            folderItem.appendChild(diffP);

            folderList.appendChild(folderItem);
        });
    } catch (error) {
        document.getElementById('error-message').textContent = error.message;
    }
}

async function addFolder(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    data.folder_name = data.title;

    try {
        await fetchJSON('/add-folder', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        alert('Книгу додано!');
        event.target.reset();
        getFoldersInfo();
    } catch (error) {
        alert('Помилка: ' + error.message);
    }
}

async function updateField(folder_name, field, value) {
    const data = {};
    data[field] = value;

    try {
        await fetchJSON(`/edit-folder/${folder_name}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
    } catch (error) {
        alert('Помилка: ' + error.message);
    }
}

window.onload = getFoldersInfo;