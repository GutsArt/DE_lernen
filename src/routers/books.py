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
HEADING_RE = re.compile(r'^(#{1,6})\s*(.+)$')  # поддержка #...###### заголовков


def tokenize_to_html(text: str) -> str:
    """Разбивает строку на слова и пунктуацию, оборачивает в HTML."""
    escape = html.escape
    parts = []
    for sentence in SENTENCE_SPLIT_RE.split(text):
        if not sentence:
            continue
        parts.append('<span class="sentence">')
        for token in TOKENIZE_RE.findall(sentence):
            if token.isalnum() or '-' in token:
                esc = escape(token)
                parts.append(f' <span id="{esc}" class="word">{esc}</span>')
            else:
                parts.append(token)
        parts.append("</span> ")
    return ''.join(parts)

def wrap_content(content: str) -> str:
    escape = html.escape
    parts = []

    # Разделяем текст по двойным переводам строк
    for block in filter(None, PARAGRAPH_SPLIT_RE.split(content.strip())):
        block_stripped = block.strip()
        heading_match = HEADING_RE.match(block_stripped)
        if heading_match:
            level = len(heading_match.group(1))
            text = heading_match.group(2).strip()
            parts.append(f"<h{level}>{tokenize_to_html(text)}</h{level}>")
        else:
            parts.append(f"<p>{tokenize_to_html(block_stripped)}</p>")

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
