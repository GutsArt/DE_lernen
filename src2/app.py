from flask import Flask, render_template, jsonify
import os
import json
from googletrans import Translator # type: ignore
import re

import requests
from bs4 import BeautifulSoup


app = Flask(__name__)

BASE_FOLDER = 'My texts'  # Путь к директории "My texts"

# Роут для отображения всех папок
@app.route('/')
def home():
    return render_template('index.html')

# Роут для получения информации обо всех папках
@app.route('/folders-info')
def folders_info():
    folders = []
    for folder_name in os.listdir(BASE_FOLDER):
        folder_path = os.path.join(BASE_FOLDER, folder_name)
        
        # Проверка, что это папка и что в ней есть файл index.json
        if os.path.isdir(folder_path) and os.path.exists(os.path.join(folder_path, 'index.json')):
            with open(os.path.join(folder_path, 'index.json'), 'r', encoding='utf-8') as file:
                data = json.load(file)
                folders.append({
                    'folder_name': folder_name,
                    'title': data.get('title', 'No Title'),
                    'image': data.get('image', ''),
                    'author': data.get('author', 'Unknown'),
                    'genres': data.get('genres', []),
                    'language': data.get('language', 'Unknown'),
                    'difficulty': data.get('difficulty', 'Not Specified'),
                    'year': data.get('year', 'Not Specified'),
                    'pages': data.get('pages', 'Not Specified'),
                    'description': data.get('description', 'No Description')
                })
    
    return jsonify(folders)

# Роут для получения текста из text.txt и отображение его как HTML
@app.route('/book/<folder_name>')
def get_book_content(folder_name):
    file_path = os.path.join(BASE_FOLDER, folder_name, 'text.txt')
    
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404
    
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()

    paragraphs = content.split('\n')  # Разбиваем по абзацам

    paragraphs_html = f"<h2>{folder_name}</h2>"

    for paragraph in paragraphs:
        paragraph_html = ""

        # # Разбиваем абзац на предложения
        # sentences = paragraph.split('. ')  # Предполагается, что предложения разделяются точками и пробелами

        # for sentence in sentences:
        #     sentence_html = ""

        #     # Разбиваем предложение на слова
        #     for word in sentence.split():
        #         # word_id = f"word-{word}"

        #         sentence_html += f'<span id="{word}" class="word">{word}</span> '  
        #         # print(f'Generated <span>: id="{word}" for word="{word}"')  # Отладочное сообщение
            
        #     # Каждое предложение в <span>
        #     paragraph_html += f'<span class="sentence">{sentence_html.strip()}</span>. '  # Добавляем точку в конец предложения
        
        # # Добавляем абзац с <span>
        # paragraphs_html += f'<p>{paragraph_html.strip()}</p>'

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





# def get_word_type(soup):
#     valid_types = ["Adjektive / Adverbien", "Verben", "Substantive", "Präpositionen / Pronomen / ..."]
    
#     for thead in soup.find_all("thead"):
#         header = thead.find("h2", class_="ta-c tf-bold p-v bg-darkyellow")
#         if header and header.get_text(strip=True) in valid_types:
#             print(header)
#             valid_types = {
#                 "Adjektive / Adverbien": "Adj|Adv",
#                 "Verben": "V",
#                 "Substantive": "Sub",
#                 "Präpositionen / Pronomen / ...": "Pronomen"
#             }
#             return header.get_text(strip=True)
    
#     return "No type"
def get_word_type(soup):
    valid_types = {
        "Adjektive / Adverbien": "Adj/Adv",
        "Verben": "V",
        "Substantive": "Sub",
        "Präpositionen / Pronomen / ...": "Pronomen"
    }
    
    for thead in soup.find_all("thead"):
        header = thead.find("h2", class_="ta-c tf-bold p-v bg-darkyellow")
        
        if header and header.get_text(strip=True) in valid_types:
            # Возвращаем соответствующее значение из словаря valid_types
            return valid_types[header.get_text(strip=True)]
    
    return None


def get_word_translate(soup):
    section = soup.find("div", {"aria-atomic": "true", "class": "section wgt c-link", "data-dz-role": "section"})
    if not section:
        return {"translation": "Не найдено", "article": "Не найдено"}
    
    table = section.find("table", {"class": "tblf1 tblf-fullwidth tblf-alternate"})
    if not table:
        return {"translation": "Не найдено", "article": "Не найдено"}
    
    tbody = table.find("tbody")
    tr = tbody.find("tr")
    tds = tr.find_all("td", {"data-dz-attr": "relink"})
    
    if not tds:
        return {"translation": "Не найдено", "article": "Не найдено"}
    
    # translation = tds[0].find("a").text if tds[0].find("a") else "Не найдено"
    td_first = tds[0].find("a")
    if td_first:
        td_first = td_first.text.strip()
    else:
        td_first = tds[0].find("samp").text 
        # td_first.replace("|\xa0", "|").replace("\xa0|", "|").strip()
        td_first = td_first.replace("\xa0", "").replace("[REL.]", "").strip()
    translation = td_first


    article = ""
    
    if tds[-1]:
        samp = tds[-1].find("samp")
        if samp:
            links = samp.find_all("a")
            if links:
                article = " ".join([a.get_text(strip=True) for a in links])
                article = article.replace("|\xa0", "|").replace("\xa0|", "|").strip()
                article = article.replace("Pl.:", "| ")
            else:
                article = samp.get_text(strip=True)
    
    return {"translation": translation, "article": article}

@app.route('/translate_word/<word>', methods=['GET'])
def translate_word(word):
    url = f"https://dict.leo.org/russisch-deutsch/{word}"
    try:
        response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
        soup = BeautifulSoup(response.text, 'html.parser')
        
        word_type = get_word_type(soup)
        translation_info = get_word_translate(soup)

        if translation_info["translation"] == "Не найдено":
            return translate_sentence(word)
            # sentence_translation = translate_sentence(word)
            # return jsonify({
            #     "translation": sentence_translation.json['translation'],  # Извлекаем перевод
            #     'article': None
            # })
        
        return jsonify({
            'word': word,
            'type': word_type,
            "translation": translation_info["translation"],
            'article': translation_info["article"]
        })
    except Exception as e:
        return jsonify({'error': str(e)})
        # return translate_sentence(word)
    
translator = Translator()
# # API для перевода предложения
# @app.route('/translate_sentence/<sentence>', methods=['GET'])
# def translate_sentence(sentence):
#     try:
#         # Переводим предложение
#         translated = translator.translate(sentence, src='de', dest='ru')
#         return jsonify({'translation': translated.text})
#     except Exception as e:
#         return jsonify({'error': str(e)})

@app.route('/translate_sentence/<sentence>', methods=['GET'])
def translate_sentence(sentence):
    try:
        translated = translator.translate(sentence, src='de', dest='ru')
        return jsonify({'translation': translated.text})
    except Exception as e:
        return jsonify({'error': str(e)})   


# Запуск приложения
if __name__ == '__main__':
    # app.run(debug=True)
    app.run(host='0.0.0.0', port=5000, debug=True)
    # app.run(host='127.0.0.1', port=5000, debug=True)




#  #%%
# 10**10**10  
