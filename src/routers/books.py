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
PARAGRAPH_SPLIT_RE = re.compile(r'\n{2,}') # \n\n  


def wrap_content(content: str) -> str:
    escape = html.escape  # локальное сокращение для скорости (в 3–5 раз быстрее)
    # append = str.append if hasattr(str, "append") else None  # на случай будущей оптимизации

    # parts = ["<div class='book-content'>"]  # буфер для итоговой строки
    parts = []  # буфер для итоговой строки

    # Разбиваем по абзацам, фильтруя пустые строки без .strip() (быстрее)
    for paragraph in filter(None, PARAGRAPH_SPLIT_RE.split(content)):
        if not paragraph:
            continue



        parts.append("<p>")
        for sentence in SENTENCE_SPLIT_RE.split(paragraph):
            if not sentence:
                continue
            parts.append('<span class="sentence">')

            for token in TOKENIZE_RE.findall(sentence):
                # Прямая проверка символов вместо regex — быстрее
                if token.isalnum() or '-' in token:
                    esc = escape(token)
                    parts.append(f' <span id="{esc}" class="word">{esc}</span>')
                else:
                    parts.append(token)

            parts.append("</span> ")
        parts.append("</p>")

    # parts.append("</div>")
    return ''.join(parts)




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
