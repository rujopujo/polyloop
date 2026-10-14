import tensorflow as tf
import cv2
import easyocr
import streamlit
import sklearn
import thefuzz

print("tensorflow :", tf.__version__)
print("opencv     :", cv2.__version__)
print("easyocr    :", easyocr.__version__)
print("streamlit  :", streamlit.__version__)
print("sklearn    :", sklearn.__version__)
print("thefuzz    :", thefuzz.__version__)
print("GPU devices:", tf.config.list_physical_devices("GPU"))
print()
print("All imports OK.")
