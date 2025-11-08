from flask import Flask, jsonify, request, render_template
import os
from googletrans import Translator # type: ignore
import re
import requests
from bs4 import BeautifulSoup

from routers.folders import folders_bp  # импортируем Blueprint
from routers.books import books_bp  # импортируем Blueprint

app = Flask(__name__, static_folder="static", template_folder="templates")

# Регистрация Blueprint
app.register_blueprint(folders_bp)

app.register_blueprint(books_bp)

@app.route("/")
def home():
    return render_template("index.html")


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
# API для перевода предложения
@app.route('/translate_sentence/<sentence>', methods=['GET'])
def translate_sentence(sentence):
    try:
        translated = translator.translate(sentence, src='de', dest='ru')
        return jsonify({'translation': translated.text})
    except Exception as e:
        return jsonify({'error': str(e)})  


if __name__ == "__main__":
    app.run(debug=True)
