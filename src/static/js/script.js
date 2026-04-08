document.addEventListener('DOMContentLoaded', () => {
    const bookContent = document.getElementById('book-content');
    // Название книги для привязки слов
    const BOOK_ID = bookContent.dataset.folder;

    const translationBox = document.getElementById('translation-box'); // Для перевода слов
    const sentenceTranslationBox = document.getElementById('sentence-translation-box'); // Для перевода предложений
    const savedWordsList = document.getElementById('saved-words-list');

    let activeElement = null; // Отслеживание активного слова/предложения


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



    // TRANSLATION
    // Функция для перевода слова
    async function getWordTranslation(word) {
        try {
            const response = await fetch(`/translate_word/${encodeURIComponent(word)}`);

            // ✅ Проверяем HTTP-статус явно
            if (!response.ok) {
                console.warn(`Translate error: ${response.status}`);
                return { translation: "Не знайдено" };
            }

            const ct = response.headers.get('Content-Type') || '';
            if (!ct.includes('application/json')) {
                return { translation: "Помилка сервера" };
            }

            const data = await response.json();

            // ✅ Если сервер вернул { error: "..." } — обрабатываем явно
            if (data.error) {
                console.warn("Translation API error:", data.error);
                return { translation: "Не знайдено" };
            }

            return data;
        } catch (error) {
            console.error("Помилка при отриманні перекладу", error);
            // ✅ article не возвращаем — showTranslation корректно
            // обрабатывает отсутствие article (однострочный режим)
            return { translation: "Помилка з'єднання" };
        }
    }

    // Функция для перевода предложения
    async function getSentenceTranslation(sentence) {
        // ✅ Пустую строку не отправляем — зря грузим сервер
        if (!sentence.trim()) return "";

        try {
            // ✅ POST — тело запроса не ограничено длиной URL
            const response = await fetch('/translate_sentence', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sentence })
            });

            if (!response.ok) {
                console.warn(`Sentence translate error: ${response.status}`);
                return "Не вдалося перекласти";
            }

            const data = await response.json();
            return data.translation || "Не вдалося перекласти";

        } catch (error) {
            console.error("Помилка при отриманні перекладу речення", error);
            return "Помилка з'єднання";
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

            if (buttonIcon) {
                const button = document.createElement('button');
                button.textContent = buttonIcon;
                button.addEventListener('click', onButtonClick);
                row.appendChild(button);
            }

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
        mainWord.title = 'Натисни, щоб скопіювати';
        mainWord.addEventListener('click', () => {
            navigator.clipboard.writeText(mainWord.innerText);
        });

        // === 4. Вторая строка (если есть артикль/тип) + ➕/❌ ===
        let words = loadWords();
        const saveButtonHandler = () => {
            if (words[wordId]) {
                removeWord(wordId);
                element.classList.remove('save-word');
            } else {
                saveWord(wordId, translationInfo.translation, BOOK_ID);
                element.classList.add('save-word');
            }
            words = loadWords(); // Перезагрузить после изменения
            highlightSavedWords(); // Обновить подсветку всех слов
            updateSavedWordsList(); // Обновить список сохраненных слов
            showTranslation(element, wordId, translationInfo);
        };

        if (translationInfo.article) {
            const infoTextHTML = `<i>${translationInfo.type}</i>: <span class="copyable-word">${translationInfo.article}</span>`;
            const infoText = createRow(infoTextHTML, words[wordId] ? '❌' : '➕', saveButtonHandler);

            const articleSpan = infoText.querySelector('.copyable-word');
            articleSpan.title = 'Натисни, щоб скопіювати';
            articleSpan.addEventListener('click', () => {
                navigator.clipboard.writeText(articleSpan.innerText);
            });
        } else {
            // Если нет артикля — добавить кнопку сохранения к первой строке
            const saveButton = document.createElement('button');
            saveButton.textContent = words[wordId] ? '❌' : '➕';
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

    // Структура:
    // savedWords → { слово: { перевод, книга, дата } }

    const STORAGE_KEY = 'savedWords';

    function loadWords() {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    }

    function saveWord(word, translation, bookName) {
      const words = loadWords();

      // Если слово уже есть — не перезаписываем, добавляем книгу
      if (words[word]) {
        if (!words[word].books.includes(bookName)) {
          words[word].books.push(bookName);
        }
      } else {
        words[word] = {
          translation,
          books: [bookName],        // в каких книгах встречалось
          addedAt: Date.now()       // когда добавлено
        };
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
    }

    function removeWord(word) {
      const words = loadWords();
      delete words[word];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
    }

    // Получить все слова из конкретной книги:
    function getWordsForBook(bookName) {
      const words = loadWords();
      return Object.entries(words)
        .filter(([_, v]) => v.books.includes(bookName));
    }

    // Получить весь словарь (для отдельной страницы):
    function getAllWords() {
      return Object.entries(loadWords());
    }

    function updateSavedWordsList() {
      savedWordsList.innerHTML = '';
      const bookWords = getWordsForBook(BOOK_ID);

      if (!bookWords.length) {
        savedWordsList.innerHTML = '<em style="color:#666">Немає збережених слів</em>';
        return;
      }

      bookWords.forEach(([word, data]) => {
        const row = document.createElement('div');
        row.classList.add('saved-word');
        row.dataset.word = word;

        // Слово — редактируемое
        const wordSpan = document.createElement('span');
        wordSpan.classList.add('editable-word');
        wordSpan.contentEditable = 'true';
        wordSpan.textContent = word;
        wordSpan.addEventListener('focus', () => wordSpan.dataset.original = wordSpan.textContent);
        wordSpan.addEventListener('blur', () => {
          const newWord = wordSpan.textContent.trim();
          if (!newWord) { wordSpan.textContent = wordSpan.dataset.original; return; }
          if (newWord === wordSpan.dataset.original) return;
          if (!renameWord(wordSpan.dataset.original, newWord)) {
            wordSpan.textContent = wordSpan.dataset.original;
            alert('Слово вже існує');
          } else {
            row.dataset.word = newWord;
            highlightSavedWords();
            updateSavedWordsList();
          }
        });
        wordSpan.addEventListener('keydown', e => {
          if (e.key === 'Enter') { e.preventDefault(); wordSpan.blur(); }
          if (e.key === 'Escape') { wordSpan.textContent = wordSpan.dataset.original; wordSpan.blur(); }
        });

        // Перевод — редактируемый
        const sep = document.createElement('span');
        sep.textContent = ': ';

        const transSpan = document.createElement('span');
        transSpan.classList.add('editable-translation');
        transSpan.contentEditable = 'true';
        transSpan.textContent = data.translation;
        transSpan.addEventListener('focus', () => transSpan.dataset.original = transSpan.textContent);
        transSpan.addEventListener('blur', () => {
          const newTrans = transSpan.textContent.trim();
          if (!newTrans) { transSpan.textContent = transSpan.dataset.original; return; }
          if (newTrans !== transSpan.dataset.original) editTranslation(row.dataset.word, newTrans);
        });
        transSpan.addEventListener('keydown', e => {
          if (e.key === 'Enter') { e.preventDefault(); transSpan.blur(); }
          if (e.key === 'Escape') { transSpan.textContent = transSpan.dataset.original; transSpan.blur(); }
        });

        // Кнопка удаления
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '❌';
        deleteBtn.onclick = () => { removeWord(row.dataset.word); updateSavedWordsList(); highlightSavedWords(); };

        row.append(wordSpan, sep, transSpan, deleteBtn);
        savedWordsList.appendChild(row);
      });
    }

    function highlightSavedWords() {
      const words = loadWords();
      document.querySelectorAll('.word').forEach(el => {
        el.classList.toggle('save-word', !!words[el.id || el.innerText.trim()]);
      });
    }

    // Загружаем подсветку и список при старте
    highlightSavedWords();
    updateSavedWordsList();

});


