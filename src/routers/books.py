import os
import re
from flask import Blueprint, render_template, jsonify
from config import BASE_DIR

books_bp = Blueprint("books_bp", __name__)

@books_bp.route("/book/<folder_name>")
def book_page(folder_name):
    try:
        folder_path = os.path.join(BASE_DIR, folder_name)
        file_path = os.path.join(folder_path, "text.txt")

        if not os.path.exists(file_path):
            return jsonify({"error": "File not found"}), 404
        
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        paragraphs = content.split('\n')  # Разбиваем по абзацам

        paragraphs_html = f"<h2>{folder_name}</h2>"

        for paragraph in paragraphs:
            paragraph_html = ""
            # Разбиваем абзац на предложения (учитываем точки перед пробелами)
            sentences = re.split(r'(?<!\w\.\w)(?<![A-ZА-Я]\.)(?<=\.)\s+', paragraph)

            for sentence in sentences:
                sentence_html = ""

                # Разделяем текст на слова и знаки препинания (они должны быть отдельными токенами)
                words_and_punctuation = re.findall(r'\b[\w-]+\b|[,:\"\'()*?!.]', sentence)

                for token in words_and_punctuation:
                    if re.match(r'[\w-]+', token):  # Это слово (разрешены дефисы)
                        sentence_html += f' <span id="{token}" class="word">{token}</span>'
                    else:  # Это знак препинания
                        sentence_html += f'{token}'

                # Каждое предложение в <span>
                paragraph_html += f'<span class="sentence">{sentence_html.strip()}</span> '  

            # Добавляем абзац с <span>
            paragraphs_html += f'<p>{paragraph_html.strip()}</p>'

            
        # Отображаем в HTML
        return render_template('book.html', content=paragraphs_html)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
