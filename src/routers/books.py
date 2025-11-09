import os
from flask import Blueprint, render_template, jsonify
from config import BASE_DIR

books_bp = Blueprint("books_bp", __name__)

from functools import lru_cache
# Кэширование при больших текстах
@lru_cache(maxsize=128)
def load_book_text(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()
    

import re
import html

# Предкомпилируем регулярки (ускоряет в 2–3 раза при больших текстах)
SENTENCE_SPLIT_RE = re.compile(r'(?<!\w\.\w)(?<![A-ZА-Я]\.)(?<=\.)\s+')
TOKENIZE_RE = re.compile(r'\b[\w-]+\b|[,:\"\'()*?!.]')    

def wrap_content(content: str) -> str:
    # Экранируем HTML, чтобы не сломать страницу (например, если в тексте есть <, >)
    content = html.escape(content)

    paragraphs_html = []

     # Используем генераторы и списки для скорости
    for paragraph in filter(None, content.split('\n')):
        sentences = SENTENCE_SPLIT_RE.split(paragraph)
        sentence_html_list = []

        for sentence in sentences:
            tokens = TOKENIZE_RE.findall(sentence)
            
            # Составляем предложение: слова оборачиваются, знаки — нет
            token_spans = [
                f'<span id="{html.escape(token)}" class="word">{token}</span>'
                if token.isalnum() or "-" in token
                else token
                for token in tokens
            ]
            # Каждое предложение в <span>
            sentence_html_list.append(
                f'<span class="sentence">{" ".join(token_spans)}</span>'
            )


        # Добавляем абзац с <span>
        paragraphs_html.append(f"<p>{' '.join(sentence_html_list)}</p>")  
    return '\n'.join(paragraphs_html)



@books_bp.route("/book/<folder_name>")
def book_page(folder_name):
    try:
        folder_path = os.path.join(BASE_DIR, folder_name)
        if not os.path.commonpath([BASE_DIR, folder_path]) == BASE_DIR:
            return jsonify({"error": "Недопустимый путь"}), 400

        file_path = os.path.join(folder_path, "text.txt")
        if not os.path.exists(file_path):
            return jsonify({"error": "File not found"}), 404
        

        content = load_book_text(file_path)
        if not content.strip():
            return render_template('book.html', title=folder_name, content="<p><em>Файл пуст.</em></p>")


        paragraphs_html = wrap_content(content)
            
        # Отображаем в HTML
        return render_template('book.html', title=folder_name, content=paragraphs_html)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
