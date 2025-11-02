// // Получаем все элементы с классом "word" из текста книги
// const words = document.querySelectorAll('.word');
// const translationBox = document.getElementById('translation');
// const translationText = document.getElementById('translation-text');

// // Добавляем обработчик клика на каждое слово
// words.forEach(word => {
//     word.addEventListener('click', function () {
//         // Убираем выделение с других слов
//         document.querySelectorAll('.word').forEach(w => w.classList.remove('highlighted'));

//         // Добавляем выделение на текущем слове
//         this.classList.add('highlighted');

//         // Получаем перевод из атрибута 'data-translation'
//         const translation = this.getAttribute('data-translation');

//         // Отображаем перевод
//         translationText.textContent = `Перевод: ${translation}`;
//         translationBox.style.display = 'block';
        
//         // Переключение между цветами слова
//         this.style.color = this.style.color === 'red' ? 'green' : 'red'; // Переключение между красным и синим
//     });
// });

// // Закрытие перевода, если кликать в другое место на странице
// document.body.addEventListener('click', function (e) {
//     if (!e.target.classList.contains('word')) {
//         translationBox.style.display = 'none';
//         document.querySelectorAll('.word').forEach(w => w.classList.remove('highlighted'));
//     }
// });






// // Функция для отображения перевода слова
// document.querySelectorAll('.word').forEach(wordElement => {
//     wordElement.addEventListener('click', async function() {
//         const word = this.textContent;
//         const translationBox = document.getElementById('translation-box');

//         try {
//             // Отправляем запрос на сервер для перевода слова
//             const response = await fetch(`/translate_word/${word}`);
//             const data = await response.json();

//             if (data.translation) {
//                 translationBox.innerText = `Word: ${data.translation}`;
//             } else if (data.error) {
//                 translationBox.innerText = `Ошибка: ${data.error}`;
//             }
//         } catch (error) {
//             translationBox.innerText = 'Ошибка при получении перевода.';
//         }

//         // Показываем перевод слова
//         translationBox.style.left = `${this.getBoundingClientRect().left + 25}px`;
//         translationBox.style.top = `${this.getBoundingClientRect().top - 10}px`; // UP 30
//         translationBox.style.display = 'block';
//     });
// });

// // Функция для отображения перевода предложения
// document.querySelectorAll('.sentence').forEach(sentenceElement => {
//     sentenceElement.addEventListener('click', async function() {
//         const sentence = this.textContent.trim(); // Убираем лишние пробелы
//         const sentenceTranslationBox = document.getElementById('sentence-translation-box');

//         try {
//             // Отправляем запрос на сервер для перевода предложения
//             const response = await fetch(`/translate_sentence/${sentence}`);
//             const data = await response.json();

//             if (data.translation) {
//                 sentenceTranslationBox.innerText = `Перевод предложения: ${data.translation}`;
//             } else if (data.error) {
//                 sentenceTranslationBox.innerText = `Ошибка: ${data.error}`;
//             }
//         } catch (error) {
//             sentenceTranslationBox.innerText = 'Ошибка при получении перевода.';
//         }

//         // Показываем перевод предложения
//         sentenceTranslationBox.style.left = `${this.getBoundingClientRect().left}px`;
//         sentenceTranslationBox.style.top = `${this.getBoundingClientRect().top + 20}px`; // Немного ниже
//         sentenceTranslationBox.style.display = 'block';
//     });
// });

// // Закрытие коробки с переводом при клике вне
// document.addEventListener('click', function(event) {
//     const translationBox = document.getElementById('translation-box');
//     const sentenceTranslationBox = document.getElementById('sentence-translation-box');
//     if (!event.target.closest('.word') && !event.target.closest('.sentence')) {
//         translationBox.style.display = 'none';
//         sentenceTranslationBox.style.display = 'none';
//     }
// });







// document.addEventListener("DOMContentLoaded", function() {
//     const wordElements = document.querySelectorAll('.word');
//     const translationBox = document.getElementById('translation-box');

