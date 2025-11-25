from flask import Flask, render_template

from routers.folders import folders_bp  # импортируем Blueprint
from routers.books import books_bp  # импортируем Blueprint
from routers.translate import translate_bp  # импортируем Blueprint

app = Flask(__name__, static_folder="static", template_folder="templates")

# Регистрация Blueprint
app.register_blueprint(folders_bp)

app.register_blueprint(books_bp)

app.register_blueprint(translate_bp)

@app.route("/")
def home():
    return render_template("index.html")

if __name__ == "__main__":
    app.run(debug=True)
