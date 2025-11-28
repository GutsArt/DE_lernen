from googletrans import Translator

translator = Translator()

def translate_sentence(sentence, src='de', dest='ru'):
    translated = translator.translate(sentence, src=src, dest=dest)
    return translated.text