//     wordElements.forEach(function(wordElement) {
//         wordElement.addEventListener('click', function() {
//             const word = wordElement.textContent;

//             // Получаем перевод и тип слова с сервера
//             fetch(`/translate_word/${word}`)
//                 .then(response => response.json())
//                 .then(data => {
//                     if (data.translation) {
//                         const translation = data.translation;
//                         const wordType = data.type;

//                         // Отображаем перевод и тип рядом с словом
//                         translationBox.textContent = `${word}: ${translation} (${wordType})`;
//                         translationBox.style.display = 'block';
                        
//                         // Устанавливаем позицию для окна с переводом
//                         const rect = wordElement.getBoundingClientRect();
//                         translationBox.style.left = `${rect.left}px`;
//                         translationBox.style.top = `${rect.top - 30}px`; // Отступ сверху
//                     }
//                 })
//                 .catch(error => console.error('Error:', error));
//         });
//     });

//     // Закрытие перевода при клике вне
//     document.body.addEventListener('click', function(e) {
//         if (!e.target.classList.contains('word')) {
//             translationBox.style.display = 'none';
//         }
//     });
// });



// document.addEventListener('DOMContentLoaded', () => {
//             const bookContent = document.getElementById('book-content');
//             const translationBox = document.getElementById('translation-box');
//             const savedWordsList = document.getElementById('saved-words-list');

//             // Обработчик для слов
//             bookContent.addEventListener('click', async function(event) {
//                 const wordOrSentence = event.target;

//                 if (wordOrSentence.classList.contains('word')) {
//                     const word = wordOrSentence.innerText;
//                     const translationInfo = await getWordTranslation(word);
//                     showTranslation(wordOrSentence, translationInfo);
//                 }
//             });

//             // Функция для получения перевода с API
//             async function getWordTranslation(word) {
//                 try {
//                     const response = await fetch(`/translate_word/${word}`);
//                     const data = await response.json();
//                     return data;
//                 } catch (error) {
//                     console.error("Ошибка при получении перевода", error);
//                     return { translation: "Ошибка", article: "Ошибка" };
//                 }
//             }

//             // Функция для отображения перевода
//             function showTranslation(element, translationInfo) {
//                 const rect = element.getBoundingClientRect();
//                 translationBox.style.left = rect.left + "px";
//                 translationBox.style.top = rect.bottom + "px";
//                 translationBox.style.display = 'block';
//                 translationBox.innerText = `Перевод: ${translationInfo.translation}\nАртикль: ${translationInfo.article}`;

//                 // Добавляем кнопку "Сохранить"
//                 const saveButton = document.createElement('button');
//                 saveButton.innerText = "Сохранить";
//                 saveButton.onclick = function() {
//                     saveWord(element.innerText, translationInfo.translation);
//                 };
//                 translationBox.appendChild(saveButton);
//             }

//             // Функция для сохранения слова
//             function saveWord(word, translation) {
//                 const savedWord = document.createElement('div');
//                 savedWord.classList.add('saved-word');
//                 savedWord.innerText = `${word}: ${translation}`;
//                 savedWord.onclick = function() {
//                     alert(`Перевод: ${translation}`);
//                 };
//                 savedWordsList.appendChild(savedWord);
//             }

