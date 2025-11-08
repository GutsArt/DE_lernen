import os
import shutil
from flask import Blueprint, jsonify, request
from utils.storage import load_index, save_index
from config import BASE_DIR

folders_bp = Blueprint("folders_bp", __name__)

# Получить список всех книг
@folders_bp.route("/folders-info")
def folders_info():
    try:
        folders = load_index()
        return jsonify(folders)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Добавить новую книгу
@folders_bp.route("/add-folder", methods=["POST"])
def add_folder():
    try:
        data = request.json
        title = data.get("title")
        author = data.get("author", "")
        difficulty = data.get("difficulty", "")
        image = data.get("image", "")

        if not title:
            return jsonify({"error": "Название книги обязательно"}), 400

        folder_name = title
        folder_path = os.path.join(BASE_DIR, folder_name)

        if os.path.exists(folder_path):
            return jsonify({"error": "Папка уже существует"}), 400

        # создаём папку и пустой text.txt
        os.makedirs(folder_path)
        with open(os.path.join(folder_path, "text.txt"), "w", encoding="utf-8") as f:
            f.write("")

        # обновляем index.json
        index = load_index()
        index.append({
            "folder_name": folder_name,
            "title": title,
            "author": author,
            "difficulty": difficulty,
            "image": image
        })
        save_index(index)

        return jsonify({"message": "Книга добавлена"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Редактировать данные книги
@folders_bp.route("/edit-folder/<folder_name>", methods=["POST"])
def edit_folder(folder_name):
    try:
        data = request.json
        index = load_index()
        book = next((b for b in index if b["folder_name"] == folder_name), None)
        if not book:
            return jsonify({"error": "Книга не найдена"}), 404

        old_folder_path = os.path.join(BASE_DIR, folder_name)
        new_title = data.get("title", book["title"])
        new_folder_path = os.path.join(BASE_DIR, new_title)

        # Проверяем, нужно ли переименовать папку
        if new_title != folder_name:
            if os.path.exists(new_folder_path):
                return jsonify({"error": "Папка с новым названием уже существует"}), 400
            os.rename(old_folder_path, new_folder_path)
            book["folder_name"] = new_title
            book["title"] = new_title

        # Обновляем поля
        book["author"] = data.get("author", book["author"])
        book["difficulty"] = data.get("difficulty", book["difficulty"])
        book["image"] = data.get("image", book.get("image", ""))

        save_index(index)
        return jsonify({"message": "Данные обновлены"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Удалить книгу
@folders_bp.route("/delete-folder/<path:folder_name>", methods=["DELETE"])
def delete_folder(folder_name):
    try:
        folder_path = os.path.join(BASE_DIR, folder_name)

        if os.path.exists(folder_path):
            shutil.rmtree(folder_path)

        index = load_index()
        index = [f for f in index if f["folder_name"] != folder_name]
        save_index(index)

        return jsonify({"message": "Книга удалена"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
