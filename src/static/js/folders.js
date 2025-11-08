async function getFoldersInfo() {
    try {
        const response = await fetch('/folders-info');
        if (!response.ok) throw new Error('Не удалось загрузить информацию о папках.');

        const folders = await response.json();
        const folderList = document.getElementById('folder-list');
        folderList.innerHTML = '';

        folders.forEach(folder => {
            const folderItem = document.createElement('div');
            folderItem.classList.add('folder-item');
            folderItem.style.position = 'relative';

            const deleteBtn = document.createElement('span');
            deleteBtn.textContent = '❌';
            deleteBtn.title = "Удалить книгу";
            deleteBtn.onclick = async () => {
                if (!confirm(`Вы уверены, что хотите удалить книгу "${folder.title}"?`)) return;
                const resp = await fetch(`/delete-folder/${folder.folder_name}`, { method: 'DELETE' });
                const result = await resp.json();
                if (resp.ok) {
                    alert('Книга удалена!');
                    folderItem.remove();
                } else {
                    alert('Ошибка: ' + (result.error || 'Неизвестная ошибка'));
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
                const newImage = prompt("Введите ссылку на изображение:", folder.image || '');
                if (!newImage) return;
                await updateField(folder.folder_name, 'image', newImage);
                folder.image = newImage;
                imgSpan.innerHTML = '';
                imgSpan.appendChild(createImg(newImage));
            };

            imgContainer.appendChild(imgSpan);
            folderItem.appendChild(imgContainer);

            const authorP = document.createElement('p');
            authorP.innerHTML = '<strong>Автор:</strong> ';
            const authorSpan = document.createElement('span');
            authorSpan.classList.add('editable');
            authorSpan.textContent = folder.author;
            authorSpan.contentEditable = "true";
            authorSpan.addEventListener('blur', () => updateField(folder.folder_name, 'author', authorSpan.textContent));
            authorP.appendChild(authorSpan);
            folderItem.appendChild(authorP);

            const diffP = document.createElement('p');
            diffP.innerHTML = '<strong>Сложность:</strong> ';
            const diffSpan = document.createElement('span');
            diffSpan.classList.add('editable');
            diffSpan.textContent = folder.difficulty;
            diffSpan.contentEditable = "true";
            diffSpan.addEventListener('blur', () => updateField(folder.folder_name, 'difficulty', diffSpan.textContent));
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

    const response = await fetch('/add-folder', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    });

    const result = await response.json();
    if (response.ok) {
        alert('Книга добавлена!');
        event.target.reset();
        getFoldersInfo();
    } else {
        alert('Ошибка: ' + (result.error || 'Неизвестная ошибка'));
    }
}

async function updateField(folder_name, field, value) {
    const data = {};
    data[field] = value;
    const response = await fetch(`/edit-folder/${folder_name}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!response.ok) alert('Ошибка: ' + (result.error || 'Неизвестная ошибка'));
}

window.onload = getFoldersInfo;