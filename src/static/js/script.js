
document.addEventListener('DOMContentLoaded', () => {
    const bookContent = document.getElementById('book-content');
    const translationBox = document.getElementById('translation-box'); // Для перевода слов
    const sentenceTranslationBox = document.getElementById('sentence-translation-box'); // Для перевода предложений
    const savedWordsList = document.getElementById('saved-words-list');

    let activeElement = null; // Отслеживание активного слова/предложения
    let savedWords = JSON.parse(localStorage.getItem('savedWords')) || {}; // Загружаем сохраненные слова


    highlightSavedWords();

    // Обработчик клика по тексту книги
    bookContent.addEventListener('click', async function(event) {
        const clickedElement = event.target;

        if (clickedElement.classList.contains('word')) {
            handleWordClick(clickedElement);
            handleSentenceClick(clickedElement.closest('.sentence')); // Перевод всего предложения
        } else if (clickedElement.classList.contains('sentence')) {
            handleSentenceClick(clickedElement);
        }
    });

    // Обработка клика на слово
    async function handleWordClick(element) {
        if (activeElement === element) {
            translationBox.style.display = 'none';
            activeElement = null;
            return;
        }

        activeElement = element;
        const wordId = element.id || element.innerText.trim(); // Если id нет, используем текст
        const translationInfo = await getWordTranslation(wordId);
        showTranslation(element, wordId, translationInfo);
    }

    // Обработка клика на предложение
    async function handleSentenceClick(element) {
        if (!element) return; // Если предложения нет, ничего не делать

        const sentence = element.innerText;
        const translation = await getSentenceTranslation(sentence);
        showSentenceTranslation(element, sentence, translation);
    }

    // Функция для перевода слова
    async function getWordTranslation(word) {
        try {
            const response = await fetch(`/translate_word/${word}`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Ошибка при получении перевода", error);
            return { translation: "Ошибка", article: "Ошибка" };
        }
    }

    // Функция для перевода предложения
    async function getSentenceTranslation(sentence) {
        try {
            const response = await fetch(`/translate_sentence/${encodeURIComponent(sentence)}`);
            const data = await response.json();
            return data.translation || "Ошибка";
        } catch (error) {
            console.error("Ошибка при получении перевода предложения", error);
            return "Ошибка";
        }
    }











    function showTranslation(element, wordId, translationInfo) {
        // === 1. Очистка и подготовка ===
        translationBox.innerHTML = '';
        const rect = element.getBoundingClientRect();

        // === 2. Создаём универсальную строку (текст + кнопка) ===
        const createRow = (labelHTML, buttonIcon, onButtonClick) => {
            const row = document.createElement('div');
            row.classList.add('translation-row');

            const textContainer = document.createElement('div');
            textContainer.classList.add('translation-text');
            textContainer.innerHTML = labelHTML;
            row.appendChild(textContainer);

            const button = document.createElement('button');
            button.textContent = buttonIcon;
            button.addEventListener('click', onButtonClick);
            row.appendChild(button);

            translationBox.appendChild(row);
            return textContainer;
        };

        // === 3. Первая строка: основной перевод + 🔊 ===
        const source = translationInfo.article ? 'Leo' : 'G';
        const mainTextHTML = `<b>${source}</b>: <span class="copyable-word">${translationInfo.translation}</span>`;
        const mainText = createRow(mainTextHTML, '🔊', () => {
            const utterance = new SpeechSynthesisUtterance(wordId);
            utterance.lang = 'de-DE';
            speechSynthesis.speak(utterance);
        });

        // Добавляем копирование по клику
        const mainWord = mainText.querySelector('.copyable-word');
        mainWord.title = 'Нажми, чтобы скопировать';
        mainWord.addEventListener('click', () => {
            navigator.clipboard.writeText(mainWord.innerText);
        });

        // === 4. Вторая строка (если есть артикль/тип) + ➕/❌ ===
        const saveButtonHandler = () => {
            if (savedWords[wordId]) {
                removeWord(wordId);
                element.classList.remove('save-word');
            } else {
                saveWord(wordId, translationInfo.translation);
                element.classList.add('save-word');
            }
            showTranslation(element, wordId, translationInfo); // Перерисовать состояние кнопки
        };

        if (translationInfo.article) {
            const infoTextHTML = `<i>${translationInfo.type}</i>: <span class="copyable-word">${translationInfo.article}</span>`;
            const infoText = createRow(infoTextHTML, savedWords[wordId] ? '❌' : '➕', saveButtonHandler);

            const articleSpan = infoText.querySelector('.copyable-word');
            articleSpan.title = 'Нажми, чтобы скопировать';
            articleSpan.addEventListener('click', () => {
                navigator.clipboard.writeText(articleSpan.innerText);
            });
        } else {
            // Если нет артикля — добавить кнопку сохранения к первой строке
            const saveButton = document.createElement('button');
            saveButton.textContent = savedWords[wordId] ? '❌' : '➕';
            saveButton.addEventListener('click', saveButtonHandler);
            mainText.parentElement.appendChild(saveButton);
        }

        // === 5. Показать блок перевода ===
        translationBox.style.display = 'block';

        // Аккуратное позиционирование над элементом
        const padding = 16;
        const boxWidth = translationBox.offsetWidth;
        let left = rect.left + window.scrollX;
        let top = rect.top + window.scrollY - translationBox.offsetHeight - 8;

        // Не выходить за экран
        if (left + boxWidth > window.innerWidth - padding) {
            left = window.innerWidth - boxWidth - padding;
        }
        if (left < padding) left = padding;
        if (top < padding) top = rect.bottom + window.scrollY + 8; // если нет места сверху — показать снизу

        translationBox.style.left = `${left}px`;
        translationBox.style.top = `${top}px`;
    }





    document.addEventListener("click", function(event) {
        const translationBox = document.getElementById("translation-box");
        const sentencetranslationBox = document.getElementById("sentence-translation-box");
    
        // Проверяем, нажал ли пользователь НЕ на слово
        if (!event.target.classList.contains("word") && translationBox && sentencetranslationBox) {
            translationBox.style.display = "none";
            sentencetranslationBox.style.display = "none";
        }
    });
    

    function showSentenceTranslation(element, sentence, translation) {
        const rect = element.getBoundingClientRect();
    
        sentenceTranslationBox.style.left = `${rect.left}px`;
        sentenceTranslationBox.style.top = `${rect.bottom + window.scrollY + 5}px`;
        sentenceTranslationBox.style.display = 'block';
        sentenceTranslationBox.innerHTML = `\\\|/: ${translation} `;

        // 🔊 Кнопка для озвучивания
        const speakButton = document.createElement('button');
        speakButton.innerText = "🔊";
        speakButton.addEventListener("click", function () {
            const utterance = new SpeechSynthesisUtterance(sentence);
            utterance.lang = "de-DE";
            speechSynthesis.speak(utterance);
        });
        sentenceTranslationBox.appendChild(speakButton);    
    }

    



    function saveWord(wordId, translation) {
        if (!savedWords[wordId]) {
            savedWords[wordId] = translation;
            localStorage.setItem('savedWords', JSON.stringify(savedWords));
            updateSavedWordsList();
            highlightSavedWords();
        }
    }
    
    function removeWord(wordId) {
        if (savedWords[wordId]) {
            delete savedWords[wordId];  // Удаляем из объекта
            localStorage.setItem('savedWords', JSON.stringify(savedWords)); // Обновляем localStorage
            updateSavedWordsList(); // Обновляем список
            highlightSavedWords(); // Убираем подсветку
        }
    }
    
    function updateSavedWordsList() {
        savedWordsList.innerHTML = ''; // Очищаем список
    
        for (const wordId in savedWords) {
            const savedWord = document.createElement('div');
            savedWord.classList.add('saved-word');
            savedWord.innerText = `${wordId}: ${savedWords[wordId]}`;
    
            // Добавляем кнопку удаления
            const deleteButton = document.createElement('button');
            deleteButton.innerText = "❌";
            deleteButton.style.marginLeft = "10px";
            deleteButton.style.color = "black";
            deleteButton.onclick = function() {
                removeWord(wordId);
            };
    
            savedWord.appendChild(deleteButton);
            savedWordsList.appendChild(savedWord);
        }
    }
    
    function highlightSavedWords() {
        document.querySelectorAll('.word').forEach(wordElement => {
            const wordId = wordElement.id || wordElement.innerText.trim();
            if (savedWords[wordId]) {
                wordElement.classList.add('save-word');
            } else {
                wordElement.classList.remove('save-word');
            }
        });
    }
    
    // Загружаем сохранённые слова при старте
    updateSavedWordsList();
    
});


