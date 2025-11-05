
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
        const rect = element.getBoundingClientRect();
        const boxWidth = 200; // Задаем примерную ширину translationBox
        const padding = 10;   // Отступ от границ экрана

        translationBox.innerHTML = ''; // Очищаем предыдущий перевод

        // ПЕРЕВОД слова
        const source = translationInfo.article ? 'Leo' : 'G';
        const mainText = document.createElement('div');
        mainText.innerHTML = `<b>${source}</b>: ${translationInfo.translation}`;
        translationBox.appendChild(mainText);

        // 🔊 Кнопка озвучивания
        const speakButton = document.createElement('button');
        speakButton.innerText = "🔊";
        speakButton.addEventListener("click", function () {
            const utterance = new SpeechSynthesisUtterance(wordId);
            utterance.lang = "de-DE";
            speechSynthesis.speak(utterance);
        });
        translationBox.appendChild(speakButton);

        // Тип слова + aртикль с словом / формы глагола
        if (translationInfo.article) {
            const infoLine = document.createElement('div');
            infoLine.innerHTML = `<i>${translationInfo.type}</i>: ${translationInfo.article}`;
            translationBox.appendChild(infoLine);
        }


        // Кнопка сохранения/удаления слова
        const saveButton = document.createElement('button');
        saveButton.innerText = savedWords[wordId] ? "❌" : "➕";
        
        saveButton.addEventListener("click", function toggleWord() {
            if (savedWords[wordId]) {
                removeWord(wordId);
                element.classList.remove('save-word');
                saveButton.innerText = "➕";
            } else {
                saveWord(wordId, translationInfo.translation);
                element.classList.add('save-word');
                saveButton.innerText = "❌";
            }
        });
        translationBox.appendChild(saveButton);

        translationBox.style.display = 'block';
    
        let left = rect.left + window.scrollX;
        let top = rect.top + window.scrollY - translationBox.offsetHeight - 5;
    
        // Проверяем, не выходит ли блок за левую границу
        if (left < padding) {
            left = padding;
        }
    
        // Проверяем, не выходит ли блок за правую границу
        if (left + boxWidth > window.innerWidth - padding) {
            left = window.innerWidth - boxWidth - padding;
        }
    
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
        sentenceTranslationBox.innerHTML = `\\\|/: ${translation}`;

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


