// Работа с сохранением слов в localStorage
const STORAGE_KEY = 'savedWords';

function loadWords() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
}
function _save(words) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
}
function saveWord(word, translation, bookName) {
  const words = loadWords();
  if (words[word]) {
    if (!words[word].books.includes(bookName))
      words[word].books.push(bookName);
  } else {
    words[word] = { translation, books: [bookName], addedAt: Date.now() };
  }
  _save(words);
}
function removeWord(word) {
  const words = loadWords();
  delete words[word];
  _save(words);
}
function editTranslation(word, newTranslation) {
  const words = loadWords();
  if (!words[word]) return false;
  words[word].translation = newTranslation.trim();
  words[word].editedAt = Date.now();
  _save(words);
  return true;
}
function renameWord(oldWord, newWord) {
  const words = loadWords();
  if (!words[oldWord] || oldWord === newWord || words[newWord]) return false;
  words[newWord] = { ...words[oldWord], editedAt: Date.now() };
  delete words[oldWord];
  _save(words);
  return true;
}
function renameBookInStorage(oldName, newName) {
  const words = loadWords();
  let changed = false;

  Object.values(words).forEach(data => {
    if (!Array.isArray(data.books)) return;
    const updated = data.books.map(book => (book === oldName ? newName : book));
    if (updated.some((book, index) => book !== data.books[index])) {
      data.books = updated;
      changed = true;
    }
  });

  if (changed) _save(words);
}
function getWordsForBook(bookName) {
  return Object.entries(loadWords())
    .filter(([_, v]) => v.books.includes(bookName));
}
function getAllWords() {
  return Object.entries(loadWords());
  // → [["Leder", {translation, books, addedAt}], ...]
}