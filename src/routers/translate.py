from flask import Blueprint, jsonify, request
import requests
from bs4 import BeautifulSoup
# from utils.parsers import get_word_type, get_word_translate
from utils.translator import translate_sentence

translate_bp = Blueprint("translate", __name__)

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
    NOT_FOUND = {"translation": "Не знайдено", "article": "Не знайдено"}
    
    section = soup.find("div", {"aria-atomic": "true", "class": "section wgt c-link", "data-dz-role": "section"})
    if not section:
        return NOT_FOUND
    
    table = section.find("table", {"class": "tblf1 tblf-fullwidth tblf-alternate"})
    if not table:
        return NOT_FOUND
    
    tbody = table.find("tbody")
    tr = tbody.find("tr")
    tds = tr.find_all("td", {"data-dz-attr": "relink"})
    
    if not tds:
        return NOT_FOUND
    
    # --- Translation ---
    td_first = tds[0] if tds[0] else (tds[1] if tds[1] else None) # Select the first translation cell, fallback to second if empty
    if not td_first:
        return NOT_FOUND
    
    # Remove unwanted tags that contain metadata or formatting
    unwanted_tags = ['small', 'mark', 'sup']
    for tag in td_first.find_all(unwanted_tags):
        tag.decompose()
    
    raw_text = td_first.get_text()    
    trans_table = str.maketrans({
        '\xa0': '',  # Non-breaking space
        '[': '',
        ']': '',
        '-': '',
    })
    translation = raw_text.translate(trans_table)
    
    translation = translation.replace("[REL.]", "").strip() # Remove specific substrings and normalize whitespace


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


@translate_bp.route('/translate_word/<word>', methods=['GET'])
def translate_word(word):
    url = f"https://dict.leo.org/russisch-deutsch/{word}"
    try:
        response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
        soup = BeautifulSoup(response.text, "html.parser")

        word_type = get_word_type(soup)
        translation_info = get_word_translate(soup)

        if translation_info["translation"] == "Не знайдено":
            return jsonify({"translation": translate_sentence(word)})

        return jsonify({
            "word": word,
            "type": word_type,
            "translation": translation_info["translation"],
            "article": translation_info["article"]
        })
    except Exception as e:
        try:
            return jsonify({"translation": translate_sentence(word)})
        except Exception as e2:
            return jsonify({"error": f"{str(e)}; {str(e2)}"}), 500
    
 
### Translate full sentences with Google Translate
@translate_bp.route('/translate_sentence', methods=['POST'])
def translate_sentence_route():
    data = request.get_json()
    sentence = (data or {}).get('sentence', '').strip()
    if not sentence:
        return jsonify({"error": "No sentence provided"}), 400
    try:
        return jsonify({"translation": translate_sentence(sentence)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500