//             // Закрыть перевод при клике вне области
//             document.addEventListener('click', function(event) {
//                 if (!translationBox.contains(event.target) && !event.target.classList.contains('word')) {
//                     translationBox.style.display = 'none';
//                 }
//             });
//         });

















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
    
        if (!translationInfo.article) {
            translationBox.innerHTML = `<b>G</b>: ${translationInfo.translation} `;
        } else {
            translationBox.innerHTML = `<b>Leo</b>: ${translationInfo.translation} `;
        }    
        
        // 🔊 Кнопка для озвучивания
        const speakButton = document.createElement('button');
        speakButton.innerText = "🔊";
        speakButton.addEventListener("click", function () {
            const utterance = new SpeechSynthesisUtterance(wordId);
            utterance.lang = "de"; // Устанавливаем немецкий язык
            speechSynthesis.speak(utterance);
        });
        translationBox.appendChild(speakButton);    

        if (translationInfo.article) {
            translationBox.innerHTML += `<br><i>${translationInfo.type}</i>: ${translationInfo.article} `
        }

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
    
    // function showTranslation(element, wordId, translationInfo) {
    //     const rect = element.getBoundingClientRect();
    //     const boxWidth = 200; // Задаем примерную ширину translationBox
    //     const padding = 10;   // Отступ от границ экрана
    
    //     if (!translationInfo.article) {
    //         translationBox.innerHTML = `<div><b>G</b>: ${translationInfo.translation}</div>`;
    //     } else {
    //         translationBox.innerHTML = `<div><b>Leo</b>: ${translationInfo.translation}<br><i>${translationInfo.type}</i>: ${translationInfo.article}</div>`;
    //         // translationBox.innerHTML = `<b>Leo</b>: ${translationInfo.translation} <button>🔊</button> <br><i>${translationInfo.type}</i>: ${translationInfo.article} `;
            
    //         // const textContainer = document.createElement("div");
    //         // textContainer.innerHTML = `<b>Leo</b>: ${translationInfo.translation}<br><i>${translationInfo.type}</i>: ${translationInfo.article}`;        
    //     }    
        
    //     // 🔊 Кнопка для озвучивания
    //     const speakButton = document.createElement('button');
    //     speakButton.innerText = "🔊";
    //     speakButton.style.position = "absolute";

    //     speakButton.style.top = "5px";
    //     speakButton.style.right = "5px";
    //     speakButton.style.background = "none";
    //     speakButton.style.border = "none";
    //     // speakButton.style.cursor = "pointer";
    //     // speakButton.style.fontSize = "16px";

    //     speakButton.addEventListener("click", function () {
    //         const utterance = new SpeechSynthesisUtterance(wordId);
    //         utterance.lang = "de"; // Устанавливаем немецкий язык
    //         speechSynthesis.speak(utterance);
    //     });

    
    //     const saveButton = document.createElement('button');
    //     saveButton.innerText = savedWords[wordId] ? "❌" : "➕";

    //     saveButton.style.position = "absolute";

    //     saveButton.style.bottom = "5px";
    //     saveButton.style.right = "5px";
    //     saveButton.style.background = "none";
    //     saveButton.style.border = "none";
    //     // saveButton.style.cursor = "pointer";
    //     // saveButton.style.fontSize = "16px";
        
    //     saveButton.addEventListener("click", function toggleWord() {
    //         if (savedWords[wordId]) {
    //             removeWord(wordId);
    //             element.classList.remove('save-word');
    //             saveButton.innerText = "➕";
    //         } else {
    //             saveWord(wordId, translationInfo.translation);
    //             element.classList.add('save-word');
    //             saveButton.innerText = "❌";
    //         }
    //     });

    //     // translationBox.appendChild(textContainer);
    //     translationBox.appendChild(speakButton);    
    //     translationBox.appendChild(saveButton);

    //     translationBox.style.display = 'block';
    
    //     // let left = rect.left + window.scrollX;
    //     // let top = rect.top + window.scrollY - translationBox.offsetHeight - 5;
    
    //     // // Проверяем, не выходит ли блок за левую границу
    //     // if (left < padding) {
    //     //     left = padding;
    //     // }
    
    //     // // Проверяем, не выходит ли блок за правую границу
    //     // if (left + boxWidth > window.innerWidth - padding) {
    //     //     left = window.innerWidth - boxWidth - padding;
    //     // }

    //     let left = rect.left + window.scrollX;
    //     let top = rect.top + window.scrollY - translationBox.offsetHeight - 5;
    
    //     // Проверяем границы экрана
    //     if (left < padding) left = padding;
    //     if (left + boxWidth > window.innerWidth - padding) left = window.innerWidth - boxWidth - padding;
    
    
    //     translationBox.style.left = `${left}px`;
    //     translationBox.style.top = `${top}px`;
    // }

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
            utterance.lang = "de"; // Устанавливаем немецкий язык
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


