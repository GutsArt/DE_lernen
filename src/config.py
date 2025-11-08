import os

BASE_DIR = os.path.join(os.path.dirname(__file__), "My texts")
INDEX_FILE = os.path.join(BASE_DIR, "index.json")

# print("Существует ли папка:", os.path.isdir(BASE_DIR))
# print("Существует ли файл:", os.path.isfile(INDEX_FILE))
